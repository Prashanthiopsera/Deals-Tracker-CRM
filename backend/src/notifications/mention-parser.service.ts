export function parseMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_-]+)/g) ?? [];
  return matches.map((token) => token.slice(1));
}

export function filterMentionableUsers(
  candidates: Array<{ id: string; name: string }>,
  allowedUserIds: Set<string>,
): Array<{ id: string; name: string }> {
  return candidates.filter((user) => allowedUserIds.has(user.id));
}
