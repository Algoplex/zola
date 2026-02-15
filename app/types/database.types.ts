export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Drizzle schema types are generated from lib/db/schema.ts
// This file kept only for Attachment type
