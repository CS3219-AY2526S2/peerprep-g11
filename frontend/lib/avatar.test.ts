import {
  AVATAR_PALETTE,
  getAvatarColor,
  hashUsername,
} from "@/lib/avatar";

describe("avatar utilities", () => {
  it("hashUsername is deterministic", () => {
    expect(hashUsername("alice")).toBe(hashUsername("alice"));
  });

  it("hashUsername returns 0 for an empty username", () => {
    expect(hashUsername("")).toBe(0);
  });

  it("getAvatarColor always returns a palette color", () => {
    const color = getAvatarColor("peerprep-user");

    expect(AVATAR_PALETTE).toContain(color);
    expect(getAvatarColor("peerprep-user")).toBe(color);
  });
});
