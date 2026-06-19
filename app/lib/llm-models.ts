export type LLMOption = {
  id: string;
  name: string;
  provider: string;
};

export const LLM_OPTIONS: LLMOption[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro", provider: "Google" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-haiku-4", name: "Claude Haiku 4", provider: "Anthropic" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta" },
];

export const DEFAULT_LLM_ID = "gemini-2.5-flash";

export function getLLMById(id: string | undefined): LLMOption {
  return (
    LLM_OPTIONS.find((m) => m.id === id) ??
    LLM_OPTIONS.find((m) => m.id === DEFAULT_LLM_ID) ??
    LLM_OPTIONS[0]
  );
}

/**
 * Groups models by provider preserving the order they appear in LLM_OPTIONS.
 */
export function groupLLMsByProvider(): Array<[string, LLMOption[]]> {
  const grouped = LLM_OPTIONS.reduce<Record<string, LLMOption[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});
  return Object.entries(grouped);
}
