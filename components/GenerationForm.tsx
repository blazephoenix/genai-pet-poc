"use client";

import React from "react";
import { Services, useGame } from "@/lib/game/provider";

export function GenerationForm(): JSX.Element {
  const { state, dispatch } = useGame();
  const [prompt, setPrompt] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");

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
      const img: string = await Services.ai.generateRoomImage(trimmed, state.player.currentView);
      dispatch({ type: "UPDATE_ROOM_LOOK", room: state.player.currentView, backgroundImage: img });
    } catch (err) {
      setError("Failed to generate image. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center bg-black/40 backdrop-blur px-3 py-2 rounded text-white">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the room look..."
        className="px-3 py-2 rounded border border-white/30 w-72 bg-transparent placeholder:text-white/70 text-white"
        aria-label="Prompt"
      />
      <button type="submit" className="px-3 py-2 rounded border border-white/30" disabled={isLoading}>
        {isLoading ? "Generating..." : "Redecorate"}
      </button>
      {error.length > 0 && <span className="text-red-300">{error}</span>}
    </form>
  );
}


