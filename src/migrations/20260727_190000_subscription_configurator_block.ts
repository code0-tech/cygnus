import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TABLE "pages_blocks_subscription_configurator" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "page_intro_heading" varchar DEFAULT 'Configure your setup before you talk pricing.',
        "page_intro_description" varchar DEFAULT 'Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.',
        "block_name" varchar
      );

      CREATE TABLE "pages_blocks_subscription_configurator_feature_overview" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar,
        "description" varchar,
        "icon" varchar NOT NULL
      );

      ALTER TABLE "pages_blocks_subscription_configurator"
        ADD CONSTRAINT "pages_blocks_subscription_configurator_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade;

      ALTER TABLE "pages_blocks_subscription_configurator_feature_overview"
        ADD CONSTRAINT "pages_blocks_subscription_configurator_feature_overview_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_subscription_configurator"("id") ON DELETE cascade;

      CREATE INDEX "pages_blocks_subscription_configurator_order_idx"
        ON "pages_blocks_subscription_configurator" ("_order");
      CREATE INDEX "pages_blocks_subscription_configurator_parent_id_idx"
        ON "pages_blocks_subscription_configurator" ("_parent_id");
      CREATE INDEX "pages_blocks_subscription_configurator_path_idx"
        ON "pages_blocks_subscription_configurator" ("_path");
      CREATE INDEX "pages_blocks_subscription_configurator_locale_idx"
        ON "pages_blocks_subscription_configurator" ("_locale");
      CREATE INDEX "pages_blocks_subscription_configurator_feature_overview_order_idx"
        ON "pages_blocks_subscription_configurator_feature_overview" ("_order");
      CREATE INDEX "pages_blocks_subscription_configurator_feature_overview_parent_id_idx"
        ON "pages_blocks_subscription_configurator_feature_overview" ("_parent_id");
      CREATE INDEX "pages_blocks_subscription_configurator_feature_overview_locale_idx"
        ON "pages_blocks_subscription_configurator_feature_overview" ("_locale");

      INSERT INTO "pages_blocks_subscription_configurator" (
        "_order",
        "_parent_id",
        "_path",
        "_locale",
        "id",
        "page_intro_heading",
        "page_intro_description"
      )
      SELECT
        0,
        page."id",
        'layout',
        locale.code,
        concat('subscription-configurator-', page."id", '-', locale.code::text),
        config_locale."page_intro_heading",
        config_locale."page_intro_description"
      FROM "pages" page
      CROSS JOIN LATERAL unnest(enum_range(NULL::"_locales")) AS locale(code)
      LEFT JOIN "subscription_config" config ON true
      LEFT JOIN "subscription_config_locales" config_locale
        ON config_locale."_parent_id" = config."id"
       AND config_locale."_locale" = locale.code
      WHERE page."slug" = 'subscription';

      INSERT INTO "pages_blocks_subscription_configurator_feature_overview" (
        "_order",
        "_parent_id",
        "_locale",
        "id",
        "title",
        "description",
        "icon"
      )
      SELECT
        feature."_order",
        block."id",
        block."_locale",
        concat(feature."id", '-', block."_locale"::text),
        feature_locale."title",
        feature_locale."description",
        feature."icon"
      FROM "pages_blocks_subscription_configurator" block
      JOIN "subscription_config_feature_overview" feature ON true
      LEFT JOIN "subscription_config_feature_overview_locales" feature_locale
        ON feature_locale."_parent_id" = feature."id"
       AND feature_locale."_locale" = block."_locale";

      DROP TABLE "subscription_config_feature_overview_locales";
      DROP TABLE "subscription_config_feature_overview";

      ALTER TABLE "subscription_config_locales"
        DROP COLUMN "page_intro_heading",
        DROP COLUMN "page_intro_description";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "subscription_config_locales"
        ADD COLUMN "page_intro_heading" varchar DEFAULT 'Configure your setup before you talk pricing.',
        ADD COLUMN "page_intro_description" varchar DEFAULT 'Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.';

      CREATE TABLE "subscription_config_feature_overview" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "icon" varchar NOT NULL
      );

      CREATE TABLE "subscription_config_feature_overview_locales" (
        "title" varchar,
        "description" varchar,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );

      ALTER TABLE "subscription_config_feature_overview"
        ADD CONSTRAINT "subscription_config_feature_overview_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade;

      ALTER TABLE "subscription_config_feature_overview_locales"
        ADD CONSTRAINT "subscription_config_feature_overview_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_feature_overview"("id") ON DELETE cascade;

      CREATE INDEX "subscription_config_feature_overview_order_idx"
        ON "subscription_config_feature_overview" ("_order");
      CREATE INDEX "subscription_config_feature_overview_parent_id_idx"
        ON "subscription_config_feature_overview" ("_parent_id");
      CREATE UNIQUE INDEX "subscription_config_feature_overview_locales_locale_parent_i"
        ON "subscription_config_feature_overview_locales" ("_locale", "_parent_id");

      UPDATE "subscription_config_locales" config_locale
      SET
        "page_intro_heading" = block."page_intro_heading",
        "page_intro_description" = block."page_intro_description"
      FROM "pages" page
      JOIN "pages_blocks_subscription_configurator" block
        ON block."_parent_id" = page."id"
      WHERE page."slug" = 'subscription'
        AND block."_locale" = config_locale."_locale";

      INSERT INTO "subscription_config_feature_overview" ("_order", "_parent_id", "id", "icon")
      SELECT DISTINCT ON (feature."_order")
        feature."_order",
        config."id",
        concat('restored-feature-', feature."_order"),
        feature."icon"
      FROM "pages_blocks_subscription_configurator_feature_overview" feature
      JOIN "pages_blocks_subscription_configurator" block
        ON block."id" = feature."_parent_id"
      JOIN "pages" page
        ON page."id" = block."_parent_id"
      JOIN "subscription_config" config ON true
      WHERE page."slug" = 'subscription'
      ORDER BY feature."_order", block."_locale";

      INSERT INTO "subscription_config_feature_overview_locales" (
        "title",
        "description",
        "_locale",
        "_parent_id"
      )
      SELECT DISTINCT ON (feature."_order", feature."_locale")
        feature."title",
        feature."description",
        feature."_locale",
        concat('restored-feature-', feature."_order")
      FROM "pages_blocks_subscription_configurator_feature_overview" feature
      JOIN "pages_blocks_subscription_configurator" block
        ON block."id" = feature."_parent_id"
      JOIN "pages" page
        ON page."id" = block."_parent_id"
      WHERE page."slug" = 'subscription'
      ORDER BY feature."_order", feature."_locale";

      DROP TABLE "pages_blocks_subscription_configurator_feature_overview";
      DROP TABLE "pages_blocks_subscription_configurator";
    `)
}
