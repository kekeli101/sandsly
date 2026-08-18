import { describe, expect, it } from "vitest";
import { MenuImageStorageError, decodeMenuImage } from "./menu-image-storage";

describe("menu image decoding", () => {
  it("accepts a PNG payload that matches its declared type", () => {
    const image = decodeMenuImage("image/png", "iVBORw0KGgo=");
    expect(image.extension).toBe("png");
    expect(image.bytes).toHaveLength(8);
  });

  it("rejects unsupported image types and mismatched file signatures", () => {
    expect(() => decodeMenuImage("image/gif", "R0lGODlh")).toThrow(MenuImageStorageError);
    expect(() => decodeMenuImage("image/jpeg", "iVBORw0KGgo=")).toThrow("does not match its image type");
  });
});
