import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "pages_blocks_pricing" ADD COLUMN "popular_pill_icon" varchar DEFAULT 'tabler:IconSparkles';
  ALTER TABLE "pages_blocks_pricing" ADD COLUMN "popular_pill_text" varchar DEFAULT 'Popular';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "pages_blocks_pricing" DROP COLUMN "popular_pill_icon";
  ALTER TABLE "pages_blocks_pricing" DROP COLUMN "popular_pill_text";`)
}
