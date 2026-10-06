export const parseAssetIds = (input: string): string[] =>
  Array.from(new Set(input.split(/[\s,;]+/).map((id) => id.trim()).filter(Boolean)));
