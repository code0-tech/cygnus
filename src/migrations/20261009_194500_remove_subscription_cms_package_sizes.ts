import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_numbers" DISABLE ROW LEVEL SECURITY;
        DROP TABLE "subscription_config_numbers" CASCADE;

        ALTER TABLE "subscription_config"
            DROP COLUMN "workflow_executions_b2b_default",
            DROP COLUMN "workflow_executions_b2c_default",
            DROP COLUMN "ai_tokens_b2b_default",
            DROP COLUMN "ai_tokens_b2c_default";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TABLE "subscription_config_numbers" (
            "id" serial PRIMARY KEY NOT NULL,
            "number" numeric,
            "order" integer NOT NULL,
            "parent_id" integer NOT NULL,
            "path" varchar NOT NULL
        );

        ALTER TABLE "subscription_config_numbers"
            ADD CONSTRAINT "subscription_config_numbers_parent_fk"
            FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
        CREATE INDEX "subscription_config_numbers_order_parent_idx"
            ON "subscription_config_numbers" USING btree ("order", "parent_id");

        ALTER TABLE "subscription_config"
            ADD COLUMN "workflow_executions_b2b_default" numeric DEFAULT 1000000,
            ADD COLUMN "workflow_executions_b2c_default" numeric DEFAULT 100000,
            ADD COLUMN "ai_tokens_b2b_default" numeric DEFAULT 100000000,
            ADD COLUMN "ai_tokens_b2c_default" numeric DEFAULT 10000000;

        INSERT INTO "subscription_config_numbers" ("parent_id", "path", "number", "order")
        SELECT "subscription_config"."id", "packages"."path", "packages"."number", "packages"."order"
        FROM "subscription_config"
        CROSS JOIN (VALUES
            ('workflowExecutions.b2b.packages', 100000, 1),
            ('workflowExecutions.b2b.packages', 1000000, 2),
            ('workflowExecutions.b2b.packages', 5000000, 3),
            ('workflowExecutions.b2b.packages', 10000000, 4),
            ('workflowExecutions.b2c.packages', 10000, 1),
            ('workflowExecutions.b2c.packages', 100000, 2),
            ('workflowExecutions.b2c.packages', 500000, 3),
            ('workflowExecutions.b2c.packages', 1000000, 4),
            ('aiTokens.b2b.packages', 10000000, 1),
            ('aiTokens.b2b.packages', 100000000, 2),
            ('aiTokens.b2b.packages', 500000000, 3),
            ('aiTokens.b2b.packages', 1000000000, 4),
            ('aiTokens.b2c.packages', 1000000, 1),
            ('aiTokens.b2c.packages', 10000000, 2),
            ('aiTokens.b2c.packages', 50000000, 3),
            ('aiTokens.b2c.packages', 100000000, 4)
        ) AS "packages"("path", "number", "order");
    `)
}
