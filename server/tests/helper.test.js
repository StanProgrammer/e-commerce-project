const { parseExpiryToMs } = require("../utils/helper");

describe("parseExpiryToMs", () => {
  it("parses day-based expiries", () => {
    expect(parseExpiryToMs("7d")).toBe(7 * 24 * 60 * 60 * 1000);
    expect(parseExpiryToMs("30d")).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("parses hours, minutes, and seconds", () => {
    expect(parseExpiryToMs("8h")).toBe(8 * 60 * 60 * 1000);
    expect(parseExpiryToMs("90m")).toBe(90 * 60 * 1000);
    expect(parseExpiryToMs("45s")).toBe(45 * 1000);
  });

  it("treats a bare number as seconds", () => {
    expect(parseExpiryToMs("3600")).toBe(3600 * 1000);
  });

  it("handles full words and plural forms", () => {
    expect(parseExpiryToMs("2 days")).toBe(2 * 24 * 60 * 60 * 1000);
    expect(parseExpiryToMs("1 hour")).toBe(60 * 60 * 1000);
  });

  it("returns null for empty or unknown values", () => {
    expect(parseExpiryToMs("")).toBeNull();
    expect(parseExpiryToMs(undefined)).toBeNull();
    expect(parseExpiryToMs("forever")).toBeNull();
  });
});
