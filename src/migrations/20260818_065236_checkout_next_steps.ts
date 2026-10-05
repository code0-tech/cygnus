import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_heading" varchar DEFAULT 'What happens next' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step1_title" varchar DEFAULT 'Payment confirmed' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step1_description" varchar DEFAULT 'Stripe securely confirms your payment.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step2_title" varchar DEFAULT 'License provisioned' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step2_description" varchar DEFAULT 'Your license is created automatically.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step3_title" varchar DEFAULT 'Get started' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "next_steps_step3_description" varchar DEFAULT 'Access your license dashboard and start building.' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step1_title";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step1_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step2_title";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step2_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step3_title";
  ALTER TABLE "checkout_locales" DROP COLUMN "next_steps_step3_description";`)
}
