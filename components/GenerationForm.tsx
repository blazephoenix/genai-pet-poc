"use client";

import React from "react";
import { Services, useGame } from "@/lib/game/provider";
import { MaskEditor } from "@/components/MaskEditor";

export function GenerationForm(): React.ReactElement {
  const { state, dispatch } = useGame();
  const [prompt, setPrompt] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [useFurnitureMask, setUseFurnitureMask] = React.useState<boolean>(true);
  const [seed, setSeed] = React.useState<number>(1);
  const [strength, setStrength] = React.useState<number>(0.2);
  const [maskEditorOpen, setMaskEditorOpen] = React.useState<boolean>(false);
  const [userMask, setUserMask] = React.useState<string | undefined>(undefined);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmed: string = prompt.trim();
    if (trimmed.length === 0) {
      setError("Please enter a prompt.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const currentBg: string = state.house.rooms[state.player.currentView].backgroundImage;
      // Ensure we pass a reasonably small data URL; if it's a relative URL, fetch and convert,
      // then downscale to keep payload size under typical API limits.
      const toDataUrl = async (src: string): Promise<string> => {
        if (src.startsWith("data:")) {
          return src;
        }
        if (src.startsWith("/")) {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const reader = new FileReader();
          const data: string = await new Promise((resolve) => {
            reader.onloadend = () => resolve(String(reader.result));
            reader.readAsDataURL(blob);
          });
          return data;
        }
        return src;
      };

      const sourceImageRaw: string = await toDataUrl(currentBg);

      const downscaleDataUrl = async (dataUrl: string): Promise<string> => {
        try {
          // Create image element to read dimensions
          const img = new Image();
          img.crossOrigin = "anonymous";
          const loaded: HTMLImageElement = await new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Image load error"));
            img.src = dataUrl;
          });

          // Enforce a safe size for all rooms
          const maxW = 896;
          const maxH = 504;
          const { width, height } = loaded;
          const ratio = Math.min(maxW / Math.max(1, width), maxH / Math.max(1, height), 1);
          const targetW = Math.max(1, Math.floor(width * ratio));
          const targetH = Math.max(1, Math.floor(height * ratio));

          // If already small, return original
          if (ratio === 1) {
            return dataUrl;
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (ctx === null) {
            return dataUrl;
          }
          ctx.drawImage(loaded, 0, 0, targetW, targetH);
          // Prefer PNG for crisp vectors; if still large, fallback to WebP
          const pngData = canvas.toDataURL("image/png");
          // Rough check: if > 2.5MB, try webp at quality 0.82
          if (pngData.length > 2_500_000 * 1.37) { // base64 overhead factor ~1.37
            const webp = canvas.toDataURL("image/webp", 0.82);
            return webp;
          }
          return pngData;
        } catch {
          return dataUrl;
        }
      };

      const createFurnitureMask = async (source: string): Promise<string> => {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const loaded: HTMLImageElement = await new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Mask load error"));
            img.src = source;
          });
          const w = loaded.width;
          const h = loaded.height;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx === null) {
            return "";
          }
          // Start with black (preserve)
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, w, h);
          // White = editable regions. Approximate furniture areas:
          // Bottom band (rug/sofa area)
          ctx.fillStyle = "white";
          ctx.fillRect(0, Math.floor(h * 0.55), w, Math.floor(h * 0.45));
          // Left cabinet area
          ctx.fillRect(0, Math.floor(h * 0.30), Math.floor(w * 0.22), Math.floor(h * 0.60));
          // Right shelves/frames area
          ctx.fillRect(Math.floor(w * 0.78), Math.floor(h * 0.20), Math.floor(w * 0.22), Math.floor(h * 0.60));
          return canvas.toDataURL("image/png");
        } catch {
          return "";
        }
      };

      const sourceImage: string = await downscaleDataUrl(sourceImageRaw);
      const mask: string | undefined = userMask ?? (useFurnitureMask ? await createFurnitureMask(sourceImage) : undefined);
      const img: string = await Services.ai.generateRoomImage(trimmed, state.player.currentView, { sourceImage, mask, seed, strength });
      dispatch({ type: "UPDATE_ROOM_LOOK", room: state.player.currentView, backgroundImage: img });
    } catch {
      setError("Failed to generate image. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-3 items-center bg-black/40 backdrop-blur px-3 py-2 rounded text-white">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the room look..."
        className="px-3 py-2 rounded border border-white/30 w-72 bg-transparent placeholder:text-white/70 text-white"
        aria-label="Prompt"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={useFurnitureMask} onChange={(e) => setUseFurnitureMask(e.target.checked)} />
        Mask furniture only
      </label>
      <button
        type="button"
        className="px-3 py-2 rounded border border-white/30"
        onClick={() => setMaskEditorOpen(true)}
      >
        Edit mask
      </button>
      <label className="flex items-center gap-2 text-sm">
        Strength
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        Seed
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
          className="w-20 px-2 py-1 rounded border border-white/30 bg-transparent"
        />
      </label>
      <button type="submit" className="px-3 py-2 rounded border border-white/30" disabled={isLoading}>
        {isLoading ? "Generating..." : "Redecorate"}
      </button>
      {error.length > 0 && <span className="text-red-300">{error}</span>}
      <MaskEditor
        open={maskEditorOpen}
        width={896}
        height={504}
        initialMask={userMask}
        onClose={(result) => {
          setMaskEditorOpen(false);
          if (result.saved && typeof result.mask === "string") {
            setUserMask(result.mask);
          }
        }}
      />
    </form>
  );
}


