import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_slug" ADD VALUE IF NOT EXISTS 'action-details' AFTER 'actions';
  DELETE FROM "pages_blocks_flow_example_flow_items_segments" AS "segment"
  WHERE NOT EXISTS (
    SELECT 1
    FROM "pages_blocks_flow_example_flow_items" AS "item"
    WHERE "item"."id" = "segment"."_parent_id"
  );
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM "pg_constraint"
      WHERE "conname" = 'pages_blocks_flow_example_flow_items_segments_parent_id_fk'
    ) THEN
      ALTER TABLE "pages_blocks_flow_example_flow_items_segments"
      ADD CONSTRAINT "pages_blocks_flow_example_flow_items_segments_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."pages_blocks_flow_example_flow_items"("id")
      ON DELETE cascade
      ON UPDATE no action;
    END IF;
  END
  $$;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD COLUMN IF NOT EXISTS "icon" varchar;
  UPDATE "pages_blocks_flow_example_flow_items"
  SET "icon" = 'tabler:IconCube'
  WHERE "icon" IS NULL;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ALTER COLUMN "icon" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_flow_example_flow_items" DROP COLUMN IF EXISTS "icon";`)
}
