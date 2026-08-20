import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   CREATE TABLE "subscription_config_plan_pro_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "subscription_config_plan_max_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "subscription_config_plan_custom_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "subscription_config_plan_pro_features" ADD CONSTRAINT "subscription_config_plan_pro_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_plan_max_features" ADD CONSTRAINT "subscription_config_plan_max_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_plan_custom_features" ADD CONSTRAINT "subscription_config_plan_custom_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subscription_config_plan_pro_features_order_idx" ON "subscription_config_plan_pro_features" USING btree ("_order");
  CREATE INDEX "subscription_config_plan_pro_features_parent_id_idx" ON "subscription_config_plan_pro_features" USING btree ("_parent_id");
  CREATE INDEX "subscription_config_plan_pro_features_locale_idx" ON "subscription_config_plan_pro_features" USING btree ("_locale");
  CREATE INDEX "subscription_config_plan_max_features_order_idx" ON "subscription_config_plan_max_features" USING btree ("_order");
  CREATE INDEX "subscription_config_plan_max_features_parent_id_idx" ON "subscription_config_plan_max_features" USING btree ("_parent_id");
  CREATE INDEX "subscription_config_plan_max_features_locale_idx" ON "subscription_config_plan_max_features" USING btree ("_locale");
  CREATE INDEX "subscription_config_plan_custom_features_order_idx" ON "subscription_config_plan_custom_features" USING btree ("_order");
  CREATE INDEX "subscription_config_plan_custom_features_parent_id_idx" ON "subscription_config_plan_custom_features" USING btree ("_parent_id");
  CREATE INDEX "subscription_config_plan_custom_features_locale_idx" ON "subscription_config_plan_custom_features" USING btree ("_locale");

  INSERT INTO "subscription_config_plan_pro_features" ("_order", "_parent_id", "_locale", "id", "text")
  SELECT feature."order", config."id", locale."code", concat('plan-pro-feature-', config."id", '-', locale."code"::text, '-', feature."order"),
    CASE WHEN locale."code" = 'de' THEN feature."de" ELSE feature."en" END
  FROM "subscription_config" config
  CROSS JOIN LATERAL unnest(enum_range(NULL::"_locales")) AS locale("code")
  CROSS JOIN (VALUES
    (0, 'Essential workflow automation', 'Grundlegende Workflow-Automatisierung'),
    (1, 'AI-assisted workflows', 'KI-unterstützte Workflows'),
    (2, 'Cloud or self-hosted deployment', 'Cloud- oder Self-hosted-Bereitstellung')
  ) AS feature("order", "en", "de");

  INSERT INTO "subscription_config_plan_max_features" ("_order", "_parent_id", "_locale", "id", "text")
  SELECT feature."order", config."id", locale."code", concat('plan-max-feature-', config."id", '-', locale."code"::text, '-', feature."order"),
    CASE WHEN locale."code" = 'de' THEN feature."de" ELSE feature."en" END
  FROM "subscription_config" config
  CROSS JOIN LATERAL unnest(enum_range(NULL::"_locales")) AS locale("code")
  CROSS JOIN (VALUES
    (0, 'Everything included in Pro', 'Alle Funktionen aus Pro'),
    (1, 'Advanced automation capabilities', 'Erweiterte Automatisierungsfunktionen'),
    (2, 'Designed for higher workflow demand', 'Für einen höheren Workflow-Bedarf ausgelegt')
  ) AS feature("order", "en", "de");

  INSERT INTO "subscription_config_plan_custom_features" ("_order", "_parent_id", "_locale", "id", "text")
  SELECT feature."order", config."id", locale."code", concat('plan-custom-feature-', config."id", '-', locale."code"::text, '-', feature."order"),
    CASE WHEN locale."code" = 'de' THEN feature."de" ELSE feature."en" END
  FROM "subscription_config" config
  CROSS JOIN LATERAL unnest(enum_range(NULL::"_locales")) AS locale("code")
  CROSS JOIN (VALUES
    (0, 'Configurable AI token volume', 'Konfigurierbares KI-Token-Volumen'),
    (1, 'Configurable workflow executions', 'Konfigurierbare Workflow-Ausführungen'),
    (2, 'Tailored usage configuration', 'Individuelle Nutzungskonfiguration')
  ) AS feature("order", "en", "de");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   DROP TABLE "subscription_config_plan_pro_features" CASCADE;
  DROP TABLE "subscription_config_plan_max_features" CASCADE;
  DROP TABLE "subscription_config_plan_custom_features" CASCADE;`)
}
