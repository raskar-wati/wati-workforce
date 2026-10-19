import type { TemplateAiRequest, TemplateAiResponse } from "../api/template/route";

/**
 * Client side of /api/template. Never throws: a network failure reads as
 * { ok: false } so callers fall back to the scripted drafter.
 */
export async function askTemplateAi(req: TemplateAiRequest): Promise<TemplateAiResponse> {
  try {
    const res = await fetch("/api/template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return (await res.json()) as TemplateAiResponse;
  } catch (e) {
    return { ok: false, reason: "error", detail: String(e) };
  }
}

/** Whether a model key is configured on the server. */
export async function templateAiStatus(): Promise<{ enabled: boolean; model: string }> {
  try {
    const res = await fetch("/api/template");
    return (await res.json()) as { enabled: boolean; model: string };
  } catch {
    return { enabled: false, model: "" };
  }
}

/** "Qwen/Qwen3.8-27B" → "Qwen3.8-27B" for labels. */
export function modelLabel(model: string): string {
  return model.split("/").pop() ?? model;
}
