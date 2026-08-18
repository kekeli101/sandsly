import { uploadMenuImage } from "../server/menu-image-storage.ts";

if (process.env.CONFIRM_MENU_IMAGE_STORAGE_TEST !== "1") {
  throw new Error("Set CONFIRM_MENU_IMAGE_STORAGE_TEST=1 before uploading a storage verification image.");
}

const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL4xQAAAABJRU5ErkJggg==";
const uploaded = await uploadMenuImage({ userId: 0, contentType: "image/png", base64: transparentPngBase64 });
console.log(`Menu image upload accepted: ${uploaded.url}`);
