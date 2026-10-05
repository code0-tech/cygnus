import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_checkout_summary_deployment_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  CREATE TYPE "public"."enum_checkout_summary_customer_type_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  CREATE TYPE "public"."enum_checkout_summary_workflow_executions_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  CREATE TYPE "public"."enum_checkout_summary_additional_features_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icons_cloud" varchar DEFAULT 'tabler:IconCloud' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icons_self_hosted" varchar DEFAULT 'tabler:IconServer' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icon_color" "enum_checkout_summary_deployment_icon_color" DEFAULT 'aqua' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icons_b2b" varchar DEFAULT 'tabler:IconUsers' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icons_b2c" varchar DEFAULT 'tabler:IconBuildingStore' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icon_color" "enum_checkout_summary_customer_type_icon_color" DEFAULT 'yellow' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_workflow_executions_icon" varchar DEFAULT 'tabler:IconBolt' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_workflow_executions_icon_color" "enum_checkout_summary_workflow_executions_icon_color" DEFAULT 'brand' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon" varchar DEFAULT 'tabler:IconSparkles' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon_color" "enum_checkout_summary_additional_features_icon_color" DEFAULT 'yellow' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout" DROP COLUMN "summary_deployment_icons_cloud";
  ALTER TABLE "checkout" DROP COLUMN "summary_deployment_icons_self_hosted";
  ALTER TABLE "checkout" DROP COLUMN "summary_deployment_icon_color";
  ALTER TABLE "checkout" DROP COLUMN "summary_customer_type_icons_b2b";
  ALTER TABLE "checkout" DROP COLUMN "summary_customer_type_icons_b2c";
  ALTER TABLE "checkout" DROP COLUMN "summary_customer_type_icon_color";
  ALTER TABLE "checkout" DROP COLUMN "summary_workflow_executions_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_workflow_executions_icon_color";
  ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon_color";
  DROP TYPE "public"."enum_checkout_summary_deployment_icon_color";
  DROP TYPE "public"."enum_checkout_summary_customer_type_icon_color";
  DROP TYPE "public"."enum_checkout_summary_workflow_executions_icon_color";
  DROP TYPE "public"."enum_checkout_summary_additional_features_icon_color";`)
}
