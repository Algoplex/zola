# Handoff: AI SDK v6 Migration Fix

## Session Metadata

- Created: 2026-02-15 07:00:37
- Project: /Users/shaurya/Developer/algoplex/zola
- Branch: main
- Session duration: ~30 minutes

### Recent Commits (for context)

- a1390f0 feat: Upgrade react/nextjs (#274)
- 78ea30a fix: upgrade Next.js to 15.4.8 (CVE-2025-55182) (#273)

## Handoff Chain

- **Continues from**: None (fresh start)
- **Supersedes**: None

## Current State Summary

Working on fixing a runtime error: `setInput is not a function`. This occurs because the codebase uses AI SDK v6 but the `useChat` hook usage is from v3/v4 API. In v6, `useChat` no longer returns `input`, `setInput`, `handleSubmit`, or `append`. Instead, input must be managed manually with `useState`, and messages are sent via `sendMessage`.

Already completed:

1. Changed default model from `gpt-4.1-nano` to `gemini-3-flash-preview` in `lib/config.ts`
2. Updated `NON_AUTH_ALLOWED_MODELS` and `FREE_MODELS_IDS` to use gemini

In progress:

- Fixing `use-chat-core.ts` to use AI SDK v6 API

## Important Context

The runtime error `setInput is not a function` occurs because AI SDK v6 changed the `useChat` hook API:

- **OLD (v3/v4)**: `useChat` returns `input`, `setInput`, `handleSubmit`, `append`
- **NEW (v5/v6)**: Must manage `input` with `useState` manually, use `sendMessage()` instead of `handleSubmit`/`append`

The file `app/components/chat/use-chat-core.ts` has been partially updated but needs completion. There are still 2 `append()` calls (around lines 372 and 456) that need to be converted to `sendMessage()`.

## Immediate Next Steps

1. **Complete the useChat v6 migration in use-chat-core.ts**:
   - Replace remaining `append()` calls with `sendMessage()` (there are 2 occurrences left)
   - Update the dependencies arrays in useCallback to remove `append` and add `sendMessage` where needed
2. **Test the fix**: Run `pnpm dev` and verify the chat works

3. **Run type-check**: `pnpm type-check` to ensure no TypeScript errors

## Work Completed

### Tasks Finished

- [x] Changed MODEL_DEFAULT to gemini-3-flash-preview
- [x] Updated NON_AUTH_ALLOWED_MODELS to ["gemini-3-flash-preview"]
- [x] Updated FREE_MODELS_IDS to include gemini-3-flash-preview

### Files Modified

| File                                 | Changes                                                         | Rationale                                                         |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| lib/config.ts                        | Changed MODEL_DEFAULT, NON_AUTH_ALLOWED_MODELS, FREE_MODELS_IDS | gpt-4.1-nano no longer exists, gemini is the only available model |
| app/components/chat/use-chat-core.ts | In progress: replacing v3 API with v6 API                       | Fix runtime error                                                 |

### Decisions Made

| Decision                              | Options Considered      | Rationale                                         |
| ------------------------------------- | ----------------------- | ------------------------------------------------- |
| Use gemini-3-flash-preview as default | OpenAI, Anthropic, etc. | Only gemini model data file remains after cleanup |

## Pending Work

### Blockers/Open Questions

- [ ] Need to verify the AI SDK v6 `sendMessage` API signature is correct
- [ ] The `append` function may have different behavior than `sendMessage` - need to verify message submission works

### Deferred Items

- TypeScript errors in other files (not related to this task)

## Potential Gotchas

- `sendMessage` has different signature than `append` - check the AI SDK v6 docs
- The `options` object structure may need adjustment when calling `sendMessage`
- There are still 2 `append()` calls that need to be converted to `sendMessage()`

### Files to Check

- `app/components/chat/use-chat-core.ts` - Main file being fixed
