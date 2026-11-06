import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres"

// Same column as 20261030_130000_users_reset_password_requested_at (feat/crater-implementation); both landed independently,
// so this one must be idempotent to not fail with "column already exists".
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";`)
}
