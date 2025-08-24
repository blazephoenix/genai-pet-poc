import type { GameAction, GameState } from "./types";

/**
 * Pure reducer; handles all state transitions based on actions.
 * Matches the contract defined in `.cursorrules`.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NAVIGATE": {
      return { ...state, player: { currentView: action.room } };
    }
    case "PET_MOVED": {
      return { ...state, pet: { currentRoom: action.room } };
    }
    case "FEED": {
      // Guard: must be in Kitchen and pet in Kitchen
      const isInKitchen: boolean =
        state.player.currentView === "Kitchen" && state.pet.currentRoom === "Kitchen";
      if (!isInKitchen) {
        return state;
      }
      // Triggering animation is a UI concern; reducer remains pure.
      return state;
    }
    case "PLAY_WITH_PET": {
      const canPlay: boolean =
        state.player.currentView === "Living Room" && state.pet.currentRoom === "Living Room";
      if (!canPlay) {
        return state;
      }
      return {
        ...state,
        minigame: { hidingSpot: "Couch", status: "idle", message: "" },
      };
    }
    case "START_MINIGAME": {
      if (state.minigame === null) {
        return state;
      }
      return {
        ...state,
        minigame: { ...state.minigame, status: "playing", message: "Where did I hide?" },
      };
    }
    case "GUESS_HIDING_SPOT": {
      if (state.minigame === null) {
        return state;
      }
      const isCorrect: boolean = action.guess === state.minigame.hidingSpot;
      return {
        ...state,
        minigame: {
          hidingSpot: state.minigame.hidingSpot,
          status: isCorrect ? "found" : "playing",
          message: isCorrect ? "You found me!" : "Try again!",
        },
      };
    }
    case "END_MINIGAME": {
      return { ...state, minigame: null };
    }
    case "UPDATE_ROOM_LOOK": {
      return {
        ...state,
        house: {
          rooms: {
            ...state.house.rooms,
            [action.room]: { backgroundImage: action.backgroundImage },
          },
        },
      };
    }
    default: {
      return state;
    }
  }
}


