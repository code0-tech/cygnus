import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_pricing_popular_pill_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  ALTER TABLE "pages_blocks_pricing" ADD COLUMN "popular_pill_color" "enum_pages_blocks_pricing_popular_pill_color" DEFAULT 'brand';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_pricing" DROP COLUMN "popular_pill_color";
  DROP TYPE "public"."enum_pages_blocks_pricing_popular_pill_color";`);
}
