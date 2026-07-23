import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_flow_example_flow_layout" AS ENUM('left', 'right');
  ALTER TABLE "pages_blocks_flow_example" ADD COLUMN "flow_layout" "enum_pages_blocks_flow_example_flow_layout" DEFAULT 'left' NOT NULL;
  UPDATE "pages_blocks_flow_example"
  SET "flow_layout" = CASE
    WHEN "section_layout"::text = 'flowRight' THEN 'right'::"public"."enum_pages_blocks_flow_example_flow_layout"
    ELSE 'left'::"public"."enum_pages_blocks_flow_example_flow_layout"
  END;
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" DROP DEFAULT;
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DATA TYPE text USING "section_layout"::text;
  UPDATE "pages_blocks_flow_example"
  SET "section_layout" = CASE
    WHEN "section_layout" = 'flowCenter' THEN 'center'
    ELSE 'left'
  END;
  DROP TYPE "public"."enum_pages_blocks_flow_example_section_layout";
  CREATE TYPE "public"."enum_pages_blocks_flow_example_section_layout" AS ENUM('center', 'left');
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DATA TYPE "public"."enum_pages_blocks_flow_example_section_layout" USING "section_layout"::"public"."enum_pages_blocks_flow_example_section_layout";
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DEFAULT 'center'::"public"."enum_pages_blocks_flow_example_section_layout";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" DROP DEFAULT;
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DATA TYPE text USING "section_layout"::text;
  UPDATE "pages_blocks_flow_example"
  SET "section_layout" = CASE
    WHEN "section_layout" = 'center' THEN 'flowCenter'
    WHEN "flow_layout"::text = 'right' THEN 'flowRight'
    ELSE 'flowLeft'
  END;
  DROP TYPE "public"."enum_pages_blocks_flow_example_section_layout";
  CREATE TYPE "public"."enum_pages_blocks_flow_example_section_layout" AS ENUM('flowCenter', 'flowLeft', 'flowRight');
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DATA TYPE "public"."enum_pages_blocks_flow_example_section_layout" USING "section_layout"::"public"."enum_pages_blocks_flow_example_section_layout";
  ALTER TABLE "pages_blocks_flow_example" ALTER COLUMN "section_layout" SET DEFAULT 'flowCenter'::"public"."enum_pages_blocks_flow_example_section_layout";
  ALTER TABLE "pages_blocks_flow_example" DROP COLUMN "flow_layout";
  DROP TYPE "public"."enum_pages_blocks_flow_example_flow_layout";`)
}
