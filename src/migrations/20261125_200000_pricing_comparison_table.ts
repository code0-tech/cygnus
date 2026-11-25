import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            ADD COLUMN IF NOT EXISTS "comparison_intro" varchar DEFAULT 'Quotas reset monthly from your order date.';

        CREATE TABLE IF NOT EXISTS "pages_blocks_pricing_comparison_categories" (
            "_order" integer NOT NULL,
            "_parent_id" varchar NOT NULL,
            "_locale" "public"."enum__locales" NOT NULL,
            "id" varchar PRIMARY KEY NOT NULL,
            "title" varchar NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_order_idx" ON "pages_blocks_pricing_comparison_categories" ("_order");
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_parent_id_idx" ON "pages_blocks_pricing_comparison_categories" ("_parent_id");
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_locale_idx" ON "pages_blocks_pricing_comparison_categories" ("_locale");
        DO $$ BEGIN
            ALTER TABLE "pages_blocks_pricing_comparison_categories" ADD CONSTRAINT "pages_blocks_pricing_comparison_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages_blocks_pricing"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS "pages_blocks_pricing_comparison_categories_rows" (
            "_order" integer NOT NULL,
            "_parent_id" varchar NOT NULL,
            "_locale" "public"."enum__locales" NOT NULL,
            "id" varchar PRIMARY KEY NOT NULL,
            "label" varchar NOT NULL,
            "pro" varchar,
            "max" varchar,
            "custom" varchar
        );
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_rows_order_idx" ON "pages_blocks_pricing_comparison_categories_rows" ("_order");
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_rows_parent_id_idx" ON "pages_blocks_pricing_comparison_categories_rows" ("_parent_id");
        CREATE INDEX IF NOT EXISTS "pages_blocks_pricing_comparison_categories_rows_locale_idx" ON "pages_blocks_pricing_comparison_categories_rows" ("_locale");
        DO $$ BEGIN
            ALTER TABLE "pages_blocks_pricing_comparison_categories_rows" ADD CONSTRAINT "pages_blocks_pricing_comparison_categories_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages_blocks_pricing_comparison_categories"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

    `)

    await db.execute(sql`
        INSERT INTO "pages_blocks_pricing_comparison_categories" ("_order", "_parent_id", "_locale", id, title)
        SELECT DISTINCT defaults.category_order, pricing.id, pricing._locale,
            md5(pricing.id || pricing._locale || defaults.title), defaults.title
        FROM "pages_blocks_pricing" pricing
        CROSS JOIN (VALUES
            (1, 'Usage'), (2, 'Build'), (3, 'Run & debug'), (4, 'Support')
        ) AS defaults(category_order, title)
        WHERE NOT EXISTS (
            SELECT 1 FROM "pages_blocks_pricing_comparison_categories" c WHERE c."_parent_id" = pricing.id
        )
        ON CONFLICT (id) DO NOTHING;
    `)

    await db.execute(sql`
        INSERT INTO "pages_blocks_pricing_comparison_categories_rows" ("_order", "_parent_id", "_locale", id, label, pro, max, custom)
        SELECT defaults.row_order, categories.id, categories."_locale", md5(categories.id || defaults.label),
            defaults.label, defaults.pro, defaults.max, defaults.custom
        FROM "pages_blocks_pricing_comparison_categories" categories
        JOIN (VALUES
            ('Usage', 1, 'Workflow executions per month', '2,000', '25,000', 'Configurable'),
            ('Usage', 2, 'AI tokens per month', '500k', '4M', 'Configurable'),
            ('Build', 1, 'Visual flow builder', U&'\\2713', U&'\\2713', U&'\\2713'),
            ('Build', 2, 'AI agents with MCP & multi-agent', U&'\\2713', U&'\\2713', U&'\\2713'),
            ('Build', 3, 'Files in flows', U&'\\2713', U&'\\2713', U&'\\2713'),
            ('Run & debug', 1, 'Deterministic replay', U&'\\2713', U&'\\2713', U&'\\2713'),
            ('Run & debug', 2, 'Eject as binary / WASM', U&'\\2713', U&'\\2713', U&'\\2713'),
            ('Support', 1, '[SUPPORT LEVEL]', U&'\\2014', U&'\\2014', U&'\\2014')
        ) AS defaults(title, row_order, label, pro, max, custom) ON defaults.title = categories.title
        WHERE NOT EXISTS (
            SELECT 1 FROM "pages_blocks_pricing_comparison_categories_rows" r WHERE r."_parent_id" = categories.id
        )
        ON CONFLICT (id) DO NOTHING;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE IF EXISTS "pages_blocks_pricing_comparison_categories_rows";
        DROP TABLE IF EXISTS "pages_blocks_pricing_comparison_categories";
        ALTER TABLE "pages_blocks_pricing" DROP COLUMN IF EXISTS "comparison_intro";
    `)
}
