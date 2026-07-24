import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      UPDATE "actions_texts"
      SET "text" = 'HITL'
      WHERE "path" = 'tags' AND "text" = 'HTL';

      ALTER TABLE "pages_blocks_action_list"
        ADD COLUMN IF NOT EXISTS "sort_newest_label" varchar DEFAULT 'Newest' NOT NULL,
        ADD COLUMN IF NOT EXISTS "sort_oldest_label" varchar DEFAULT 'Oldest' NOT NULL,
        ADD COLUMN IF NOT EXISTS "all_categories_label" varchar DEFAULT 'All Categories' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_ai" varchar DEFAULT 'AI' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_analytics" varchar DEFAULT 'Analytics' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_communication" varchar DEFAULT 'Communication' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_cybersecurity" varchar DEFAULT 'Cybersecurity' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_data_storage" varchar DEFAULT 'Data & Storage' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_developer_tools" varchar DEFAULT 'Developer Tools' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_development" varchar DEFAULT 'Development' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_finance_accounting" varchar DEFAULT 'Finance & Accounting' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_hitl" varchar DEFAULT 'HITL' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_marketing" varchar DEFAULT 'Marketing' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_miscellaneous" varchar DEFAULT 'Miscellaneous' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_productivity" varchar DEFAULT 'Productivity' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_sales" varchar DEFAULT 'Sales' NOT NULL,
        ADD COLUMN IF NOT EXISTS "category_labels_utility" varchar DEFAULT 'Utility' NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      UPDATE "actions_texts"
      SET "text" = 'HTL'
      WHERE "path" = 'tags' AND "text" = 'HITL';

      ALTER TABLE "pages_blocks_action_list"
        DROP COLUMN IF EXISTS "category_labels_utility",
        DROP COLUMN IF EXISTS "category_labels_sales",
        DROP COLUMN IF EXISTS "category_labels_productivity",
        DROP COLUMN IF EXISTS "category_labels_miscellaneous",
        DROP COLUMN IF EXISTS "category_labels_marketing",
        DROP COLUMN IF EXISTS "category_labels_hitl",
        DROP COLUMN IF EXISTS "category_labels_finance_accounting",
        DROP COLUMN IF EXISTS "category_labels_development",
        DROP COLUMN IF EXISTS "category_labels_developer_tools",
        DROP COLUMN IF EXISTS "category_labels_data_storage",
        DROP COLUMN IF EXISTS "category_labels_cybersecurity",
        DROP COLUMN IF EXISTS "category_labels_communication",
        DROP COLUMN IF EXISTS "category_labels_analytics",
        DROP COLUMN IF EXISTS "category_labels_ai",
        DROP COLUMN IF EXISTS "all_categories_label",
        DROP COLUMN IF EXISTS "sort_oldest_label",
        DROP COLUMN IF EXISTS "sort_newest_label";
    `)
}
