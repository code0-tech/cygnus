import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type type
          JOIN pg_enum value ON type.oid = value.enumtypid
          WHERE type.typname = 'enum_pages_slug'
            AND value.enumlabel = 'pricing'
        ) THEN
          ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'pricing';
        END IF;
      END
      $$;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "pages" WHERE "slug" = 'pricing') THEN
          RAISE EXCEPTION 'Cannot roll back the pricing page slug while pricing page records exist.';
        END IF;
      END
      $$;

      ALTER TYPE "public"."enum_pages_slug" RENAME TO "enum_pages_slug_old";
      CREATE TYPE "public"."enum_pages_slug" AS ENUM(
        'main',
        'jobs',
        'blog',
        'features',
        'about-us',
        'legal-notice',
        'privacy',
        'terms',
        'contact',
        'actions',
        'action-details',
        'community-edition',
        'enterprise-edition',
        'subscription'
      );
      ALTER TABLE "pages"
        ALTER COLUMN "slug" TYPE "public"."enum_pages_slug"
        USING "slug"::text::"public"."enum_pages_slug";
      DROP TYPE "public"."enum_pages_slug_old";
    `)
}
