export interface SSEResult {
  text: string;
  interviewComplete: boolean;
  choices: {
    question: string;
    choices: Array<{ value: string; label: string; description?: string }>;
  } | null;
}

/**
 * Parse an SSE stream from the discovery agent.
 * Pure function - no React state, no side effects.
 */
export async function parseSSEStream(response: Response): Promise<SSEResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let interviewComplete = false;
  let choices: SSEResult["choices"] = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        try {
          const data = JSON.parse(dataStr);
          if (currentEvent === "message" && data.text) {
            fullText += data.text;
          } else if (currentEvent === "discovery_complete") {
            interviewComplete = true;
          } else if (currentEvent === "choices" && data.question) {
            choices = {
              question: data.question,
              choices: data.choices ?? [],
            };
          }
        } catch {
          /* Ignore malformed SSE chunk */
        }
        currentEvent = "";
      }
    }
  }

  return { text: fullText, interviewComplete, choices };
}
