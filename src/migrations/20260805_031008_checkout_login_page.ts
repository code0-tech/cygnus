import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout" ADD COLUMN "login_login_url" varchar DEFAULT 'https://app.code0.tech/login' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_eyebrow" varchar DEFAULT 'Checkout' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_heading" varchar DEFAULT 'How would you like to continue?' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_description" varchar DEFAULT 'Sign in to use your CodeZero account or continue to checkout as a guest.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_login_label" varchar DEFAULT 'Sign in' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "login_guest_label" varchar DEFAULT 'Continue as guest' NOT NULL;
  UPDATE "checkout_locales"
  SET
    "login_heading" = 'Wie möchtest du fortfahren?',
    "login_description" = 'Melde dich mit deinem CodeZero-Konto an oder fahre als Gast mit dem Checkout fort.',
    "login_login_label" = 'Anmelden',
    "login_guest_label" = 'Als Gast fortfahren'
  WHERE "_locale" = 'de';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout" DROP COLUMN "login_login_url";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_eyebrow";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_login_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "login_guest_label";`);
}
