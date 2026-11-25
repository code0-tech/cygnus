import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE "public"."enum_blog_hero_media_type" AS ENUM ('image', 'playground');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        ALTER TABLE "blog"
            ADD COLUMN IF NOT EXISTS "hero_media_type" "public"."enum_blog_hero_media_type" DEFAULT 'image',
            ADD COLUMN IF NOT EXISTS "hero_playground_url" varchar;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "blog"
            DROP COLUMN IF EXISTS "hero_playground_url",
            DROP COLUMN IF EXISTS "hero_media_type";
        DROP TYPE IF EXISTS "public"."enum_blog_hero_media_type";
    `)
}
