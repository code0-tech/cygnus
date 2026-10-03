import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres"

// Update the shipped defaults without overwriting customized CMS translations.
// cancelAt ends the subscription; the paid license period and its separate grace period are preserved.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
  UPDATE "license_dialogs_locales" SET "cancel_description" = 'Cancellation takes effect at the end of the current billing period. Existing licenses remain valid for the periods already paid for.' WHERE "_locale" = 'en' AND "cancel_description" = 'You''ll keep access until the end of the period you already paid for.';
  UPDATE "license_dialogs_locales" SET "cancel_description" = 'Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam. Bereits bezahlte Lizenzzeiträume bleiben gültig.' WHERE "_locale" = 'de' AND "cancel_description" = 'Du behältst den Zugriff bis zum Ende der bereits bezahlten Periode.';
  UPDATE "license_dialogs_locales" SET "cancel_confirm_label" = 'Cancel at period end' WHERE "_locale" = 'en' AND "cancel_confirm_label" = 'Cancel subscription';
  UPDATE "license_dialogs_locales" SET "cancel_confirm_label" = 'Zum Periodenende kündigen' WHERE "_locale" = 'de' AND "cancel_confirm_label" = 'Abonnement kündigen';
  UPDATE "license_dialogs_locales" SET "cancel_pending_description" = 'The subscription ends on the date below. Existing licenses remain valid for the periods already paid for.' WHERE "_locale" = 'en' AND "cancel_pending_description" = 'You''ll keep access until the date below.';
  UPDATE "license_dialogs_locales" SET "cancel_pending_description" = 'Das Abonnement endet zum unten stehenden Datum. Bereits bezahlte Lizenzzeiträume bleiben gültig.' WHERE "_locale" = 'de' AND "cancel_pending_description" = 'Du behältst den Zugriff bis zum unten stehenden Datum.';
  UPDATE "license_dialogs_locales" SET "cancel_cancel_at_label" = 'Subscription ends' WHERE "_locale" = 'en' AND "cancel_cancel_at_label" = 'Access ends';
  UPDATE "license_dialogs_locales" SET "cancel_cancel_at_label" = 'Abonnement endet' WHERE "_locale" = 'de' AND "cancel_cancel_at_label" = 'Zugriff endet';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
  UPDATE "license_dialogs_locales" SET "cancel_description" = 'You''ll keep access until the end of the period you already paid for.' WHERE "_locale" = 'en' AND "cancel_description" = 'Cancellation takes effect at the end of the current billing period. Existing licenses remain valid for the periods already paid for.';
  UPDATE "license_dialogs_locales" SET "cancel_description" = 'Du behältst den Zugriff bis zum Ende der bereits bezahlten Periode.' WHERE "_locale" = 'de' AND "cancel_description" = 'Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam. Bereits bezahlte Lizenzzeiträume bleiben gültig.';
  UPDATE "license_dialogs_locales" SET "cancel_confirm_label" = 'Cancel subscription' WHERE "_locale" = 'en' AND "cancel_confirm_label" = 'Cancel at period end';
  UPDATE "license_dialogs_locales" SET "cancel_confirm_label" = 'Abonnement kündigen' WHERE "_locale" = 'de' AND "cancel_confirm_label" = 'Zum Periodenende kündigen';
  UPDATE "license_dialogs_locales" SET "cancel_pending_description" = 'You''ll keep access until the date below.' WHERE "_locale" = 'en' AND "cancel_pending_description" = 'The subscription ends on the date below. Existing licenses remain valid for the periods already paid for.';
  UPDATE "license_dialogs_locales" SET "cancel_pending_description" = 'Du behältst den Zugriff bis zum unten stehenden Datum.' WHERE "_locale" = 'de' AND "cancel_pending_description" = 'Das Abonnement endet zum unten stehenden Datum. Bereits bezahlte Lizenzzeiträume bleiben gültig.';
  UPDATE "license_dialogs_locales" SET "cancel_cancel_at_label" = 'Access ends' WHERE "_locale" = 'en' AND "cancel_cancel_at_label" = 'Subscription ends';
  UPDATE "license_dialogs_locales" SET "cancel_cancel_at_label" = 'Zugriff endet' WHERE "_locale" = 'de' AND "cancel_cancel_at_label" = 'Abonnement endet';`)
}
