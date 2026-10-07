const HARMONY: Record<string, string> = {
  a: "ı",
  ı: "ı",
  e: "i",
  i: "i",
  o: "u",
  u: "u",
  ö: "ü",
  ü: "ü",
};

/** Turkish genitive for a proper name, with vowel harmony: "Emirhan Solmaz'ın", "Ayşe Kaya'nın", "Elif Şahin'in". */
export function genitive(name: string): string {
  const trimmed = name.trim();
  const word = trimmed.split(/\s+/).pop() ?? trimmed;
  const lower = word.toLocaleLowerCase("tr");

  let lastVowel = "";
  for (const ch of lower) if (ch in HARMONY) lastVowel = ch;
  const vowel = HARMONY[lastVowel] ?? "ı";

  const endsWithVowel = lower.length > 0 && lower.at(-1)! in HARMONY;
  return `${trimmed}'${endsWithVowel ? "n" : ""}${vowel}n`;
}
