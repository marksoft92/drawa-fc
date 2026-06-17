const SIGNATURES = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": null, // special: bytes 8-11 = "WEBP"
};

export function validateImageBytes(buffer, declaredType) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12) return false;

  if (declaredType === "image/svg+xml") {
    const text = new TextDecoder().decode(bytes.slice(0, 256));
    return text.includes("<svg") && !text.includes("<script");
  }

  if (declaredType === "image/webp") {
    return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }

  const sigs = SIGNATURES[declaredType];
  if (!sigs) return false;

  return sigs.some((sig) => sig.every((b, i) => bytes[i] === b));
}
