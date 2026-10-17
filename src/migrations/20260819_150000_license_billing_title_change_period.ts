import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "licenses_locales" SET
            "billing_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsperiode ändern' ELSE 'Change Period' END;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "licenses_locales" SET
            "billing_title" = CASE WHEN "_locale" = 'de' THEN 'Abrechnung' ELSE 'Billing' END;
    `)
}
