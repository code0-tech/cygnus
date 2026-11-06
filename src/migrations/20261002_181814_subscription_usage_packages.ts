import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   CREATE TABLE "subscription_config_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  ALTER TABLE "subscription_config" ALTER COLUMN "workflow_executions_b2b_default" SET DEFAULT 1000000;
  ALTER TABLE "subscription_config" ALTER COLUMN "workflow_executions_b2c_default" SET DEFAULT 100000;
  ALTER TABLE "subscription_config" ALTER COLUMN "ai_tokens_b2b_default" SET DEFAULT 100000000;
  ALTER TABLE "subscription_config" ALTER COLUMN "ai_tokens_b2c_default" SET DEFAULT 10000000;
  ALTER TABLE "subscription_config_numbers" ADD CONSTRAINT "subscription_config_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subscription_config_numbers_order_parent_idx" ON "subscription_config_numbers" USING btree ("order","parent_id");
  -- Existing configs get Crater's default packages; previous range defaults are no valid package and are replaced.
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
  UPDATE "subscription_config" SET "workflow_executions_b2b_default" = 1000000 WHERE "workflow_executions_b2b_default" IS NULL OR "workflow_executions_b2b_default" NOT IN (100000, 1000000, 5000000, 10000000);
  UPDATE "subscription_config" SET "workflow_executions_b2c_default" = 100000 WHERE "workflow_executions_b2c_default" IS NULL OR "workflow_executions_b2c_default" NOT IN (10000, 100000, 500000, 1000000);
  UPDATE "subscription_config" SET "ai_tokens_b2b_default" = 100000000 WHERE "ai_tokens_b2b_default" IS NULL OR "ai_tokens_b2b_default" NOT IN (10000000, 100000000, 500000000, 1000000000);
  UPDATE "subscription_config" SET "ai_tokens_b2c_default" = 10000000 WHERE "ai_tokens_b2c_default" IS NULL OR "ai_tokens_b2c_default" NOT IN (1000000, 10000000, 50000000, 100000000);
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2b_step";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2b_min";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2b_max";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_step";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_min";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_max";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2b_step";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2b_min";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2b_max";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_step";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_min";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_max";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "subscription_config_numbers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "subscription_config_numbers" CASCADE;
  ALTER TABLE "subscription_config" ALTER COLUMN "workflow_executions_b2b_default" SET DEFAULT 1000;
  ALTER TABLE "subscription_config" ALTER COLUMN "workflow_executions_b2c_default" SET DEFAULT 100;
  ALTER TABLE "subscription_config" ALTER COLUMN "ai_tokens_b2b_default" SET DEFAULT 1000000;
  ALTER TABLE "subscription_config" ALTER COLUMN "ai_tokens_b2c_default" SET DEFAULT 100000;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2b_step" numeric DEFAULT 100;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2b_min" numeric DEFAULT 200;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2b_max" numeric DEFAULT 10000;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_step" numeric DEFAULT 10;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_min" numeric DEFAULT 10;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_max" numeric DEFAULT 1000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2b_step" numeric DEFAULT 100000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2b_min" numeric DEFAULT 100000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2b_max" numeric DEFAULT 10000000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_step" numeric DEFAULT 10000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_min" numeric DEFAULT 10000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_max" numeric DEFAULT 1000000;`)
}
