import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ALTER COLUMN "defaults_deployment" DROP DEFAULT;
   ALTER TABLE "subscription_config" ALTER COLUMN "defaults_deployment" SET DATA TYPE "public"."enum_subscription_config_defaults_deployment" USING "defaults_deployment"::text::"public"."enum_subscription_config_defaults_deployment";
   ALTER TABLE "subscription_config" ALTER COLUMN "defaults_deployment" SET DEFAULT 'self-hosted'::"public"."enum_subscription_config_defaults_deployment";
   ALTER TABLE "pages_blocks_action_list" ADD COLUMN IF NOT EXISTS "load_more_label" varchar DEFAULT 'Load more' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_action_list" DROP COLUMN "load_more_label";`)
}
