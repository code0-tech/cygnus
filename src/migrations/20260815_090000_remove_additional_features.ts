import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE "subscription_config_additional_features_locales" CASCADE;
        DROP TABLE "subscription_config_additional_features" CASCADE;

        ALTER TABLE "subscription_config_locales" DROP COLUMN "additional_features_label";
        ALTER TABLE "subscription_config_locales" DROP COLUMN "additional_features_description";
        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "plan_custom_description" SET DEFAULT 'Configure usage for an individual setup.';
        UPDATE "subscription_config_locales"
        SET "plan_custom_description" = 'Configure usage for an individual setup.'
        WHERE "plan_custom_description" = 'Configure usage and additional features for an individual setup.';

        ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon";
        ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon_color";
        DROP TYPE "public"."enum_checkout_summary_additional_features_icon_color";

        ALTER TABLE "checkout_locales" DROP COLUMN "summary_additional_features_label";
        ALTER TABLE "checkout_locales" DROP COLUMN "summary_additional_features_description";
        ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_additional_features_label";
        ALTER TABLE "checkout_locales"
            ALTER COLUMN "summary_description" SET DEFAULT 'This checkout reflects the subscription shape you configured, including runtime.';
        UPDATE "checkout_locales"
        SET "summary_description" = 'This checkout reflects the subscription shape you configured, including runtime.'
        WHERE "summary_description" = 'This checkout reflects the subscription shape you configured, including runtime and optional add-ons.';
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_checkout_summary_additional_features_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');

        CREATE TABLE "subscription_config_additional_features" (
            "_order" integer NOT NULL,
            "_parent_id" integer NOT NULL,
            "id" varchar PRIMARY KEY NOT NULL,
            "icon" varchar NOT NULL,
            "price" numeric DEFAULT 0,
            "weekly_price" numeric DEFAULT 0,
            CONSTRAINT "subscription_config_additional_features_parent_id_fk"
                FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade
        );
        CREATE INDEX "subscription_config_additional_features_order_idx" ON "subscription_config_additional_features" USING btree ("_order");
        CREATE INDEX "subscription_config_additional_features_parent_id_idx" ON "subscription_config_additional_features" USING btree ("_parent_id");

        CREATE TABLE "subscription_config_additional_features_locales" (
            "title" varchar,
            "description" varchar,
            "id" serial PRIMARY KEY NOT NULL,
            "_locale" "_locales" NOT NULL,
            "_parent_id" varchar NOT NULL,
            CONSTRAINT "subscription_config_additional_features_locales_locale_paren" UNIQUE("_locale", "_parent_id"),
            CONSTRAINT "subscription_config_additional_features_locales_parent_id_fk"
                FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_additional_features"("id") ON DELETE cascade
        );

        ALTER TABLE "subscription_config_locales" ADD COLUMN "additional_features_label" varchar;
        ALTER TABLE "subscription_config_locales" ADD COLUMN "additional_features_description" varchar;
        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "plan_custom_description" SET DEFAULT 'Configure usage and additional features for an individual setup.';
        UPDATE "subscription_config_locales"
        SET "plan_custom_description" = 'Configure usage and additional features for an individual setup.'
        WHERE "plan_custom_description" = 'Configure usage for an individual setup.';

        ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon" varchar DEFAULT 'tabler:IconSparkles' NOT NULL;
        ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon_color" "enum_checkout_summary_additional_features_icon_color" DEFAULT 'yellow' NOT NULL;

        ALTER TABLE "checkout_locales" ADD COLUMN "summary_additional_features_label" varchar DEFAULT 'Additional Features' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "summary_additional_features_description" varchar DEFAULT 'Selected add-ons that extend the base subscription.' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_additional_features_label" varchar DEFAULT 'Additional Features' NOT NULL;
        ALTER TABLE "checkout_locales"
            ALTER COLUMN "summary_description" SET DEFAULT 'This checkout reflects the subscription shape you configured, including runtime and optional add-ons.';
        UPDATE "checkout_locales"
        SET "summary_description" = 'This checkout reflects the subscription shape you configured, including runtime and optional add-ons.'
        WHERE "summary_description" = 'This checkout reflects the subscription shape you configured, including runtime.';
    `)
}
