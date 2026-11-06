import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_subscription_config_deployment_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_customer_type_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_payment_period_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_plan_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');

        ALTER TABLE "subscription_config"
            ADD COLUMN "deployment_color" "enum_subscription_config_deployment_color" DEFAULT 'aqua' NOT NULL,
            ADD COLUMN "customer_type_color" "enum_subscription_config_customer_type_color" DEFAULT 'blue' NOT NULL,
            ADD COLUMN "payment_period_color" "enum_subscription_config_payment_period_color" DEFAULT 'brand' NOT NULL,
            ADD COLUMN "plan_color" "enum_subscription_config_plan_color" DEFAULT 'lime' NOT NULL,
            DROP COLUMN "deployment_self_hosted_color",
            DROP COLUMN "deployment_cloud_color",
            DROP COLUMN "customer_type_b2b_color",
            DROP COLUMN "customer_type_b2c_color",
            DROP COLUMN "payment_period_monthly_color",
            DROP COLUMN "payment_period_quarterly_color",
            DROP COLUMN "payment_period_yearly_color";

        DROP TYPE "public"."enum_subscription_config_deployment_self_hosted_color";
        DROP TYPE "public"."enum_subscription_config_deployment_cloud_color";
        DROP TYPE "public"."enum_subscription_config_customer_type_b2b_color";
        DROP TYPE "public"."enum_subscription_config_customer_type_b2c_color";
        DROP TYPE "public"."enum_subscription_config_payment_period_monthly_color";
        DROP TYPE "public"."enum_subscription_config_payment_period_quarterly_color";
        DROP TYPE "public"."enum_subscription_config_payment_period_yearly_color";

        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "starting_price_label",
            DROP COLUMN "starting_price_suffix";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_subscription_config_deployment_self_hosted_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_deployment_cloud_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_customer_type_b2b_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_customer_type_b2c_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_payment_period_monthly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_payment_period_quarterly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_payment_period_yearly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');

        ALTER TABLE "subscription_config"
            ADD COLUMN "deployment_self_hosted_color" "enum_subscription_config_deployment_self_hosted_color" DEFAULT 'yellow' NOT NULL,
            ADD COLUMN "deployment_cloud_color" "enum_subscription_config_deployment_cloud_color" DEFAULT 'aqua' NOT NULL,
            ADD COLUMN "customer_type_b2b_color" "enum_subscription_config_customer_type_b2b_color" DEFAULT 'blue' NOT NULL,
            ADD COLUMN "customer_type_b2c_color" "enum_subscription_config_customer_type_b2c_color" DEFAULT 'pink' NOT NULL,
            ADD COLUMN "payment_period_monthly_color" "enum_subscription_config_payment_period_monthly_color" DEFAULT 'brand' NOT NULL,
            ADD COLUMN "payment_period_quarterly_color" "enum_subscription_config_payment_period_quarterly_color" DEFAULT 'aqua' NOT NULL,
            ADD COLUMN "payment_period_yearly_color" "enum_subscription_config_payment_period_yearly_color" DEFAULT 'magenta' NOT NULL,
            DROP COLUMN "deployment_color",
            DROP COLUMN "customer_type_color",
            DROP COLUMN "payment_period_color",
            DROP COLUMN "plan_color";

        DROP TYPE "public"."enum_subscription_config_deployment_color";
        DROP TYPE "public"."enum_subscription_config_customer_type_color";
        DROP TYPE "public"."enum_subscription_config_payment_period_color";
        DROP TYPE "public"."enum_subscription_config_plan_color";

        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "starting_price_label" varchar,
            ADD COLUMN "starting_price_suffix" varchar;

        UPDATE "subscription_config_locales" SET
            "starting_price_label" = CASE WHEN "_locale" = 'de' THEN 'ab' ELSE 'from' END,
            "starting_price_suffix" = CASE WHEN "_locale" = 'de' THEN '/Monat' ELSE '/mo' END;

        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "starting_price_label" SET NOT NULL,
            ALTER COLUMN "starting_price_suffix" SET NOT NULL;
    `)
}
