"use client";

import React from "react";

interface MaskEditorProps {
  open: boolean;
  width: number;
  height: number;
  initialMask?: string; // data URL
  onClose: (result: { saved: boolean; mask?: string }) => void;
}

export function MaskEditor(props: MaskEditorProps): React.ReactElement | null {
  const { open, width, height, initialMask, onClose } = props;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState<boolean>(false);
  const [brushSize, setBrushSize] = React.useState<number>(28);
  const [mode, setMode] = React.useState<"paint" | "erase">("paint");

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }
    if (typeof initialMask === "string" && initialMask.startsWith("data:")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialMask;
    } else {
      // Start with black mask (preserve entire image)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }
  }, [open, width, height, initialMask]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }
    ctx.fillStyle = mode === "paint" ? "white" : "black";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur flex flex-col items-center justify-center gap-3 p-4">
      <div className="text-white">Paint white where edits are allowed. Black preserves the scene.</div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-transparent touch-none border border-white/30"
          onPointerDown={(e) => {
            setIsDrawing(true);
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
            handlePointer(e);
          }}
          onPointerMove={handlePointer}
          onPointerUp={(e) => {
            setIsDrawing(false);
            (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
          }}
          onPointerLeave={() => setIsDrawing(false)}
          width={width}
          height={height}
        />
      </div>
      <div className="flex items-center gap-3 text-white">
        <label className="flex items-center gap-2 text-sm">
          Brush
          <input type="range" min={4} max={64} step={2} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as "paint" | "erase")} className="bg-transparent border border-white/30 rounded px-2 py-1">
            <option value="paint">Paint (white)</option>
            <option value="erase">Erase (black)</option>
          </select>
        </label>
        <button
          className="px-3 py-2 rounded border border-white/30"
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas === null) {
              onClose({ saved: false });
              return;
            }
            const ctx = canvas.getContext("2d");
            if (ctx !== null) {
              ctx.fillStyle = "black";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }}
        >
          Clear
        </button>
        <button
          className="px-3 py-2 rounded border border-white/30"
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas === null) {
              onClose({ saved: false });
              return;
            }
            const mask = canvas.toDataURL("image/png");
            onClose({ saved: true, mask });
          }}
        >
          Save mask
        </button>
        <button className="px-3 py-2 rounded border border-white/30" onClick={() => onClose({ saved: false })}>
          Cancel
        </button>
      </div>
    </div>
  );
}


