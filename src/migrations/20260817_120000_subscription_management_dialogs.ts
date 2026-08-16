import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_total_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_proration_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_immediate_note" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_scheduled_note" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_loading_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_title" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_period_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_current_period_end_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_pending_change_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_update_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_title" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_confirm_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_heading" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_cancel_at_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_resume_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_cancel_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_resume_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_title" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_plan_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_increase_only_note" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_update_error" varchar;

        UPDATE "licenses_locales" SET
            "subscription_preview_total_label" = CASE WHEN "_locale" = 'de' THEN 'Neuer Gesamtbetrag' ELSE 'New total' END,
            "subscription_preview_proration_label" = CASE WHEN "_locale" = 'de' THEN 'Heute berechnet' ELSE 'Charged today' END,
            "subscription_preview_immediate_note" = CASE WHEN "_locale" = 'de' THEN 'Diese Änderung wird sofort wirksam.' ELSE 'This change applies immediately.' END,
            "subscription_preview_scheduled_note" = CASE
                WHEN "_locale" = 'de' THEN 'Diese Änderung wird am Ende der aktuellen Abrechnungsperiode wirksam.'
                ELSE 'This change applies at the end of your current billing period.'
            END,
            "subscription_preview_loading_label" = CASE WHEN "_locale" = 'de' THEN 'Wird berechnet …' ELSE 'Calculating…' END,
            "subscription_preview_error" = CASE WHEN "_locale" = 'de' THEN 'Die Änderung konnte nicht vorausberechnet werden.' ELSE 'The change could not be previewed.' END,
            "billing_title" = CASE WHEN "_locale" = 'de' THEN 'Abrechnung' ELSE 'Billing' END,
            "billing_description" = CASE
                WHEN "_locale" = 'de' THEN 'Sieh dir dein Abonnement an und ändere, wie oft du abgerechnet wirst.'
                ELSE 'Review your subscription and change how often you''re billed.'
            END,
            "billing_period_label" = CASE WHEN "_locale" = 'de' THEN 'Abrechnungsintervall' ELSE 'Billing period' END,
            "billing_current_period_end_label" = CASE WHEN "_locale" = 'de' THEN 'Aktuelle Periode endet' ELSE 'Current period ends' END,
            "billing_pending_change_label" = CASE WHEN "_locale" = 'de' THEN 'Geplante Änderung' ELSE 'Scheduled change' END,
            "billing_update_error" = CASE WHEN "_locale" = 'de' THEN 'Das Abrechnungsintervall konnte nicht aktualisiert werden.' ELSE 'The billing period could not be updated.' END,
            "cancel_title" = CASE WHEN "_locale" = 'de' THEN 'Abonnement kündigen' ELSE 'Cancel subscription' END,
            "cancel_description" = CASE
                WHEN "_locale" = 'de' THEN 'Du behältst den Zugriff bis zum Ende der bereits bezahlten Periode.'
                ELSE 'You''ll keep access until the end of the period you already paid for.'
            END,
            "cancel_confirm_label" = CASE WHEN "_locale" = 'de' THEN 'Abonnement kündigen' ELSE 'Cancel subscription' END,
            "cancel_pending_heading" = CASE WHEN "_locale" = 'de' THEN 'Dein Abonnement wird gekündigt' ELSE 'Your subscription is set to cancel' END,
            "cancel_pending_description" = CASE WHEN "_locale" = 'de' THEN 'Du behältst den Zugriff bis zum unten stehenden Datum.' ELSE 'You''ll keep access until the date below.' END,
            "cancel_cancel_at_label" = CASE WHEN "_locale" = 'de' THEN 'Zugriff endet' ELSE 'Access ends' END,
            "cancel_resume_label" = CASE WHEN "_locale" = 'de' THEN 'Abonnement behalten' ELSE 'Keep my subscription' END,
            "cancel_cancel_error" = CASE WHEN "_locale" = 'de' THEN 'Das Abonnement konnte nicht gekündigt werden.' ELSE 'The subscription could not be cancelled.' END,
            "cancel_resume_error" = CASE WHEN "_locale" = 'de' THEN 'Die Kündigung konnte nicht zurückgenommen werden.' ELSE 'The cancellation could not be reversed.' END,
            "upgrade_title" = CASE WHEN "_locale" = 'de' THEN 'Plan upgraden' ELSE 'Upgrade plan' END,
            "upgrade_description" = CASE
                WHEN "_locale" = 'de' THEN 'Wechsle auf einen höheren Plan oder erhöhe deine individuelle Nutzung.'
                ELSE 'Move to a higher plan or increase your custom usage.'
            END,
            "upgrade_plan_label" = CASE WHEN "_locale" = 'de' THEN 'Neuer Plan' ELSE 'New plan' END,
            "upgrade_increase_only_note" = CASE WHEN "_locale" = 'de' THEN 'Diese Mengen können hier nur erhöht werden.' ELSE 'You can only increase these amounts here.' END,
            "upgrade_update_error" = CASE WHEN "_locale" = 'de' THEN 'Der Plan konnte nicht aktualisiert werden.' ELSE 'The plan could not be upgraded.' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_total_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_proration_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_immediate_note" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_scheduled_note" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_loading_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_title" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_period_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_current_period_end_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_pending_change_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_update_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_title" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_confirm_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_pending_heading" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_pending_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_cancel_at_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_resume_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_cancel_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_resume_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_title" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_plan_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_increase_only_note" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_update_error" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_total_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_proration_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_immediate_note";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_scheduled_note";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_loading_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_title";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_period_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_current_period_end_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_pending_change_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_update_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_title";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_confirm_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_heading";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_cancel_at_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_resume_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_cancel_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_resume_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_title";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_plan_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_increase_only_note";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_update_error";
    `)
}
