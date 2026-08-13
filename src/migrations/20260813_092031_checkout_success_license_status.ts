import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN "success_license_pending_label" varchar DEFAULT 'Your license is being prepared…' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_license_ready_label" varchar DEFAULT 'Your license is ready.' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_license_status_error" varchar DEFAULT 'We could not check whether your license is ready.' NOT NULL;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_license_status_retry_label" varchar DEFAULT 'Try again' NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "success_license_pending_label";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_license_ready_label";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_license_status_error";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_license_status_retry_label";
    `)
}
