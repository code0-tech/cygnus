import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Payload 3.90 added resetPasswordRequestedAt to auth collections; the upgrade only refreshed the schema snapshot, so databases
// that are migrated rather than pushed never received the column. IF NOT EXISTS keeps dev databases that were pushed working.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
    `)
}
