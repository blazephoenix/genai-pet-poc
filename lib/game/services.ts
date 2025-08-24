import type { GameState, RoomName } from "./types";

/** Schedules autonomous pet movement on a random interval between 15–30 seconds. */
export interface TimerService {
  /**
   * Start the pet movement loop. Returns a stop function to cancel the timer.
   */
  startPetMovement(onMove: (nextRoom: RoomName) => void): () => void;
}

/** Generates background images for rooms using a generative model. Returns URL or data URI. */
export interface AIImageService {
  generateRoomImage(
    prompt: string,
    room: RoomName,
    options?: { sourceImage?: string; mask?: string; strength?: number; seed?: number }
  ): Promise<string>;
}

/** Simple persistence layer for local saves. */
export interface StorageService {
  save(state: GameState): void;
  load(): GameState | null;
  clear(): void;
}

/** Utility to compute next random delay within inclusive bounds. */
export function getRandomDelayMs(minMs: number, maxMs: number): number {
  const clampedMin: number = Math.max(0, Math.floor(minMs));
  const clampedMax: number = Math.max(clampedMin, Math.floor(maxMs));
  const range: number = clampedMax - clampedMin;
  const offset: number = Math.floor(Math.random() * (range + 1));
  return clampedMin + offset;
}

/**
 * Browser timer service implementation using setTimeout with randomized delay.
 */
export function createBrowserTimerService(
  getNextRoom: (current: RoomName) => RoomName,
  minMs: number,
  maxMs: number
): TimerService {
  let timeoutId: number | null = null;

  const startPetMovement = (onMove: (nextRoom: RoomName) => void): (() => void) => {
    const loop = (currentRoom: RoomName): void => {
      const delay: number = getRandomDelayMs(minMs, maxMs);
      timeoutId = window.setTimeout(() => {
        const next: RoomName = getNextRoom(currentRoom);
        onMove(next);
        loop(next);
      }, delay);
    };
    // Kick off with Living Room as a safe default; caller can cancel immediately and re-init
    loop("Living Room");
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  };

  return { startPetMovement };
}

/** LocalStorage-based persistence. */
export function createLocalStorageService(storageKey: string): StorageService {
  const save = (state: GameState): void => {
    try {
      const serialized: string = JSON.stringify(state);
      window.localStorage.setItem(storageKey, serialized);
    } catch {
      // Silently ignore to avoid crashing UI; optionally report elsewhere
    }
  };

  const load = (): GameState | null => {
    try {
      const raw: string | null = window.localStorage.getItem(storageKey);
      if (raw === null) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object") {
        return parsed as GameState;
      }
      return null;
    } catch {
      return null;
    }
  };

  const clear = (): void => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // no-op
    }
  };

  return { save, load, clear };
}

/**
 * Minimal AI image service that echoes a data URL when prompt is non-empty.
 * Replace with a real API integration in the future.
 */
export function createMockAIImageService(): AIImageService {
  const generateRoomImage = async (
    prompt: string,
    room: RoomName,
    options?: { sourceImage?: string; mask?: string; strength?: number; seed?: number }
  ): Promise<string> => {
    const normalizedPrompt: string = String(prompt ?? "").trim();
    if (normalizedPrompt.length === 0) {
      throw new Error("Prompt cannot be empty");
    }
    // Call server API route for real generation
    const response = await fetch("/api/generate-room-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: normalizedPrompt,
        room,
        aspectRatio: "16:9",
        sourceImage: options?.sourceImage,
        mask: options?.mask,
        seed: options?.seed,
        strength: options?.strength,
      }),
    });
    if (!response.ok) {
      throw new Error("Image generation failed");
    }
    const data: unknown = await response.json();
    if (
      data === null ||
      typeof data !== "object" ||
      typeof (data as Record<string, unknown>)["image"] !== "string"
    ) {
      throw new Error("Invalid image response");
    }
    return (data as { image: string }).image;
  };
  return { generateRoomImage };
}


