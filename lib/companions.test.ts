import { describe, it, expect } from "vitest";
import { getCompanionPublic, getCompanionPaidZone } from "./companions";

describe("companions loader", () => {
  it("parses the public scaffold for the seed", () => {
    const c = getCompanionPublic("onchain-partnership-rwa");
    expect(c.explainer.length).toBeGreaterThan(20);
    expect(c.jurisdiction).toMatch(/法域|跨法域/);
    expect(c.starterPrompts).toHaveLength(4);
    expect(c.starterPrompts[0].title.length).toBeGreaterThan(0);
    expect(c.starterPrompts[0].prompt.length).toBeGreaterThan(10);
  });
  it("public scaffold never contains the paid 〔A〕 content", () => {
    const c = getCompanionPublic("onchain-partnership-rwa");
    expect(JSON.stringify(c)).not.toMatch(/Howey|Berle|数字权益单元（Digital/);
  });
  it("decrypts the paid 〔A〕 zone (server-only)", () => {
    expect(getCompanionPaidZone("onchain-partnership-rwa")).toMatch(/术语表|法条地图|误区表/);
  });
  it("rejects an invalid slug", () => {
    expect(() => getCompanionPublic("../x")).toThrow(/slug/i);
  });
});
