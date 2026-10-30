import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "success_guest_account_hint" varchar;
   UPDATE "checkout_locales" SET "success_guest_account_hint" = CASE
     WHEN "_locale" = 'de' THEN 'Du erhältst eine E-Mail mit einem Link zur Kontoerstellung. Richte darüber dein Konto ein, um anschließend fortzufahren.'
     ELSE 'You will receive an email with a link to create your account. Complete your account setup using that link to continue.'
   END;
   ALTER TABLE "checkout_locales" ALTER COLUMN "success_guest_account_hint" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "success_guest_account_hint";`)
}
