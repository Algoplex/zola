import { type UIMessage } from "@ai-sdk/react"

export function getSources(parts: UIMessage["parts"] | undefined) {
  const sources = parts
    ?.filter(
      (part): part is UIMessage["parts"][number] =>
        part.type === "source-url" || part.type === "source-document" || part.type.startsWith("tool-")
    )
    .map((p) => {
      if (p.type === "source-url") {
        return { url: p.url, title: p.title }
      }

      if (p.type === "source-document") {
        return { url: p.filename, title: p.title }
      }

      // Handle tool invocation parts (static or dynamic)
      const toolInvocation = (p as any).toolInvocation

      if (!toolInvocation) return null

      // Check for tool result
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
        return res.result?.flatMap((item) => item.citations || []) || []
      }

      return Array.isArray(result) ? result.flat() : result
    })
    .filter(Boolean)
    .flat()

  const validSources = ((sources ?? []) as Array<{ url?: string }>).filter(
    (
      source
    ): source is { url: string } =>
      !!source &&
      typeof source === "object" &&
      "url" in source &&
      typeof source.url === "string" &&
      source.url !== ""
  )

  return validSources
}
