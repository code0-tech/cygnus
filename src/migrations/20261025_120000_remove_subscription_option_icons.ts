import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config"
            DROP COLUMN "deployment_self_hosted_icon",
            DROP COLUMN "deployment_cloud_icon",
            DROP COLUMN "customer_type_b2b_icon",
            DROP COLUMN "customer_type_b2c_icon",
            DROP COLUMN "plan_pro_icon",
            DROP COLUMN "plan_max_icon",
            DROP COLUMN "plan_custom_icon";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config"
            ADD COLUMN "deployment_self_hosted_icon" varchar DEFAULT 'server' NOT NULL,
            ADD COLUMN "deployment_cloud_icon" varchar DEFAULT 'cloud' NOT NULL,
            ADD COLUMN "customer_type_b2b_icon" varchar DEFAULT 'briefcase-2' NOT NULL,
            ADD COLUMN "customer_type_b2c_icon" varchar DEFAULT 'building-store' NOT NULL,
            ADD COLUMN "plan_pro_icon" varchar DEFAULT 'sparkles' NOT NULL,
            ADD COLUMN "plan_max_icon" varchar DEFAULT 'rocket' NOT NULL,
            ADD COLUMN "plan_custom_icon" varchar DEFAULT 'settings' NOT NULL;
    `)
}
