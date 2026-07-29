import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_config"
      ALTER COLUMN "defaults_deployment" DROP DEFAULT;
    ALTER TYPE "public"."enum_subscription_config_defaults_deployment"
      RENAME VALUE 'self-hosted' TO 'self_hosted';
    ALTER TABLE "subscription_config"
      ALTER COLUMN "defaults_deployment"
      SET DEFAULT 'self_hosted'::"public"."enum_subscription_config_defaults_deployment";
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_config"
      ALTER COLUMN "defaults_deployment" DROP DEFAULT;
    ALTER TYPE "public"."enum_subscription_config_defaults_deployment"
      RENAME VALUE 'self_hosted' TO 'self-hosted';
    ALTER TABLE "subscription_config"
      ALTER COLUMN "defaults_deployment"
      SET DEFAULT 'self-hosted'::"public"."enum_subscription_config_defaults_deployment";
  `);
}
