import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "login_heading" SET DEFAULT 'Sign in to CodeZero';
  ALTER TABLE "checkout_locales" ALTER COLUMN "login_description" SET DEFAULT 'Use your CodeZero account to continue with your configured subscription.';
  ALTER TABLE "checkout_locales" ADD COLUMN "login_guest_heading" varchar DEFAULT 'Continue as a guest' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_guest_description" varchar DEFAULT 'Complete your subscription checkout without signing in.' NOT NULL;
  UPDATE "checkout_locales"
  SET
    "login_heading" = 'Sign in to CodeZero',
    "login_description" = 'Use your CodeZero account to continue with your configured subscription.'
  WHERE "_locale" = 'en'
    AND "login_heading" = 'How would you like to continue?'
    AND "login_description" = 'Sign in to use your CodeZero account or continue to checkout as a guest.';
  UPDATE "checkout_locales"
  SET
    "login_heading" = 'Bei CodeZero anmelden',
    "login_description" = 'Melde dich mit deinem CodeZero-Konto an, um mit deinem konfigurierten Abonnement fortzufahren.',
    "login_guest_heading" = 'Als Gast fortfahren',
    "login_guest_description" = 'Schließe dein Abonnement ab, ohne dich anzumelden.'
  WHERE "_locale" = 'de';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "login_heading" SET DEFAULT 'How would you like to continue?';
  ALTER TABLE "checkout_locales" ALTER COLUMN "login_description" SET DEFAULT 'Sign in to use your CodeZero account or continue to checkout as a guest.';
  UPDATE "checkout_locales"
  SET
    "login_heading" = 'How would you like to continue?',
    "login_description" = 'Sign in to use your CodeZero account or continue to checkout as a guest.'
  WHERE "_locale" = 'en'
    AND "login_heading" = 'Sign in to CodeZero'
    AND "login_description" = 'Use your CodeZero account to continue with your configured subscription.';
  UPDATE "checkout_locales"
  SET
    "login_heading" = 'Wie möchtest du fortfahren?',
    "login_description" = 'Melde dich mit deinem CodeZero-Konto an oder fahre als Gast mit dem Checkout fort.'
  WHERE "_locale" = 'de'
    AND "login_heading" = 'Bei CodeZero anmelden'
    AND "login_description" = 'Melde dich mit deinem CodeZero-Konto an, um mit deinem konfigurierten Abonnement fortzufahren.';
  ALTER TABLE "checkout_locales" DROP COLUMN "login_guest_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_guest_description";`)
}
