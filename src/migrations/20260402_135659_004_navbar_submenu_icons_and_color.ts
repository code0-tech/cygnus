import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navbar_items_sub_menu" ALTER COLUMN "icon" SET DATA TYPE varchar;
  ALTER TABLE "navbar_items_sub_menu" DROP COLUMN "color";
  DROP TYPE "public"."enum_navbar_items_sub_menu_icon";
  DROP TYPE "public"."enum_navbar_items_sub_menu_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navbar_items_sub_menu_icon" AS ENUM('cube', 'gitBranch', 'lock');
  CREATE TYPE "public"."enum_navbar_items_sub_menu_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  ALTER TABLE "navbar_items_sub_menu" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_navbar_items_sub_menu_icon" USING "icon"::"public"."enum_navbar_items_sub_menu_icon";
  ALTER TABLE "navbar_items_sub_menu" ADD COLUMN "color" "enum_navbar_items_sub_menu_color" DEFAULT 'brand' NOT NULL;`)
}
