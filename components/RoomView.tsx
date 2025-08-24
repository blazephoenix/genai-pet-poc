"use client";

import React from "react";
import { useGame } from "@/lib/game/provider";
import { PetSprite } from "./PetSprite";

interface PetPosition {
  xPercent: number; // 0-100
  yPercent: number; // 0-100
}

export function RoomView(): JSX.Element {
  const { state } = useGame();
  const bg = state.house.rooms[state.player.currentView].backgroundImage;
  const showPet: boolean = state.pet.currentRoom === state.player.currentView;

  // Start closer to the floor by default
  const [petPos, setPetPos] = React.useState<PetPosition>({ xPercent: 70, yPercent: 88 });

  // Periodically move the pet within the room while visible
  React.useEffect(() => {
    if (!showPet) {
      return;
    }
    const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
    const move = (): void => {
      const nextX: number = clamp(Math.floor(Math.random() * 81), 8, 92); // within 8%-92%
      // Keep the pet near the floor: constrain vertical between 80%-94%
      const nextY: number = clamp(80 + Math.floor(Math.random() * 15), 80, 94);
      setPetPos({ xPercent: nextX, yPercent: nextY });
    };
    // Move immediately once, then at intervals
    move();
    const intervalId: number = window.setInterval(move, 5000); // every 5s
    return () => {
      window.clearInterval(intervalId);
    };
  }, [showPet]);

  return (
    <div
      className="fixed inset-0"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      role="img"
      aria-label={`${state.player.currentView} background`}
    >
      {showPet && (
        <div
          className="absolute"
          style={{
            top: `${petPos.yPercent}%`,
            left: `${petPos.xPercent}%`,
            transform: "translate(-50%, -50%)",
            transition: "top 1.2s ease, left 1.2s ease",
          }}
        >
          <PetSprite />
        </div>
      )}
    </div>
  );
}


