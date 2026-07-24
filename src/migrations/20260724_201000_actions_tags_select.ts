import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up(_args: MigrateUpArgs): Promise<void> {
    // Text and select fields with hasMany use the same database representation.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
    // Reverting to a free-text field does not require a database schema change.
}
