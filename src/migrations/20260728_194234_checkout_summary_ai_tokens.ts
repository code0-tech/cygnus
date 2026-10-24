import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_checkout_summary_ai_tokens_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  ALTER TABLE "checkout" ADD COLUMN "summary_ai_tokens_icon" varchar DEFAULT 'tabler:IconBrain' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_ai_tokens_icon_color" "enum_checkout_summary_ai_tokens_icon_color" DEFAULT 'magenta' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_ai_tokens_label" varchar DEFAULT 'AI Tokens' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout" DROP COLUMN "summary_ai_tokens_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_ai_tokens_icon_color";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_ai_tokens_label";
  DROP TYPE "public"."enum_checkout_summary_ai_tokens_icon_color";`)
}
