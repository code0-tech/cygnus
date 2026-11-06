import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Adds the license-toasts global for the dashboard notifications. Payload only applies defaultValue when a document
// is created, so the localized default texts are inserted explicitly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        CREATE TABLE "license_toasts" (
            "id" serial PRIMARY KEY NOT NULL,
            "updated_at" timestamp(3) with time zone,
            "created_at" timestamp(3) with time zone
        );

        CREATE TABLE "license_toasts_locales" (
            "error_title" varchar NOT NULL,
            "customer_saved_title" varchar NOT NULL,
            "customer_saved_description" varchar NOT NULL,
            "plan_updated_title" varchar NOT NULL,
            "plan_updated_description" varchar NOT NULL,
            "change_scheduled_title" varchar NOT NULL,
            "change_scheduled_description" varchar NOT NULL,
            "period_updated_title" varchar NOT NULL,
            "period_updated_description" varchar NOT NULL,
            "canceled_title" varchar NOT NULL,
            "canceled_description" varchar NOT NULL,
            "cancellation_scheduled_title" varchar NOT NULL,
            "cancellation_scheduled_description" varchar NOT NULL,
            "resumed_title" varchar NOT NULL,
            "resumed_description" varchar NOT NULL,
            "payment_assigned_title" varchar NOT NULL,
            "payment_assigned_description" varchar NOT NULL,
            "payment_removed_title" varchar NOT NULL,
            "payment_removed_description" varchar NOT NULL,
            "payment_confirmed_title" varchar NOT NULL,
            "payment_confirmed_description" varchar NOT NULL,
            "namespace_linked_title" varchar NOT NULL,
            "namespace_linked_description" varchar NOT NULL,
            "id" serial PRIMARY KEY NOT NULL,
            "_locale" "_locales" NOT NULL,
            "_parent_id" integer NOT NULL
        );

        ALTER TABLE "license_toasts_locales" ADD CONSTRAINT "license_toasts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."license_toasts"("id") ON DELETE cascade ON UPDATE no action;
        CREATE UNIQUE INDEX "license_toasts_locales_locale_parent_id_unique" ON "license_toasts_locales" USING btree ("_locale","_parent_id");

        INSERT INTO "license_toasts" ("id", "updated_at", "created_at") VALUES (1, now(), now());
        SELECT setval(pg_get_serial_sequence('license_toasts', 'id'), 1);

        INSERT INTO "license_toasts_locales" (
            "error_title",
            "customer_saved_title",
            "customer_saved_description",
            "plan_updated_title",
            "plan_updated_description",
            "change_scheduled_title",
            "change_scheduled_description",
            "period_updated_title",
            "period_updated_description",
            "canceled_title",
            "canceled_description",
            "cancellation_scheduled_title",
            "cancellation_scheduled_description",
            "resumed_title",
            "resumed_description",
            "payment_assigned_title",
            "payment_assigned_description",
            "payment_removed_title",
            "payment_removed_description",
            "payment_confirmed_title",
            "payment_confirmed_description",
            "namespace_linked_title",
            "namespace_linked_description",
            "_locale",
            "_parent_id"
        ) VALUES
        (
            'Something went wrong',
            'Customer details saved',
            'Your contact and billing details were updated and will be used for all future invoices.',
            'Plan updated',
            'Your new plan is active right away. Any price difference is prorated on your next invoice.',
            'Subscription change scheduled',
            'Your current plan stays active until {date}. The change applies automatically from then on.',
            'Billing period updated',
            'Your subscription is now billed in the new interval. Future invoices reflect this change.',
            'Subscription canceled',
            'Your subscription was canceled immediately and will not be renewed. You can start a new subscription at any time.',
            'Cancellation scheduled',
            'Your license stays fully usable until {date}. You can withdraw the cancellation until then.',
            'Cancellation withdrawn',
            'Your subscription continues as before and renews automatically at the end of the billing period.',
            'Payment method updated',
            'Future invoices for this license are charged to the selected payment method.',
            'Payment method removed',
            'The payment method was removed from your account and will no longer be charged.',
            'Payment method added',
            'Stripe confirmed your payment method. You can now assign it to your licenses.',
            'Namespace linked',
            'Your license is now linked to the selected namespace and its features are available there.',
            'en',
            1
        ),
        (
            'Etwas ist schiefgelaufen',
            'Kundendaten gespeichert',
            'Deine Kontakt- und Rechnungsdaten wurden aktualisiert und werden für alle zukünftigen Rechnungen verwendet.',
            'Plan aktualisiert',
            'Dein neuer Plan ist ab sofort aktiv. Eine Preisdifferenz wird anteilig mit deiner nächsten Rechnung verrechnet.',
            'Abo-Änderung vorgemerkt',
            'Dein aktueller Plan bleibt bis zum {date} aktiv. Danach gilt die Änderung automatisch.',
            'Abrechnungsintervall aktualisiert',
            'Dein Abo wird jetzt im neuen Intervall abgerechnet. Zukünftige Rechnungen berücksichtigen diese Änderung.',
            'Abo gekündigt',
            'Dein Abo wurde sofort gekündigt und wird nicht verlängert. Du kannst jederzeit ein neues Abo abschließen.',
            'Kündigung vorgemerkt',
            'Deine Lizenz bleibt bis zum {date} voll nutzbar. Bis dahin kannst du die Kündigung zurücknehmen.',
            'Kündigung zurückgenommen',
            'Dein Abo läuft wie gewohnt weiter und verlängert sich automatisch zum Ende des Abrechnungszeitraums.',
            'Zahlungsmethode aktualisiert',
            'Zukünftige Rechnungen dieser Lizenz werden über die ausgewählte Zahlungsmethode abgerechnet.',
            'Zahlungsmethode entfernt',
            'Die Zahlungsmethode wurde aus deinem Konto entfernt und wird nicht mehr belastet.',
            'Zahlungsmethode hinzugefügt',
            'Stripe hat deine Zahlungsmethode bestätigt. Du kannst sie jetzt deinen Lizenzen zuweisen.',
            'Namespace verknüpft',
            'Deine Lizenz ist jetzt mit dem ausgewählten Namespace verknüpft und ihre Funktionen stehen dort zur Verfügung.',
            'de',
            1
        );
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE "license_toasts_locales" CASCADE;
        DROP TABLE "license_toasts" CASCADE;
    `)
}
