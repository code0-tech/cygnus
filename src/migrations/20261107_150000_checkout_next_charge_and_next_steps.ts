import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN IF NOT EXISTS "summary_next_charge_text" varchar;

        UPDATE "checkout_locales" SET
            "summary_next_charge_text" = COALESCE(
                NULLIF("summary_next_charge_text", ''),
                CASE WHEN "_locale" = 'de' THEN 'Nächste Abbuchung am {date} · Vorher jederzeit kündbar' ELSE 'Next charge on {date} · Cancel anytime before' END
            );

        ALTER TABLE "checkout_locales" ALTER COLUMN "summary_next_charge_text" SET NOT NULL;

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "next_steps_heading" DROP DEFAULT,
            ALTER COLUMN "next_steps_step1_title" DROP DEFAULT,
            ALTER COLUMN "next_steps_step1_description" DROP DEFAULT,
            ALTER COLUMN "next_steps_step2_title" DROP DEFAULT,
            ALTER COLUMN "next_steps_step2_description" DROP DEFAULT,
            ALTER COLUMN "next_steps_step3_title" DROP DEFAULT,
            ALTER COLUMN "next_steps_step3_description" DROP DEFAULT;

        -- The steps are now rendered inline as "<title> <description>", so the previous full sentences no longer fit.
        UPDATE "checkout_locales" SET
            "next_steps_heading" = CASE WHEN "_locale" = 'de' THEN 'Wie es weitergeht' ELSE 'What happens next' END,
            "next_steps_step1_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlung bestätigt' ELSE 'Payment confirmed' END,
            "next_steps_step1_description" = CASE WHEN "_locale" = 'de' THEN 'sicher über Stripe' ELSE 'securely by Stripe' END,
            "next_steps_step2_title" = CASE WHEN "_locale" = 'de' THEN 'Lizenz erstellt' ELSE 'License created' END,
            "next_steps_step2_description" = CASE WHEN "_locale" = 'de' THEN 'automatisch, Rechnung per E-Mail' ELSE 'automatically, invoice sent by email' END,
            "next_steps_step3_title" = CASE WHEN "_locale" = 'de' THEN 'Loslegen' ELSE 'Start building' END,
            "next_steps_step3_description" = CASE WHEN "_locale" = 'de' THEN 'über dein Lizenz-Dashboard' ELSE 'from your license dashboard' END;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "summary_next_charge_text";

        UPDATE "checkout_locales" SET
            "next_steps_heading" = 'What happens next',
            "next_steps_step1_title" = 'Payment confirmed',
            "next_steps_step1_description" = 'Stripe securely confirms your payment.',
            "next_steps_step2_title" = 'License provisioned',
            "next_steps_step2_description" = 'Your license is created automatically.',
            "next_steps_step3_title" = 'Get started',
            "next_steps_step3_description" = 'Access your license dashboard and start building.';

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "next_steps_heading" SET DEFAULT 'What happens next',
            ALTER COLUMN "next_steps_step1_title" SET DEFAULT 'Payment confirmed',
            ALTER COLUMN "next_steps_step1_description" SET DEFAULT 'Stripe securely confirms your payment.',
            ALTER COLUMN "next_steps_step2_title" SET DEFAULT 'License provisioned',
            ALTER COLUMN "next_steps_step2_description" SET DEFAULT 'Your license is created automatically.',
            ALTER COLUMN "next_steps_step3_title" SET DEFAULT 'Get started',
            ALTER COLUMN "next_steps_step3_description" SET DEFAULT 'Access your license dashboard and start building.';
    `)
}
