import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Pricing cards and the checkout now read the plan titles and descriptions of the plans tab, so the separate
// pricing package copy is dropped.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "packages_pro_title",
            DROP COLUMN "packages_pro_description",
            DROP COLUMN "packages_max_title",
            DROP COLUMN "packages_max_description",
            DROP COLUMN "packages_custom_title",
            DROP COLUMN "packages_custom_description";
    `)
}

// Restores the columns with the former default texts; edited CMS copy is not recoverable.
export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "packages_pro_title" varchar,
            ADD COLUMN "packages_pro_description" varchar,
            ADD COLUMN "packages_max_title" varchar,
            ADD COLUMN "packages_max_description" varchar,
            ADD COLUMN "packages_custom_title" varchar,
            ADD COLUMN "packages_custom_description" varchar;

        UPDATE "subscription_config_locales" SET
            "packages_pro_title" = 'Pro',
            "packages_pro_description" = CASE WHEN "_locale" = 'de' THEN 'Für Einzelpersonen und kleinere Teams.' ELSE 'For individuals and smaller teams.' END,
            "packages_max_title" = 'Max',
            "packages_max_description" = CASE WHEN "_locale" = 'de' THEN 'Für Organisationen mit höheren Anforderungen.' ELSE 'For organizations with higher requirements.' END,
            "packages_custom_title" = 'Custom',
            "packages_custom_description" = CASE WHEN "_locale" = 'de' THEN 'Ein maßgeschneidertes Paket für individuelle Anforderungen.' ELSE 'A tailored package for individual requirements.' END;

        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "packages_pro_title" SET NOT NULL,
            ALTER COLUMN "packages_pro_description" SET NOT NULL,
            ALTER COLUMN "packages_max_title" SET NOT NULL,
            ALTER COLUMN "packages_max_description" SET NOT NULL,
            ALTER COLUMN "packages_custom_title" SET NOT NULL,
            ALTER COLUMN "packages_custom_description" SET NOT NULL;
    `)
}
