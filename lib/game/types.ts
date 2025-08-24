/**
 * Authoritative TypeScript types for the Virtual Pet POC.
 * These types follow the rules defined in `.cursorrules`.
 */

/** Room names supported by the game. */
export type RoomName = "Living Room" | "Kitchen" | "Bedroom";

/** Clickable objects for the hide-and-seek minigame. */
export type HideAndSeekObject = "Couch" | "Lamp" | "Rug";

/** State for each room. backgroundImage must be a valid URL or data URI. */
export interface RoomState {
  /** Image URL or data URI to render as the room background. */
  backgroundImage: string;
}

/** House state keyed by room. */
export interface HouseState {
  /** Mapping of room name to its state. */
  rooms: Record<RoomName, RoomState>;
}

/** Pet state tracks where the pet currently is. */
export interface PetState {
  /** The name of the room where the pet currently resides. */
  currentRoom: RoomName;
}

/** Player state tracks what the player is currently viewing. */
export interface PlayerState {
  /** The name of the room currently visible to the player. */
  currentView: RoomName;
}

/** Hide-and-seek minigame state. */
export interface HideAndSeekState {
  /** Which object the pet is hiding behind. */
  hidingSpot: HideAndSeekObject;
  /** Current status of the game. */
  status: "idle" | "playing" | "found";
  /** UI message to display to the player. */
  message: string;
}

/** Root game state. */
export interface GameState {
  pet: PetState;
  player: PlayerState;
  house: HouseState;
  minigame: HideAndSeekState | null;
}

/** Discriminated union of game actions. */
export type GameAction =
  | { type: "NAVIGATE"; room: RoomName }
  | { type: "PET_MOVED"; room: RoomName }
  | { type: "FEED" }
  | { type: "PLAY_WITH_PET" }
  | { type: "START_MINIGAME" }
  | { type: "GUESS_HIDING_SPOT"; guess: HideAndSeekObject }
  | { type: "END_MINIGAME" }
  | { type: "UPDATE_ROOM_LOOK"; room: RoomName; backgroundImage: string };


