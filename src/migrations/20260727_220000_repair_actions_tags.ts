import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DO $$
        BEGIN
            CREATE TYPE "public"."enum_actions_tags" AS ENUM(
                'AI',
                'Analytics',
                'Communication',
                'Cybersecurity',
                'Data & Storage',
                'Developer Tools',
                'Development',
                'Finance & Accounting',
                'HITL',
                'Marketing',
                'Miscellaneous',
                'Productivity',
                'Sales',
                'Utility'
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END
        $$;

        CREATE TABLE IF NOT EXISTS "actions_tags" (
            "order" integer NOT NULL,
            "parent_id" integer NOT NULL,
            "value" "enum_actions_tags",
            "id" serial PRIMARY KEY NOT NULL
        );

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM "pg_constraint"
                WHERE "conname" = 'actions_tags_parent_fk'
                    AND "conrelid" = '"public"."actions_tags"'::regclass
            ) THEN
                ALTER TABLE "actions_tags"
                    ADD CONSTRAINT "actions_tags_parent_fk"
                    FOREIGN KEY ("parent_id")
                    REFERENCES "public"."actions"("id")
                    ON DELETE cascade;
            END IF;
        END
        $$;

        CREATE INDEX IF NOT EXISTS "actions_tags_order_idx" ON "actions_tags" ("order");
        CREATE INDEX IF NOT EXISTS "actions_tags_parent_idx" ON "actions_tags" ("parent_id");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE IF EXISTS "actions_tags";
        DROP TYPE IF EXISTS "public"."enum_actions_tags";
    `)
}
