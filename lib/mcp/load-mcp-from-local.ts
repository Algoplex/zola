// MCP support has been removed in AI SDK v6
// These are stub implementations that return empty tools

export async function loadMCPToolsFromLocal(
  _command: string,
  _env: Record<string, string> = {}
) {
  // MCP support removed in AI SDK v6
  // Return empty tools for backwards compatibility
  return { tools: [], close: () => {} }
}
