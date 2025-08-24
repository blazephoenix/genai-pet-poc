"use client";

import React from "react";
import { useGame, useGameEvents } from "@/lib/game/provider";
import { PetSprite } from "./PetSprite";

interface PetPosition {
  xPercent: number; // 0-100
  yPercent: number; // 0-100
}

export function RoomView(): JSX.Element {
  const { state } = useGame();
  const events = useGameEvents();
  const bg = state.house.rooms[state.player.currentView].backgroundImage;
  const showPet: boolean = state.pet.currentRoom === state.player.currentView;

  // Start closer to the floor by default
  const [petPos, setPetPos] = React.useState<PetPosition>({ xPercent: 70, yPercent: 88 });
  const [foodPos, setFoodPos] = React.useState<PetPosition | null>(null);
  const [isDancing, setIsDancing] = React.useState<boolean>(false);

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

  // Feed animation: drop food from top, pet follows horizontally, then dance
  React.useEffect(() => {
    const onFeed = (): void => {
      // Spawn food at random x; fall to floor (y ~ 92%)
      const x = Math.floor(10 + Math.random() * 80);
      setFoodPos({ xPercent: x, yPercent: 0 });
      // Animate falling via CSS transition by updating y shortly after
      setTimeout(() => setFoodPos({ xPercent: x, yPercent: 92 }), 30);
      // Move pet near the food x over time
      setTimeout(() => setPetPos((prev) => ({ xPercent: x, yPercent: prev.yPercent })), 300);
      // After reaching, do a happy dance
      setTimeout(() => {
        setIsDancing(true);
        // Clear food
        setFoodPos(null);
        // End dance after a short loop
        setTimeout(() => setIsDancing(false), 1800);
      }, 1500);
    };
    events.addEventListener("feed", onFeed as EventListener);
    return () => {
      events.removeEventListener("feed", onFeed as EventListener);
    };
  }, [events]);

  return (
    <div
      className="fixed inset-0"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      role="img"
      aria-label={`${state.player.currentView} background`}
    >
      {foodPos !== null && (
        <div
          className="absolute w-6 h-6 bg-yellow-300 rounded-full"
          style={{
            top: `${foodPos.yPercent}%`,
            left: `${foodPos.xPercent}%`,
            transform: "translate(-50%, -50%)",
            transition: "top 1s ease, left 0.6s ease",
          }}
          aria-label="Food"
        />
      )}
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
          <PetSprite className={isDancing ? "pet-dance" : undefined} />
        </div>
      )}
    </div>
  );
}


