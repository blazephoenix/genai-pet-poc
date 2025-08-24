"use client";

import React from "react";
import type { RoomName } from "@/lib/game/types";
import { useGame } from "@/lib/game/provider";

const ROOMS: ReadonlyArray<RoomName> = ["Living Room", "Kitchen", "Bedroom"];

export function NavigationBar(): JSX.Element {
  const { state, dispatch } = useGame();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/40 backdrop-blur text-white px-3 py-2 rounded shadow">
      {ROOMS.map((room) => (
        <button
          key={room}
          type="button"
          className={`px-3 py-2 rounded border border-white/30 ${state.player.currentView === room ? "bg-white text-black" : "bg-transparent text-white"}`}
          onClick={() => dispatch({ type: "NAVIGATE", room })}
          aria-pressed={state.player.currentView === room}
        >
          {room}
        </button>
      ))}
    </div>
  );
}


