import type { GameState } from "./types";

/**
 * Initial game state for SPA boot.
 */
export const initialGameState: GameState = {
  pet: { currentRoom: "Living Room" },
  player: { currentView: "Living Room" },
  house: {
    rooms: {
      "Living Room": { backgroundImage: "/assets/living-room.jpg" },
      // Use empty placeholder background for rooms without decor
      Kitchen: { backgroundImage: "/assets/empty.png" },
      Bedroom: { backgroundImage: "/assets/empty.png" },
    },
  },
  minigame: null,
};


