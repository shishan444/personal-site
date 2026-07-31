ALTER TABLE "users" DROP CONSTRAINT "users_avatar_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;