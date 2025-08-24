import type { NextApiRequest, NextApiResponse } from "next";
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";

type RoomName = "Living Room" | "Kitchen" | "Bedroom";

interface GenerateImageBody {
  prompt: string;
  room: RoomName;
  /** Data URL of the existing background to edit. */
  sourceImage?: string;
  /** Optional mask as data URL; white = editable, black = preserved. */
  mask?: string;
  aspectRatio?: string;
  size?: string;
  seed?: number;
  strength?: number;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  image: string; // data URL string
}

/**
 * Image generation API for room backgrounds.
 * Uses Vercel AI SDK's generateImage with OpenAI provider by default.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | SuccessResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body: GenerateImageBody | null = validateBody(req.body);
  if (body === null) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const apiKey: string | undefined = process.env.OPENAI_API_KEY;
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    return;
  }

  try {
    const { prompt, aspectRatio, size, room, sourceImage, mask, strength } = body;
    let { seed } = body;

    // Compose a strong style guide prompt tailored to the room
    const SYSTEM_PROMPT_TEMPLATE: string =
        `Cozy {room} interior, flat vector illustration style, 2.5D mild perspective, clean sharp lines, solid colors, subtle cell shading, cartoonish yet detailed, warm harmonious color palette, symmetrical composition, no gradients, professional vector art, Adobe Illustrator style, high detail, isolated scene`;
    const NEGATIVE_PROMPT: string =
      `photorealistic, 3D render, textures, noise, gradients, blurry, low detail, sketch, rough lines, painterly style, pixelated, shadows with soft falloff, realistic lighting`;

    const roomToken: string = room.toLowerCase();
    const systemPrompt: string = SYSTEM_PROMPT_TEMPLATE.replace("{room}", roomToken);
    const composedPrompt: string = `${systemPrompt}. Additional details: ${prompt}. Avoid: ${NEGATIVE_PROMPT}.`;

    // If a source image is provided, use an editing-capable model/settings
    const useEdit: boolean = typeof sourceImage === "string" && sourceImage.startsWith("data:");
    // Build provider options without undefined fields
    const providerOptions = useEdit
      ? (() => {
          const openaiOptions: Record<string, string> = { image: sourceImage as string };
          if (typeof mask === "string" && mask.startsWith("data:")) {
            openaiOptions["mask"] = mask;
          }
          return { openai: openaiOptions };
        })()
      : { openai: { style: "vivid", quality: "hd" } };

    // Default stable seed per room to improve consistency if none provided
    if (typeof seed !== "number") {
      seed = room === "Living Room" ? 101 : room === "Kitchen" ? 202 : 303;
    }

    const { image } = await generateImage({
      model: useEdit ? openai.image("gpt-image-1") : openai.image("dall-e-3"),
      prompt: composedPrompt,
      // Prefer aspect ratio; fallback to size when provided
      aspectRatio: useEdit ? undefined : (typeof aspectRatio === "string" && aspectRatio.length > 0 ? aspectRatio as `${number}:${number}` : undefined),
      size: useEdit ? ("1024x1024") : (typeof size === "string" && size.length > 0 ? size as `${number}x${number}` : undefined),
      seed,
      providerOptions,
    });

    // Compose a data URL from returned base64
    const base64: string = image.base64;
    const dataUrl: string = `data:image/png;base64,${base64}`;
    res.status(200).json({ image: dataUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate image: " + error });
  }
}

/** Validate and normalize the request body. */
function validateBody(raw: unknown): GenerateImageBody | null {
  if (raw === null || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const promptRaw = obj["prompt"];
  const roomRaw = obj["room"];

  if (typeof promptRaw !== "string") {
    return null;
  }
  const prompt = promptRaw.trim();
  if (prompt.length === 0) {
    return null;
  }

  const validRooms: ReadonlyArray<RoomName> = ["Living Room", "Kitchen", "Bedroom"];
  if (typeof roomRaw !== "string" || !validRooms.includes(roomRaw as RoomName)) {
    return null;
  }

  const aspectRatio = typeof obj["aspectRatio"] === "string" ? (obj["aspectRatio"] as string) : undefined;
  const size = typeof obj["size"] === "string" ? (obj["size"] as string) : undefined;
  const seed = typeof obj["seed"] === "number" ? (obj["seed"] as number) : undefined;

  return { prompt, room: roomRaw as RoomName, aspectRatio, size, seed };
}


