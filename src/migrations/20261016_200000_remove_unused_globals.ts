import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Drops the upgrade banner global, which is no longer rendered, and global fields no component reads.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE "upgrade_banner_locales";
        DROP TABLE "upgrade_banner";

        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "payment_period_quarterly_paid_label",
            DROP COLUMN "payment_period_yearly_paid_label";

        ALTER TABLE "licenses_locales"
            DROP COLUMN "sidebar_user_settings_label",
            DROP COLUMN "dashboard_edit_label",
            DROP COLUMN "invoices_line_items_label",
            DROP COLUMN "invoices_quantity_label",
            DROP COLUMN "invoices_net_label";

        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "editor_payment_method_heading",
            DROP COLUMN "editor_other_payment_methods_heading",
            DROP COLUMN "editor_use_payment_method_label",
            DROP COLUMN "editor_namespace_heading",
            DROP COLUMN "cancel_immediate_confirm_heading",
            DROP COLUMN "cancel_cancel_at_label";

        ALTER TABLE "errors_locales"
            DROP COLUMN "tax_id_update",
            DROP COLUMN "tax_id_incomplete";
    `)
}

// Restores the dropped structure with the former default texts; edited CMS copy is not recoverable.
export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TABLE "upgrade_banner" (
            "id" serial PRIMARY KEY NOT NULL,
            "pro_gradient_from" varchar DEFAULT '#7af69a' NOT NULL,
            "pro_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
            "max_gradient_from" varchar DEFAULT '#72c9f8' NOT NULL,
            "max_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
            "custom_gradient_from" varchar DEFAULT '#f872e2' NOT NULL,
            "custom_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
            "updated_at" timestamp(3) with time zone,
            "created_at" timestamp(3) with time zone
        );

        CREATE TABLE "upgrade_banner_locales" (
            "pro_text" varchar NOT NULL,
            "pro_button_label" varchar NOT NULL,
            "max_text" varchar NOT NULL,
            "max_button_label" varchar NOT NULL,
            "custom_text" varchar NOT NULL,
            "custom_button_label" varchar NOT NULL,
            "id" serial PRIMARY KEY NOT NULL,
            "_locale" "_locales" NOT NULL,
            "_parent_id" integer NOT NULL
        );

        ALTER TABLE "upgrade_banner_locales" ADD CONSTRAINT "upgrade_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."upgrade_banner"("id") ON DELETE cascade ON UPDATE no action;
        CREATE UNIQUE INDEX "upgrade_banner_locales_locale_parent_id_unique" ON "upgrade_banner_locales" USING btree ("_locale","_parent_id");

        INSERT INTO "upgrade_banner" ("id", "updated_at", "created_at") VALUES (1, now(), now());
        SELECT setval(pg_get_serial_sequence('upgrade_banner', 'id'), 1);

        INSERT INTO "upgrade_banner_locales" ("pro_text", "pro_button_label", "max_text", "max_button_label", "custom_text", "custom_button_label", "_locale", "_parent_id") VALUES
        (
            'Need more? {plan} gives you more headroom.',
            'Upgrade to {plan}',
            'Need tailored capacity? {plan} lets you configure usage for your workload.',
            'Upgrade to {plan}',
            'Scale {plan} by increasing the included workflow executions and AI tokens.',
            'Increase usage',
            'en',
            1
        ),
        (
            'Du brauchst mehr? {plan} bietet dir mehr Spielraum.',
            'Auf {plan} upgraden',
            'Du brauchst individuelle Kapazitäten? Mit {plan} passt du die Nutzung an deinen Bedarf an.',
            'Auf {plan} upgraden',
            'Skaliere {plan}, indem du die enthaltenen Workflow-Ausführungen und KI-Tokens erhöhst.',
            'Nutzung erhöhen',
            'de',
            1
        );

        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "payment_period_quarterly_paid_label" varchar,
            ADD COLUMN "payment_period_yearly_paid_label" varchar;
        UPDATE "subscription_config_locales" SET
            "payment_period_quarterly_paid_label" = CASE WHEN "_locale" = 'de' THEN 'vierteljährlich bezahlt' ELSE 'paid quarterly' END,
            "payment_period_yearly_paid_label" = CASE WHEN "_locale" = 'de' THEN 'jährlich bezahlt' ELSE 'paid yearly' END;
        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "payment_period_quarterly_paid_label" SET NOT NULL,
            ALTER COLUMN "payment_period_yearly_paid_label" SET NOT NULL;

        ALTER TABLE "licenses_locales"
            ADD COLUMN "sidebar_user_settings_label" varchar,
            ADD COLUMN "dashboard_edit_label" varchar,
            ADD COLUMN "invoices_line_items_label" varchar,
            ADD COLUMN "invoices_quantity_label" varchar,
            ADD COLUMN "invoices_net_label" varchar;
        UPDATE "licenses_locales" SET
            "sidebar_user_settings_label" = CASE WHEN "_locale" = 'de' THEN 'Benutzereinstellungen' ELSE 'User settings' END,
            "dashboard_edit_label" = CASE WHEN "_locale" = 'de' THEN 'Bearbeiten' ELSE 'Edit' END,
            "invoices_line_items_label" = CASE WHEN "_locale" = 'de' THEN 'Rechnungspositionen' ELSE 'Line items' END,
            "invoices_quantity_label" = CASE WHEN "_locale" = 'de' THEN 'Menge' ELSE 'Quantity' END,
            "invoices_net_label" = CASE WHEN "_locale" = 'de' THEN 'Netto' ELSE 'Net' END;
        ALTER TABLE "licenses_locales"
            ALTER COLUMN "sidebar_user_settings_label" SET NOT NULL,
            ALTER COLUMN "dashboard_edit_label" SET NOT NULL,
            ALTER COLUMN "invoices_line_items_label" SET NOT NULL,
            ALTER COLUMN "invoices_quantity_label" SET NOT NULL,
            ALTER COLUMN "invoices_net_label" SET NOT NULL;

        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "editor_payment_method_heading" varchar,
            ADD COLUMN "editor_other_payment_methods_heading" varchar,
            ADD COLUMN "editor_use_payment_method_label" varchar,
            ADD COLUMN "editor_namespace_heading" varchar,
            ADD COLUMN "cancel_immediate_confirm_heading" varchar,
            ADD COLUMN "cancel_cancel_at_label" varchar;
        UPDATE "license_dialogs_locales" SET
            "editor_payment_method_heading" = CASE WHEN "_locale" = 'de' THEN 'Standard-Zahlungsmethode' ELSE 'Default payment method' END,
            "editor_other_payment_methods_heading" = CASE WHEN "_locale" = 'de' THEN 'Weitere Zahlungsmethoden' ELSE 'Other payment methods' END,
            "editor_use_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Diese verwenden' ELSE 'Use this' END,
            "editor_namespace_heading" = 'Namespace',
            "cancel_immediate_confirm_heading" = CASE WHEN "_locale" = 'de' THEN 'Abonnement sofort kündigen?' ELSE 'Cancel your subscription immediately?' END,
            "cancel_cancel_at_label" = CASE WHEN "_locale" = 'de' THEN 'Abonnement endet' ELSE 'Subscription ends' END;
        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "editor_payment_method_heading" SET NOT NULL,
            ALTER COLUMN "editor_other_payment_methods_heading" SET NOT NULL,
            ALTER COLUMN "editor_use_payment_method_label" SET NOT NULL,
            ALTER COLUMN "editor_namespace_heading" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_confirm_heading" SET NOT NULL,
            ALTER COLUMN "cancel_cancel_at_label" SET NOT NULL;

        ALTER TABLE "errors_locales"
            ADD COLUMN "tax_id_update" varchar,
            ADD COLUMN "tax_id_incomplete" varchar;
        UPDATE "errors_locales" SET
            "tax_id_update" = CASE WHEN "_locale" = 'de' THEN 'Die Steuernummer konnte nicht gespeichert werden. Bitte überprüfe deine Angaben.' ELSE 'The tax ID could not be saved. Please check your details.' END,
            "tax_id_incomplete" = CASE WHEN "_locale" = 'de' THEN 'Steuernummer-Typ und Steuernummer müssen zusammen angegeben werden.' ELSE 'Tax ID type and Tax ID must be provided together.' END;
        ALTER TABLE "errors_locales"
            ALTER COLUMN "tax_id_update" SET NOT NULL,
            ALTER COLUMN "tax_id_incomplete" SET NOT NULL;
    `)
}
