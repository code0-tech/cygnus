import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Drops CMS global fields that no component reads anymore. IF EXISTS keeps the migration safe for local databases
// whose dev schema push already removed them.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_deployment_icons_cloud";
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_deployment_icons_self_hosted";
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_deployment_icon_color";
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_customer_type_icons_b2b";
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_customer_type_icons_b2c";
        ALTER TABLE "checkout" DROP COLUMN IF EXISTS "summary_customer_type_icon_color";
        ALTER TABLE "checkout_locales" DROP COLUMN IF EXISTS "summary_pricing_plan_label";
        ALTER TABLE "checkout_locales" DROP COLUMN IF EXISTS "summary_pricing_quarterly_discount_label";
        ALTER TABLE "checkout_locales" DROP COLUMN IF EXISTS "summary_pricing_yearly_discount_label";

        ALTER TABLE "subscription_config" DROP COLUMN IF EXISTS "plan_pro_color";
        ALTER TABLE "subscription_config" DROP COLUMN IF EXISTS "plan_max_color";
        ALTER TABLE "subscription_config" DROP COLUMN IF EXISTS "plan_custom_color";
        ALTER TABLE "subscription_config_locales" DROP COLUMN IF EXISTS "workflow_executions_description";
        ALTER TABLE "subscription_config_locales" DROP COLUMN IF EXISTS "ai_tokens_description";

        ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "sidebar_application_settings_label";
        ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "invoices_tax_label";
        ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "withdrawal_text";
        ALTER TABLE "license_dialogs_locales" DROP COLUMN IF EXISTS "billing_title";

        DROP TYPE IF EXISTS "public"."enum_checkout_summary_deployment_icon_color";
        DROP TYPE IF EXISTS "public"."enum_checkout_summary_customer_type_icon_color";
        DROP TYPE IF EXISTS "public"."enum_subscription_config_plan_pro_color";
        DROP TYPE IF EXISTS "public"."enum_subscription_config_plan_max_color";
        DROP TYPE IF EXISTS "public"."enum_subscription_config_plan_custom_color";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_checkout_summary_deployment_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
        CREATE TYPE "public"."enum_checkout_summary_customer_type_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_plan_pro_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_plan_max_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        CREATE TYPE "public"."enum_subscription_config_plan_custom_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');

        ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icons_cloud" varchar DEFAULT 'tabler:IconCloud' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icons_self_hosted" varchar DEFAULT 'tabler:IconServer' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_deployment_icon_color" "enum_checkout_summary_deployment_icon_color" DEFAULT 'aqua' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icons_b2b" varchar DEFAULT 'tabler:IconUsers' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icons_b2c" varchar DEFAULT 'tabler:IconBuildingStore' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_customer_type_icon_color" "enum_checkout_summary_customer_type_icon_color" DEFAULT 'yellow' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_plan_label" varchar DEFAULT 'Plan' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_quarterly_discount_label" varchar DEFAULT 'Quarterly discount' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_yearly_discount_label" varchar DEFAULT 'Yearly discount' NOT NULL;

        ALTER TABLE "subscription_config" ADD COLUMN "plan_pro_color" "enum_subscription_config_plan_pro_color" DEFAULT 'lime' NOT NULL;
        ALTER TABLE "subscription_config" ADD COLUMN "plan_max_color" "enum_subscription_config_plan_max_color" DEFAULT 'magenta' NOT NULL;
        ALTER TABLE "subscription_config" ADD COLUMN "plan_custom_color" "enum_subscription_config_plan_custom_color" DEFAULT 'yellow' NOT NULL;
        ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_description" varchar;
        ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_description" varchar;

        ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_application_settings_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_tax_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "withdrawal_text" varchar;
        UPDATE "licenses_locales" SET
            "sidebar_application_settings_label" = CASE WHEN "_locale" = 'de' THEN 'Anwendungseinstellungen' ELSE 'Application settings' END,
            "invoices_tax_label" = CASE WHEN "_locale" = 'de' THEN 'Steuer' ELSE 'Tax' END,
            "withdrawal_text" = CASE WHEN "_locale" = 'de'
                THEN 'Du kannst diesen Kauf bis zum {date} kostenlos widerrufen.'
                ELSE 'You can withdraw from this purchase free of charge until {date}.'
            END;
        ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_application_settings_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_tax_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "withdrawal_text" SET NOT NULL;

        ALTER TABLE "license_dialogs_locales" ADD COLUMN "billing_title" varchar;
        UPDATE "license_dialogs_locales" SET "billing_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsperiode ändern' ELSE 'Change Period' END;
        ALTER TABLE "license_dialogs_locales" ALTER COLUMN "billing_title" SET NOT NULL;
    `)
}
