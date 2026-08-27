/**
 * Image storage backed by Cloudinary.
 *
 * Uploads are signed on the server so the API secret never reaches the browser:
 * the client posts the raw file to `uploadImageFn`, which signs the request and
 * forwards it to Cloudinary's upload endpoint. Cloudinary returns a permanent
 * `secure_url` that we store on the listing.
 *
 * Server env vars (see `.env`, loaded into `process.env` by `vite.config.ts`):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
import { createServerFn } from "@tanstack/react-start";

/** Cloudinary rejects anything larger, and the browser shouldn't try. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadedImage = {
  /** Permanent https delivery URL — store this on the listing. */
  url: string;
  /** Cloudinary public id, for later deletes or transformations. */
  publicId: string;
};

export const uploadImageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected a file upload.");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("No file was provided.");
    if (file.size === 0) throw new Error("The file is empty.");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is larger than 10 MB.");
    if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
    const folder = String(data.get("folder") ?? "").trim();
    // Keep folders to a safe, flat allowlist-ish shape — this value is signed
    // and sent to Cloudinary verbatim.
    return { file, folder: /^[a-zA-Z0-9/_-]{1,100}$/.test(folder) ? folder : "rentease" };
  })
  .handler(async ({ data }): Promise<UploadedImage> => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signed: Record<string, string> = {
      folder: data.folder,
      timestamp: String(timestamp),
    };
    // Cloudinary signs the signable params sorted by key, joined as a query
    // string, with the API secret appended — then SHA-1 hex.
    const toSign = Object.keys(signed)
      .sort()
      .map((k) => `${k}=${signed[k]}`)
      .join("&");
    const { createHash } = await import("node:crypto");
    const signature = createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

    const body = new FormData();
    body.set("file", data.file);
    body.set("api_key", apiKey);
    body.set("signature", signature);
    for (const [k, v] of Object.entries(signed)) body.set(k, v);

    let res: Response;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body,
      });
    } catch (err) {
      const cause = err instanceof Error && err.cause ? ` (${String(err.cause)})` : "";
      throw new Error(`Could not reach Cloudinary${cause}`);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Cloudinary upload failed (${res.status}). ${detail.slice(0, 300)}`);
    }
    const json = (await res.json()) as { secure_url?: string; public_id?: string };
    if (!json.secure_url || !json.public_id) {
      throw new Error("Cloudinary returned an unexpected response.");
    }
    return { url: json.secure_url, publicId: json.public_id };
  });

/** Upload one image from the browser and get back its delivery URL. */
export async function uploadImage(file: File, folder = "rentease"): Promise<UploadedImage> {
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  return uploadImageFn({ data: form });
}

/**
 * Insert delivery transformations into a Cloudinary URL — e.g. a 1200px-wide,
 * auto-format, auto-quality version of an uploaded photo. Non-Cloudinary URLs
 * (the Unsplash placeholders in the seed data) are returned untouched.
 */
export function cloudinaryVariant(url: string, transform = "f_auto,q_auto,w_1200"): string {
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (!url.startsWith("https://res.cloudinary.com/") || at === -1) return url;
  return `${url.slice(0, at + marker.length)}${transform}/${url.slice(at + marker.length)}`;
}
