ALTER TABLE "asset_links" ALTER COLUMN "asset_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "asset_links" ADD COLUMN "external_url" varchar(512);--> statement-breakpoint
ALTER TABLE "essays" ADD COLUMN "deleted_at" timestamp with time zone;