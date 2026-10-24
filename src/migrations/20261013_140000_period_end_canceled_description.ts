import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "billing_current_period_end_canceled_description" varchar;

        UPDATE "licenses_locales" SET
            "billing_current_period_end_canceled_description" = CASE WHEN "_locale" = 'de' THEN 'Das Abonnement ist gekündigt, der Zugriff endet am {date}.' ELSE 'The subscription is canceled, access ends on {date}.' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "billing_current_period_end_canceled_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "billing_current_period_end_canceled_description";
    `)
}
