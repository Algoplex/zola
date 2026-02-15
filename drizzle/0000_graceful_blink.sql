CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet', 'bot', 'unknown');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"model" text,
	"title" text,
	"pinned" boolean DEFAULT false,
	"pinned_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"session_id" uuid,
	"role" text NOT NULL,
	"content" text,
	"parts" jsonb,
	"experimental_attachments" jsonb,
	"model" text,
	"message_group_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" "inet",
	"country_code" char(2),
	"region" text,
	"city" text,
	"isp" text,
	"asn" integer,
	"user_agent" text,
	"browser" text,
	"browser_version" text,
	"os" text,
	"os_version" text,
	"device_type" "device_type" DEFAULT 'unknown',
	"screen_width" integer,
	"screen_height" integer,
	"screen_color_depth" integer,
	"device_pixel_ratio" real,
	"viewport_width" integer,
	"viewport_height" integer,
	"cpu_cores" integer,
	"device_memory" real,
	"has_touch" boolean,
	"max_touch_points" integer,
	"gpu_renderer" text,
	"gpu_vendor" text,
	"language" text,
	"languages" text,
	"timezone" text,
	"timezone_offset" integer,
	"connection_type" text,
	"downlink_mbps" real,
	"rtt_ms" integer,
	"canvas_fingerprint" text,
	"audio_fingerprint" text,
	"webgl_fingerprint" text,
	"accept_language" text,
	"accept" text,
	"accept_encoding" text,
	"referer" text,
	"do_not_track" boolean,
	"cookies_enabled" boolean,
	"is_bot" boolean,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;