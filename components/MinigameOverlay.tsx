"use client";

import React from "react";
import { useGame } from "@/lib/game/provider";
import type { HideAndSeekObject } from "@/lib/game/types";

const OBJECTS: ReadonlyArray<HideAndSeekObject> = ["Couch", "Lamp", "Rug"];

export function MinigameOverlay(): JSX.Element | null {
  const { state, dispatch } = useGame();
  const mg = state.minigame;
  if (mg === null) {
    return null;
  }

  const guess = (obj: HideAndSeekObject): void => {
    dispatch({ type: "GUESS_HIDING_SPOT", guess: obj });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
      <div className="bg-white text-black rounded p-4 w-[320px] shadow-xl">
        <div className="mb-3 font-semibold">{mg.status === "idle" ? "Get ready!" : mg.message}</div>
        {mg.status !== "found" && (
          <div className="flex gap-2 mb-3">
            {OBJECTS.map((obj) => (
              <button key={obj} className="px-3 py-2 rounded border" onClick={() => guess(obj)}>
                {obj}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {mg.status === "idle" && (
            <button className="px-3 py-2 rounded border" onClick={() => dispatch({ type: "START_MINIGAME" })}>
              Start
            </button>
          )}
          {mg.status === "found" && (
            <button className="px-3 py-2 rounded border" onClick={() => dispatch({ type: "END_MINIGAME" })}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


