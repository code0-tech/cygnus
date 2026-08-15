import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "licenses_locales"
        SET "editor_payment_method_success" = CASE
            WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode ist jetzt der Standard für zukünftige Rechnungen.'
            ELSE 'The payment method is now the default for future invoices.'
        END
        WHERE "editor_payment_method_success" IN (
            'The payment method was accepted and will become the default shortly.',
            'Die Zahlungsmethode wurde akzeptiert und wird in Kürze als Standard verwendet.'
        );
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "licenses_locales"
        SET "editor_payment_method_success" = CASE
            WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode wurde akzeptiert und wird in Kürze als Standard verwendet.'
            ELSE 'The payment method was accepted and will become the default shortly.'
        END
        WHERE "editor_payment_method_success" IN (
            'The payment method is now the default for future invoices.',
            'Die Zahlungsmethode ist jetzt der Standard für zukünftige Rechnungen.'
        );
    `)
}
