import { type UIMessage } from "@ai-sdk/react"

export function getSources(parts: UIMessage["parts"] | undefined) {
  const sources: unknown[] = []

  if (parts) {
    for (const part of parts) {
      if (part.type === "source-url") {
        sources.push({ url: part.url, title: part.title })
        continue
      }

      if (part.type === "source-document") {
        sources.push({ url: part.filename, title: part.title })
        continue
      }

      if (!part.type.startsWith("tool-")) continue

      const toolInvocation = (part as any).toolInvocation
      if (!toolInvocation) continue

      const state = toolInvocation?.state ?? "result"
      const result = toolInvocation?.result ?? null
      const toolName = toolInvocation?.toolName ?? null

      if (
        state === "result" &&
        toolName === "summarizeSources" &&
        result &&
        typeof result === "object" &&
        "result" in result
      ) {
        const res = result as { result?: Array<{ citations?: unknown[] }> }
        const citations = res.result?.flatMap((item) => item.citations || [])
        if (citations && citations.length > 0) {
          sources.push(...citations)
        }
        continue
      }

      if (Array.isArray(result)) {
        sources.push(...result.flat())
        continue
      }

      if (result) {
        sources.push(result)
      }
    }
  }

  const validSources = ((sources ?? []) as Array<{ url?: string }>).filter(
    (source): source is { url: string } =>
      !!source &&
      typeof source === "object" &&
      "url" in source &&
      typeof source.url === "string" &&
      source.url !== ""
  )

  return validSources
}
