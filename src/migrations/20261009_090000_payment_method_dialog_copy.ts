import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
  UPDATE "license_dialogs_locales"
    SET "editor_add_payment_method_label" = 'Add new payment method'
    WHERE "_locale" = 'en' AND "editor_add_payment_method_label" = 'Add payment method';
  UPDATE "license_dialogs_locales"
    SET "editor_add_payment_method_label" = 'Neue Zahlungsmethode hinzufügen'
    WHERE "_locale" = 'de' AND "editor_add_payment_method_label" = 'Zahlungsmethode hinzufügen';
  UPDATE "license_dialogs_locales"
    SET "editor_payment_method_success" = 'Payment method added successfully.'
    WHERE "_locale" = 'en' AND "editor_payment_method_success" = 'The payment method is now the default for future invoices.';
  UPDATE "license_dialogs_locales"
    SET "editor_payment_method_success" = 'Zahlungsmethode erfolgreich hinzugefügt.'
    WHERE "_locale" = 'de' AND "editor_payment_method_success" = 'Die Zahlungsmethode ist jetzt der Standard für zukünftige Rechnungen.';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
  UPDATE "license_dialogs_locales"
    SET "editor_add_payment_method_label" = 'Add payment method'
    WHERE "_locale" = 'en' AND "editor_add_payment_method_label" = 'Add new payment method';
  UPDATE "license_dialogs_locales"
    SET "editor_add_payment_method_label" = 'Zahlungsmethode hinzufügen'
    WHERE "_locale" = 'de' AND "editor_add_payment_method_label" = 'Neue Zahlungsmethode hinzufügen';
  UPDATE "license_dialogs_locales"
    SET "editor_payment_method_success" = 'The payment method is now the default for future invoices.'
    WHERE "_locale" = 'en' AND "editor_payment_method_success" = 'Payment method added successfully.';
  UPDATE "license_dialogs_locales"
    SET "editor_payment_method_success" = 'Die Zahlungsmethode ist jetzt der Standard für zukünftige Rechnungen.'
    WHERE "_locale" = 'de' AND "editor_payment_method_success" = 'Zahlungsmethode erfolgreich hinzugefügt.';`)
}
