import { describe, expect, it } from "vitest";

import {
  AIDERA_TIME_ZONE,
  formatInJakarta,
  jakartaDateOnlyToIso,
  toJakartaIso,
} from "@/lib/dates/jakarta";

describe("jakarta timezone helpers", () => {
  it("uses the Asia/Jakarta zone", () => {
    expect(AIDERA_TIME_ZONE).toBe("Asia/Jakarta");
  });

  it("defaults date-only values to 09:00 local time", () => {
    expect(jakartaDateOnlyToIso("2026-09-20")).toBe("2026-09-20T09:00:00+07:00");
  });

  it("keeps the local calendar date when converting from UTC", () => {
    expect(toJakartaIso("2026-09-19T23:30:00Z")).toBe("2026-09-20T06:30:00+07:00");
    expect(formatInJakarta("2026-09-19T23:30:00Z", "yyyy-MM-dd")).toBe("2026-09-20");
  });

  it("rejects malformed date-only input", () => {
    expect(() => jakartaDateOnlyToIso("20-09-2026")).toThrow(RangeError);
  });
});
