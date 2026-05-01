import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_bento_variant" AS ENUM('feature', 'runtime');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "pages_blocks_bento" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "variant" "enum_pages_blocks_bento_variant" DEFAULT 'feature' NOT NULL,
      "block_name" varchar
    );

    ALTER TABLE "pages_blocks_bento"
      ADD CONSTRAINT "pages_blocks_bento_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_order_idx" ON "pages_blocks_bento" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_parent_id_idx" ON "pages_blocks_bento" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_path_idx" ON "pages_blocks_bento" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_locale_idx" ON "pages_blocks_bento" USING btree ("_locale");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_bento" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_bento_variant";
  `)
}
