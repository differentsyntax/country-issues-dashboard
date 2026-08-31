/**
 * Each party's actual Election Commission of India-allotted symbol,
 * individually verified (not guessed) — see PR description / commit message
 * for sources. A party not in this map gets a neutral fallback (its
 * initials) rather than a guessed or incorrect symbol.
 */
export const PARTY_SYMBOLS: Record<string, { emoji: string; symbolName: string }> = {
  BJP: { emoji: "🪷", symbolName: "Lotus" },
  INC: { emoji: "✋", symbolName: "Hand" },
  AAP: { emoji: "🧹", symbolName: "Broom" },
  TDP: { emoji: "🚲", symbolName: "Bicycle" },
  AINRC: { emoji: "🏺", symbolName: "Jug" },
  JKNC: { emoji: "🌾", symbolName: "Plough" },
  JMM: { emoji: "🏹", symbolName: "Bow and Arrow" },
  NPF: { emoji: "🐓", symbolName: "Cock" },
  NPP: { emoji: "📖", symbolName: "Book" },
  SKM: { emoji: "💡", symbolName: "Table Lamp" },
};

export function partySymbol(party: string): { emoji: string; symbolName: string } | null {
  return PARTY_SYMBOLS[party] ?? null;
}
