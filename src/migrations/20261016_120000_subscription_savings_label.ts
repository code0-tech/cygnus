import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "payment_period_savings_label" varchar;

        UPDATE "subscription_config_locales" SET
            "payment_period_savings_label" = CASE WHEN "_locale" = 'de' THEN 'Spare' ELSE 'Save' END;

        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "payment_period_savings_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "payment_period_savings_label";
    `)
}
