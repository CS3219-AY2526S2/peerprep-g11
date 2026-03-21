/**
 * Shared avatar color utilities.
 * Used by both the NavBar and session ParticipantsCard so avatars
 * always get the same deterministic color for a given username.
 */

export const AVATAR_PALETTE = [
  'oklch(0.65 0.15 25)',
  'oklch(0.60 0.14 145)',
  'oklch(0.55 0.12 250)',
  'oklch(0.62 0.16 50)',
  'oklch(0.58 0.13 310)',
  'oklch(0.60 0.15 180)',
  'oklch(0.55 0.14 280)',
  'oklch(0.63 0.12 100)',
] as const;

export function hashUsername(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(username: string): string {
  return AVATAR_PALETTE[hashUsername(username) % AVATAR_PALETTE.length];
}
