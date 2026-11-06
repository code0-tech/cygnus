import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "sidebar_back_to_customers_label" varchar,
            ADD COLUMN "dashboard_customers_label" varchar,
            ADD COLUMN "dashboard_customers_description" varchar,
            ADD COLUMN "dashboard_type_label" varchar;

        UPDATE "licenses_locales" SET
            "sidebar_back_to_customers_label" = CASE WHEN "_locale" = 'de' THEN 'Alle Kunden' ELSE 'All customers' END,
            "dashboard_customers_label" = CASE WHEN "_locale" = 'de' THEN 'Kunden' ELSE 'Customers' END,
            "dashboard_customers_description" = CASE WHEN "_locale" = 'de'
                THEN 'Wähle einen Kunden, um seine Lizenzen zu sehen.'
                ELSE 'Select a customer to see its licenses.' END,
            "dashboard_type_label" = CASE WHEN "_locale" = 'de' THEN 'Typ' ELSE 'Type' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "sidebar_back_to_customers_label" SET NOT NULL,
            ALTER COLUMN "dashboard_customers_label" SET NOT NULL,
            ALTER COLUMN "dashboard_customers_description" SET NOT NULL,
            ALTER COLUMN "dashboard_type_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "sidebar_back_to_customers_label",
            DROP COLUMN "dashboard_customers_label",
            DROP COLUMN "dashboard_customers_description",
            DROP COLUMN "dashboard_type_label";
    `)
}
