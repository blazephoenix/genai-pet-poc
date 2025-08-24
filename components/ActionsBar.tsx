"use client";

import React from "react";
import { useGame } from "@/lib/game/provider";

export function ActionsBar(): JSX.Element {
  const { state, dispatch } = useGame();
  const canFeed: boolean = state.player.currentView === "Kitchen" && state.pet.currentRoom === "Kitchen";
  const canPlay: boolean = state.player.currentView === "Living Room" && state.pet.currentRoom === "Living Room";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/40 backdrop-blur text-white px-3 py-2 rounded shadow">
      <button
        type="button"
        className="px-3 py-2 rounded border border-white/30 disabled:opacity-50"
        onClick={() => dispatch({ type: "FEED" })}
        disabled={!canFeed}
      >
        Feed
      </button>
      <button
        type="button"
        className="px-3 py-2 rounded border border-white/30 disabled:opacity-50"
        onClick={() => dispatch({ type: "PLAY_WITH_PET" })}
        disabled={!canPlay}
      >
        Play (Hide & Seek)
      </button>
    </div>
  );
}


