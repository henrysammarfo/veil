import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Shared clipboard spy. Tests can read calls via `clipboardWriteText`
// (re-imported from this file) or via `(navigator.clipboard.writeText as Mock)`.
export const clipboardWriteText = vi.fn().mockResolvedValue(undefined);

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: { writeText: clipboardWriteText },
});

afterEach(() => {
  cleanup();
  clipboardWriteText.mockClear();
});
