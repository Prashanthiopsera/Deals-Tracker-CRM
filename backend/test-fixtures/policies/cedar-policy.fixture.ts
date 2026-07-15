export const VALID_CEDAR_POLICY = `
permit(
  principal in Role::"Director",
  action,
  resource
);
`.trim();

export const INVALID_CEDAR_POLICY = `
permit(
  principal in Role::"Director",
  action,
  resource
`.trim();
