import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
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

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "starting_price_label",
            DROP COLUMN "starting_price_suffix";
    `)
}
