"use client";

import React from "react";
import { gameReducer } from "./reducer";
import { initialGameState } from "./state";
import type { GameAction, GameState, RoomName } from "./types";
import { createBrowserTimerService, createLocalStorageService, createMockAIImageService } from "./services";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = React.createContext<GameContextValue | undefined>(undefined);

// Simple UI event bus for cross-component effects (e.g., feed animation)
const GameEventsContext = React.createContext<EventTarget | undefined>(undefined);

/** Safely derive the next random room (excluding current). */
function selectNextRoom(current: RoomName): RoomName {
  const rooms: ReadonlyArray<RoomName> = ["Living Room", "Kitchen", "Bedroom"];
  const candidates: RoomName[] = rooms.filter((r) => r !== current);
  const index: number = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

// Bump storage key to avoid stale backgrounds; v2 introduces default empty rooms for Kitchen/Bedroom
const storage = createLocalStorageService("tamagotchi-poc-state-v2");
const ai = createMockAIImageService();
const timer = typeof window !== "undefined"
  ? createBrowserTimerService(selectNextRoom, 15000, 30000)
  : null;

export function useGame(): GameContextValue {
  const ctx = React.useContext(GameContext);
  if (ctx === undefined) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}

export function useGameEvents(): EventTarget {
  const events = React.useContext(GameEventsContext);
  if (events === undefined) {
    throw new Error("useGameEvents must be used within GameProvider");
  }
  return events;
}

export function GameProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Use useState + manual dispatch wrapper to avoid SSR/CSR hydration mismatch
  const [state, setState] = React.useState<GameState>(initialGameState);
  const dispatch = React.useCallback((action: GameAction): void => {
    setState((prev) => gameReducer(prev, action));
  }, []);
  const eventsRef = React.useRef<EventTarget | null>(null);
  if (eventsRef.current === null) {
    eventsRef.current = new EventTarget();
  }

  // After mount, attempt to hydrate from localStorage (client-only)
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const loaded = storage.load();
    if (
      loaded !== null &&
      typeof loaded === "object" &&
      "pet" in loaded &&
      "player" in loaded &&
      "house" in loaded
    ) {
      // Minimal normalization and forward-compat defaults
      const normalized: GameState = {
        ...loaded as GameState,
        house: {
          rooms: {
            "Living Room": (loaded as GameState).house.rooms["Living Room"] ?? { backgroundImage: "/assets/living-room.jpg" },
            Kitchen: (loaded as GameState).house.rooms["Kitchen"] ?? { backgroundImage: "/assets/empty.png" },
            Bedroom: (loaded as GameState).house.rooms["Bedroom"] ?? { backgroundImage: "/assets/empty.png" },
          },
        },
      };
      setState(normalized);
    }
  }, []);

  // One-time cleanup of old storage key to prevent confusion
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.removeItem("tamagotchi-poc-state");
    } catch (error) {
      // ignore
    }
  }, []);

  // Persist on meaningful changes
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    storage.save(state);
  }, [state]);

  // Start autonomous pet movement; cleanup on unmount
  React.useEffect(() => {
    if (timer === null) {
      return;
    }
    // Start movement only after mount to avoid SSR mismatch
    const stop = timer.startPetMovement((nextRoom) => {
      dispatch({ type: "PET_MOVED", room: nextRoom });
    });
    return () => {
      stop();
    };
  }, [dispatch]);

  const value: GameContextValue = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return (
    <GameContext.Provider value={value}>
      <GameEventsContext.Provider value={eventsRef.current}>
        {children}
      </GameEventsContext.Provider>
    </GameContext.Provider>
  );
}

// Re-export services for UI usage where appropriate
export const Services = Object.freeze({ ai });


