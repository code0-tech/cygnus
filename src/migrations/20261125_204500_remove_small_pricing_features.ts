import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_custom_missing";
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_custom_features";
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_max_missing";
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_max_features";
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_pro_missing";
        DROP TABLE IF EXISTS "pages_blocks_small_pricing_pro_features";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    // Removed field data cannot be reconstructed after dropping these tables.
    void db
}
