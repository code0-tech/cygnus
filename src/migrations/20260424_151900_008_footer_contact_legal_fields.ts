import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer_locales" ADD COLUMN "description" varchar;
  ALTER TABLE "footer" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "footer_locales" ADD COLUMN "legal_links_privacy_label" varchar;
  ALTER TABLE "footer" ADD COLUMN "legal_links_privacy_url" varchar;
  ALTER TABLE "footer_locales" ADD COLUMN "legal_links_legal_notice_label" varchar;
  ALTER TABLE "footer" ADD COLUMN "legal_links_legal_notice_url" varchar;

  ALTER TABLE "blog" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;
  CREATE INDEX "blog_is_pinned_idx" ON "blog" USING btree ("is_pinned");

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_pages_slug' AND e.enumlabel = 'blog'
    ) THEN
      ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'blog';
    END IF;
  END
  $$;

  CREATE TABLE IF NOT EXISTS "pages_blocks_blog" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view_other_blogs_label" varchar DEFAULT 'View other blog posts' NOT NULL,
  	"no_posts_label" varchar DEFAULT 'No blog posts available.' NOT NULL,
  	"load_more_label" varchar DEFAULT 'Load more' NOT NULL,
  	"loading_label" varchar DEFAULT 'Loading...' NOT NULL,
  	"block_name" varchar
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_blog_parent_id_fk'
    ) THEN
      ALTER TABLE "pages_blocks_blog" ADD CONSTRAINT "pages_blocks_blog_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END
  $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_blog_order_idx" ON "pages_blocks_blog" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_blog_parent_id_idx" ON "pages_blocks_blog" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_blog_path_idx" ON "pages_blocks_blog" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_blog_locale_idx" ON "pages_blocks_blog" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pages_blocks_blog" CASCADE;

  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_slug";
  CREATE TYPE "public"."enum_pages_slug" AS ENUM('main', 'jobs', 'features', 'about-us', 'legal-notice', 'privacy', 'terms', 'contact', 'community-edition', 'enterprise-edition', 'subscription');
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE "public"."enum_pages_slug" USING "slug"::"public"."enum_pages_slug";

  DROP INDEX "blog_is_pinned_idx";
  ALTER TABLE "blog" DROP COLUMN "is_pinned";

   ALTER TABLE "footer_locales" DROP COLUMN "description";
  ALTER TABLE "footer" DROP COLUMN "contact_email";
  ALTER TABLE "footer_locales" DROP COLUMN "legal_links_privacy_label";
  ALTER TABLE "footer" DROP COLUMN "legal_links_privacy_url";
  ALTER TABLE "footer_locales" DROP COLUMN "legal_links_legal_notice_label";
  ALTER TABLE "footer" DROP COLUMN "legal_links_legal_notice_url";`)
}
