import { randomUUID } from "node:crypto";

export const MENU_IMAGE_BUCKET = "menu-images";
export const MAX_MENU_IMAGE_BYTES = 5 * 1024 * 1024;

const supportedImages = {
  "image/jpeg": { extension: "jpg", matches: (bytes: Buffer) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: (bytes: Buffer) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", matches: (bytes: Buffer) => bytes.length >= 12 && bytes.subarray(0, 4).equals(Buffer.from("RIFF")) && bytes.subarray(8, 12).equals(Buffer.from("WEBP")) },
} as const;

export type SupportedMenuImageType = keyof typeof supportedImages;

export class MenuImageStorageError extends Error {}

export function decodeMenuImage(contentType: string, base64: string) {
  const normalizedType = contentType.toLowerCase() as SupportedMenuImageType;
  const imageType = supportedImages[normalizedType];
  if (!imageType) throw new MenuImageStorageError("Use a JPEG, PNG, or WebP image.");

  const normalizedBase64 = base64.replace(/\s/g, "");
  if (!normalizedBase64 || normalizedBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
    throw new MenuImageStorageError("The selected image could not be read.");
  }

  const bytes = Buffer.from(normalizedBase64, "base64");
  if (!bytes.length || bytes.length > MAX_MENU_IMAGE_BYTES) {
    throw new MenuImageStorageError("Menu images must be no larger than 5 MB.");
  }
  if (!imageType.matches(bytes)) throw new MenuImageStorageError("The selected file does not match its image type.");

  return { bytes, extension: imageType.extension };
}

function getStorageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new MenuImageStorageError("Menu image storage is not configured on the server.");
  return { url, serviceRoleKey };
}

function storageHeaders(serviceRoleKey: string) {
  return { apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}` };
}

async function readStorageError(response: Response) {
  const body = await response.text().catch(() => "");
  return body.replace(/\s+/g, " ").slice(0, 240);
}

async function ensureMenuImageBucket(url: string, serviceRoleKey: string) {
  const headers = storageHeaders(serviceRoleKey);
  const listResponse = await fetch(`${url}/storage/v1/bucket`, { headers });
  if (!listResponse.ok) throw new MenuImageStorageError(`Could not access image storage (${listResponse.status}).`);
  const buckets = await listResponse.json() as Array<{ id?: string }>;
  if (buckets.some((bucket) => bucket.id === MENU_IMAGE_BUCKET)) return;

  const createResponse = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      id: MENU_IMAGE_BUCKET,
      name: MENU_IMAGE_BUCKET,
      public: true,
      file_size_limit: MAX_MENU_IMAGE_BYTES,
      allowed_mime_types: Object.keys(supportedImages),
    }),
  });
  if (!createResponse.ok && createResponse.status !== 409) {
    throw new MenuImageStorageError(`Could not create image storage (${createResponse.status}): ${await readStorageError(createResponse)}`);
  }
}

export async function uploadMenuImage(input: { userId: number; contentType: string; base64: string }) {
  const { bytes, extension } = decodeMenuImage(input.contentType, input.base64);
  const { url, serviceRoleKey } = getStorageConfig();
  await ensureMenuImageBucket(url, serviceRoleKey);

  const key = `staff/${input.userId}/${Date.now()}-${randomUUID()}.${extension}`;
  const response = await fetch(`${url}/storage/v1/object/${MENU_IMAGE_BUCKET}/${key}`, {
    method: "POST",
    headers: { ...storageHeaders(serviceRoleKey), "content-type": input.contentType, "x-upsert": "false" },
    body: bytes,
  });
  if (!response.ok) {
    throw new MenuImageStorageError(`Image upload failed (${response.status}): ${await readStorageError(response)}`);
  }

  return { key, url: `${url}/storage/v1/object/public/${MENU_IMAGE_BUCKET}/${key}` };
}
