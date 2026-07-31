CREATE TYPE "public"."agent_status" AS ENUM('active', 'beta', 'archived', 'coming');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'publish', 'archive', 'login', 'logout');--> statement-breakpoint
CREATE TYPE "public"."click_target" AS ENUM('internal', 'external');--> statement-breakpoint
CREATE TYPE "public"."essay_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."essay_type_tag" AS ENUM('essay', 'note', 'tutorial');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('zh', 'en');--> statement-breakpoint
CREATE TYPE "public"."launch_type" AS ENUM('external', 'iframe', 'modal');--> statement-breakpoint
CREATE TYPE "public"."modal_size" AS ENUM('small', 'medium', 'large', 'full');--> statement-breakpoint
CREATE TYPE "public"."revision_action" AS ENUM('created', 'edited', 'published', 'archived', 'restored');--> statement-breakpoint
CREATE TYPE "public"."timeline_type" AS ENUM('genesis', 'first', 'normal', 'now', 'future');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'editor', 'author', 'viewer');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"name" varchar(64) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"avatar_asset_id" uuid,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(256) NOT NULL,
	"type" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(256) NOT NULL,
	"original_filename" varchar(256) NOT NULL,
	"mime_type" varchar(64) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"storage_path" text NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sn" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"desc" text NOT NULL,
	"long_desc" text,
	"status" "agent_status" DEFAULT 'coming' NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"card_image_asset_id" uuid,
	"click_target" "click_target" DEFAULT 'internal' NOT NULL,
	"launch_type" "launch_type" DEFAULT 'external' NOT NULL,
	"launch_url" text,
	"modal_size" "modal_size",
	"order" integer NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "essays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sn" varchar(16) NOT NULL,
	"lang" "language" NOT NULL,
	"translation_group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"deck" text NOT NULL,
	"body" text NOT NULL,
	"type_tag" "essay_type_tag" NOT NULL,
	"topic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "essay_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"slug" varchar(256),
	"og_title" text,
	"og_description" text,
	"og_image_asset_id" uuid,
	"related_agent_id" uuid,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"allow_comment" boolean DEFAULT true NOT NULL,
	"words" integer DEFAULT 0 NOT NULL,
	"read_minutes" integer DEFAULT 0 NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"desc" text NOT NULL,
	"type" timeline_type NOT NULL,
	"date" date NOT NULL,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"files_changed" integer,
	"lines_add" integer,
	"lines_del" integer,
	"related_agent_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_now" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"source_type" varchar(32) NOT NULL,
	"source_id" uuid NOT NULL,
	"usage" varchar(32) NOT NULL,
	"caption" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"site_name" varchar(64) DEFAULT 'Atelier' NOT NULL,
	"subtitle" varchar(256) NOT NULL,
	"current_version" varchar(16) DEFAULT 'v0.4' NOT NULL,
	"current_calibre" varchar(8) DEFAULT '04' NOT NULL,
	"hero_sub" text NOT NULL,
	"logo_asset_id" uuid,
	"favicon_asset_id" uuid,
	"rd_meta_1" varchar(256) NOT NULL,
	"rd_meta_2" varchar(256) NOT NULL,
	"subdials_config" jsonb NOT NULL,
	"chapters_config" jsonb NOT NULL,
	"global_stats" jsonb NOT NULL,
	"theme" varchar(32) DEFAULT 'warm-amber' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_config_single_row" CHECK ("id" = 1)
);
--> statement-breakpoint
CREATE TABLE "essay_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"essay_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"action" "revision_action" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"target_id" uuid,
	"summary" text,
	"metadata" jsonb,
	"ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_asset_id_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_card_image_asset_id_assets_id_fk" FOREIGN KEY ("card_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "essays" ADD CONSTRAINT "essays_og_image_asset_id_assets_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "essays" ADD CONSTRAINT "essays_related_agent_id_agents_id_fk" FOREIGN KEY ("related_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "essays" ADD CONSTRAINT "essays_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_links" ADD CONSTRAINT "asset_links_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_logo_asset_id_assets_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_favicon_asset_id_assets_id_fk" FOREIGN KEY ("favicon_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "essay_revisions" ADD CONSTRAINT "essay_revisions_essay_id_essays_id_fk" FOREIGN KEY ("essay_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "essay_revisions" ADD CONSTRAINT "essay_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "assets_checksum_idx" ON "assets" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "assets_mime_idx" ON "assets" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "assets_uploader_idx" ON "assets" USING btree ("uploaded_by");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_sn_idx" ON "agents" USING btree ("sn");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_order_idx" ON "agents" USING btree ("order");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "essays_sn_idx" ON "essays" USING btree ("sn");--> statement-breakpoint
CREATE UNIQUE INDEX "essays_slug_idx" ON "essays" USING btree ("slug") WHERE "slug" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "essays_status_published_idx" ON "essays" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "essays_translation_idx" ON "essays" USING btree ("translation_group_id","lang");--> statement-breakpoint
CREATE INDEX "essays_topic_tags_idx" ON "essays" USING gin ("topic_tags");--> statement-breakpoint
CREATE INDEX "essays_type_tag_idx" ON "essays" USING btree ("type_tag");--> statement-breakpoint
CREATE INDEX "essays_author_idx" ON "essays" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "timeline_date_idx" ON "timeline_nodes" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "timeline_one_now_idx" ON "timeline_nodes" USING btree ("is_now") WHERE "is_now" = true;--> statement-breakpoint
CREATE INDEX "asset_links_asset_idx" ON "asset_links" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_links_source_idx" ON "asset_links" USING btree ("source_type","source_id","usage","order_index");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");