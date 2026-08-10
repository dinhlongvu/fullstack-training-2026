// normalizeNewlines is what keeps a description from rendering dozens of blank
// lines (#233/#234). The CRLF step has to run first, or the collapse misses:
// the newlines in "\r\n\r\n\r\n" are not consecutive.

import { describe, it, expect } from "vitest";
import { normalizeNewlines } from "./text";

describe("normalizeNewlines", () => {
  it("collapses a run of blank lines down to one", () => {
    expect(normalizeNewlines("A\n\n\n\n\n\n\nB")).toBe("A\n\nB");
  });

  it("keeps a single break and a single blank line as typed", () => {
    expect(normalizeNewlines("A\nB")).toBe("A\nB");
    expect(normalizeNewlines("A\n\nB")).toBe("A\n\nB");
  });

  it("collapses CRLF runs too", () => {
    expect(normalizeNewlines("A\r\n\r\n\r\n\r\nB")).toBe("A\n\nB");
  });

  // A blank line the user left a space on is still a blank line. Without step 2
  // the newlines are not adjacent, so the collapse in step 3 never fires.
  it("collapses blank lines that hold spaces or tabs", () => {
    expect(normalizeNewlines("A\n \n \n \nB")).toBe("A\n\nB");
    expect(normalizeNewlines("A\n\t\n\t\nB")).toBe("A\n\nB");
    expect(normalizeNewlines("1\n\n \n\na")).toBe("1\n\na");
  });

  it("keeps indentation on a line that has text", () => {
    expect(normalizeNewlines("A\n  B")).toBe("A\n  B");
  });

  it("leaves text without line breaks untouched", () => {
    expect(normalizeNewlines("A B")).toBe("A B");
  });
});
