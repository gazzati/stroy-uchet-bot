import { describe, expect, it } from "vitest";
import { CB, cb, parseCb } from "./actions.js";

describe("callback_data encoding", () => {
  it("round-trips code and bigserial ids", () => {
    const data = cb(CB.OBJ_ASSIGN_DO, "42", "7");
    expect(parseCb(data)).toEqual({ code: CB.OBJ_ASSIGN_DO, args: ["42", "7"] });
  });

  it("handles code without args", () => {
    expect(parseCb(cb(CB.MENU))).toEqual({ code: CB.MENU, args: [] });
  });

  it("throws when callback_data exceeds 64 bytes", () => {
    const long = "x".repeat(70);
    expect(() => cb(CB.OBJ, long)).toThrow(/too long/);
  });

  it("keeps a two-id action well within the limit", () => {
    expect(Buffer.byteLength(cb(CB.OBJ_DETACH_DO, "123456", "654321"), "utf8")).toBeLessThanOrEqual(64);
  });
});
