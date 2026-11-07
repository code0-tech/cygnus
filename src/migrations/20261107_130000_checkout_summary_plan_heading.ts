import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ALTER COLUMN "summary_heading" DROP DEFAULT;

        UPDATE "checkout_locales" SET
            "summary_heading" = CASE WHEN "_locale" = 'de' THEN 'Dein Plan: {plan}' ELSE 'Your Plan: {plan}' END;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "checkout_locales" SET "summary_heading" = 'Review your configuration';

        ALTER TABLE "checkout_locales" ALTER COLUMN "summary_heading" SET DEFAULT 'Review your configuration';
    `)
}
