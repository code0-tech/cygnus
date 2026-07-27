import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "subscription_config"
        ADD COLUMN "packages_pro_prices_monthly" numeric DEFAULT 0,
        ADD COLUMN "packages_pro_prices_quarterly" numeric DEFAULT 0,
        ADD COLUMN "packages_pro_prices_yearly" numeric DEFAULT 0,
        ADD COLUMN "packages_max_prices_monthly" numeric DEFAULT 0,
        ADD COLUMN "packages_max_prices_quarterly" numeric DEFAULT 0,
        ADD COLUMN "packages_max_prices_yearly" numeric DEFAULT 0;

      ALTER TABLE "subscription_config_locales"
        ADD COLUMN "packages_pro_title" varchar DEFAULT 'Pro',
        ADD COLUMN "packages_pro_description" varchar DEFAULT 'For individuals and smaller teams.',
        ADD COLUMN "packages_max_title" varchar DEFAULT 'Max',
        ADD COLUMN "packages_max_description" varchar DEFAULT 'For organizations with higher requirements.',
        ADD COLUMN "packages_custom_title" varchar DEFAULT 'Custom',
        ADD COLUMN "packages_custom_description" varchar DEFAULT 'A tailored package for individual requirements.';

      CREATE TYPE "public"."enum_pages_blocks_small_pricing_pro_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_max_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_custom_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');

      ALTER TABLE "pages_blocks_small_pricing"
        ADD COLUMN "pro_button_label" varchar,
        ADD COLUMN "pro_button_url" varchar,
        ADD COLUMN "pro_button_variant" "enum_pages_blocks_small_pricing_pro_button_variant" DEFAULT 'normal',
        ADD COLUMN "max_button_label" varchar,
        ADD COLUMN "max_button_url" varchar,
        ADD COLUMN "max_button_variant" "enum_pages_blocks_small_pricing_max_button_variant" DEFAULT 'normal',
        ADD COLUMN "custom_button_label" varchar,
        ADD COLUMN "custom_button_url" varchar,
        ADD COLUMN "custom_button_variant" "enum_pages_blocks_small_pricing_custom_button_variant" DEFAULT 'normal';

      CREATE TABLE "pages_blocks_small_pricing_pro_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_pro_missing_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_max_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_max_missing_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_custom_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_custom_missing_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );

      ALTER TABLE "pages_blocks_small_pricing_pro_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_pro_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_pro_missing_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_pro_missing_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_max_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_max_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_max_missing_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_max_missing_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_custom_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_custom_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_custom_missing_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_custom_missing_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;

      CREATE INDEX "pages_blocks_small_pricing_pro_features_order_idx" ON "pages_blocks_small_pricing_pro_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_pro_features_parent_id_idx" ON "pages_blocks_small_pricing_pro_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_pro_features_locale_idx" ON "pages_blocks_small_pricing_pro_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_pro_missing_features_order_idx" ON "pages_blocks_small_pricing_pro_missing_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_pro_missing_features_parent_id_idx" ON "pages_blocks_small_pricing_pro_missing_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_pro_missing_features_locale_idx" ON "pages_blocks_small_pricing_pro_missing_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_max_features_order_idx" ON "pages_blocks_small_pricing_max_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_max_features_parent_id_idx" ON "pages_blocks_small_pricing_max_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_max_features_locale_idx" ON "pages_blocks_small_pricing_max_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_max_missing_features_order_idx" ON "pages_blocks_small_pricing_max_missing_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_max_missing_features_parent_id_idx" ON "pages_blocks_small_pricing_max_missing_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_max_missing_features_locale_idx" ON "pages_blocks_small_pricing_max_missing_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_custom_features_order_idx" ON "pages_blocks_small_pricing_custom_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_custom_features_parent_id_idx" ON "pages_blocks_small_pricing_custom_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_custom_features_locale_idx" ON "pages_blocks_small_pricing_custom_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_custom_missing_features_order_idx" ON "pages_blocks_small_pricing_custom_missing_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_custom_missing_features_parent_id_idx" ON "pages_blocks_small_pricing_custom_missing_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_custom_missing_features_locale_idx" ON "pages_blocks_small_pricing_custom_missing_features" ("_locale");

      WITH ranked_packages AS (
        SELECT package.*,
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      UPDATE "pages_blocks_small_pricing" block
      SET
        "pro_button_label" = pro."button_label",
        "pro_button_url" = pro."button_url",
        "pro_button_variant" = pro."button_variant"::text::"enum_pages_blocks_small_pricing_pro_button_variant",
        "max_button_label" = max."button_label",
        "max_button_url" = max."button_url",
        "max_button_variant" = max."button_variant"::text::"enum_pages_blocks_small_pricing_max_button_variant",
        "custom_button_label" = custom."button_label",
        "custom_button_url" = custom."button_url",
        "custom_button_variant" = custom."button_variant"::text::"enum_pages_blocks_small_pricing_custom_button_variant"
      FROM ranked_packages pro
      LEFT JOIN ranked_packages max
        ON max."_parent_id" = pro."_parent_id" AND max."_locale" = pro."_locale" AND max.package_index = 1
      LEFT JOIN ranked_packages custom
        ON custom."_parent_id" = pro."_parent_id" AND custom."_locale" = pro."_locale" AND custom.package_index = 2
      WHERE pro."_parent_id" = block."id"
        AND pro."_locale" = block."_locale"
        AND pro.package_index = 0;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_pro_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 0;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_pro_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_missing_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 0;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_max_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 1;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_max_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_missing_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 1;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_custom_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 2;

      WITH ranked_packages AS (
        SELECT package."id", package."_parent_id",
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      INSERT INTO "pages_blocks_small_pricing_custom_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT feature."_order", package."_parent_id", feature."_locale", feature."id", feature."text"
      FROM "pages_blocks_small_pricing_packages_missing_features" feature
      JOIN ranked_packages package ON package."id" = feature."_parent_id"
      WHERE package.package_index = 2;

      WITH ranked_packages AS (
        SELECT package.*,
          ROW_NUMBER() OVER (
            PARTITION BY package."_parent_id", package."_locale"
            ORDER BY package."_order", package."id"
          ) - 1 AS package_index
        FROM "pages_blocks_small_pricing_packages" package
      )
      UPDATE "subscription_config_locales" locale
      SET
        "packages_pro_title" = COALESCE((
          SELECT package."title" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 0
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_pro_title"),
        "packages_pro_description" = COALESCE((
          SELECT package."description" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 0
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_pro_description"),
        "packages_max_title" = COALESCE((
          SELECT package."title" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 1
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_max_title"),
        "packages_max_description" = COALESCE((
          SELECT package."description" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 1
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_max_description"),
        "packages_custom_title" = COALESCE((
          SELECT package."title" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 2
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_custom_title"),
        "packages_custom_description" = COALESCE((
          SELECT package."description" FROM ranked_packages package
          WHERE package."_locale" = locale."_locale" AND package.package_index = 2
          ORDER BY package."_parent_id" LIMIT 1
        ), locale."packages_custom_description");

      DROP TABLE "pages_blocks_small_pricing_packages_missing_features";
      DROP TABLE "pages_blocks_small_pricing_packages_features";
      DROP TABLE "pages_blocks_small_pricing_packages";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_packages_button_variant";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_packages_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');

      CREATE TABLE "pages_blocks_small_pricing_packages" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "button_label" varchar,
        "button_url" varchar,
        "button_variant" "enum_pages_blocks_small_pricing_packages_button_variant" DEFAULT 'normal'
      );
      CREATE TABLE "pages_blocks_small_pricing_packages_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );
      CREATE TABLE "pages_blocks_small_pricing_packages_missing_features" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL
      );

      ALTER TABLE "pages_blocks_small_pricing_packages"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_packages_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing_packages"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_packages_missing_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_missing_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing_packages"("id") ON DELETE cascade;

      CREATE INDEX "pages_blocks_small_pricing_packages_order_idx" ON "pages_blocks_small_pricing_packages" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_parent_id_idx" ON "pages_blocks_small_pricing_packages" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_locale_idx" ON "pages_blocks_small_pricing_packages" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_order_idx" ON "pages_blocks_small_pricing_packages_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_parent_id_idx" ON "pages_blocks_small_pricing_packages_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_locale_idx" ON "pages_blocks_small_pricing_packages_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_order_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_parent_id_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_locale_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_locale");

      INSERT INTO "pages_blocks_small_pricing_packages" (
        "_order", "_parent_id", "_locale", "id", "title", "description",
        "button_label", "button_url", "button_variant"
      )
      SELECT
        package_data.package_order,
        block."id",
        block."_locale",
        block."id" || '-' || package_data.package_key,
        CASE package_data.package_key
          WHEN 'pro' THEN COALESCE(locale."packages_pro_title", 'Pro')
          WHEN 'max' THEN COALESCE(locale."packages_max_title", 'Max')
          ELSE COALESCE(locale."packages_custom_title", 'Custom')
        END,
        CASE package_data.package_key
          WHEN 'pro' THEN locale."packages_pro_description"
          WHEN 'max' THEN locale."packages_max_description"
          ELSE locale."packages_custom_description"
        END,
        CASE package_data.package_key
          WHEN 'pro' THEN block."pro_button_label"
          WHEN 'max' THEN block."max_button_label"
          ELSE block."custom_button_label"
        END,
        CASE package_data.package_key
          WHEN 'pro' THEN block."pro_button_url"
          WHEN 'max' THEN block."max_button_url"
          ELSE block."custom_button_url"
        END,
        CASE package_data.package_key
          WHEN 'pro' THEN block."pro_button_variant"::text
          WHEN 'max' THEN block."max_button_variant"::text
          ELSE block."custom_button_variant"::text
        END::"enum_pages_blocks_small_pricing_packages_button_variant"
      FROM "pages_blocks_small_pricing" block
      CROSS JOIN (VALUES (0, 'pro'), (1, 'max'), (2, 'custom')) package_data(package_order, package_key)
      LEFT JOIN "subscription_config_locales" locale ON locale."_locale" = block."_locale";

      INSERT INTO "pages_blocks_small_pricing_packages_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-pro', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_pro_features";
      INSERT INTO "pages_blocks_small_pricing_packages_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-max', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_max_features";
      INSERT INTO "pages_blocks_small_pricing_packages_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-custom', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_custom_features";

      INSERT INTO "pages_blocks_small_pricing_packages_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-pro', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_pro_missing_features";
      INSERT INTO "pages_blocks_small_pricing_packages_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-max', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_max_missing_features";
      INSERT INTO "pages_blocks_small_pricing_packages_missing_features" ("_order", "_parent_id", "_locale", "id", "text")
      SELECT "_order", "_parent_id" || '-custom', "_locale", "id", "text"
      FROM "pages_blocks_small_pricing_custom_missing_features";

      DROP TABLE "pages_blocks_small_pricing_custom_missing_features";
      DROP TABLE "pages_blocks_small_pricing_custom_features";
      DROP TABLE "pages_blocks_small_pricing_max_missing_features";
      DROP TABLE "pages_blocks_small_pricing_max_features";
      DROP TABLE "pages_blocks_small_pricing_pro_missing_features";
      DROP TABLE "pages_blocks_small_pricing_pro_features";

      ALTER TABLE "pages_blocks_small_pricing"
        DROP COLUMN "custom_button_variant",
        DROP COLUMN "custom_button_url",
        DROP COLUMN "custom_button_label",
        DROP COLUMN "max_button_variant",
        DROP COLUMN "max_button_url",
        DROP COLUMN "max_button_label",
        DROP COLUMN "pro_button_variant",
        DROP COLUMN "pro_button_url",
        DROP COLUMN "pro_button_label";

      DROP TYPE "public"."enum_pages_blocks_small_pricing_custom_button_variant";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_max_button_variant";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_pro_button_variant";

      ALTER TABLE "subscription_config_locales"
        DROP COLUMN "packages_custom_description",
        DROP COLUMN "packages_custom_title",
        DROP COLUMN "packages_max_description",
        DROP COLUMN "packages_max_title",
        DROP COLUMN "packages_pro_description",
        DROP COLUMN "packages_pro_title";

      ALTER TABLE "subscription_config"
        DROP COLUMN "packages_max_prices_yearly",
        DROP COLUMN "packages_max_prices_quarterly",
        DROP COLUMN "packages_max_prices_monthly",
        DROP COLUMN "packages_pro_prices_yearly",
        DROP COLUMN "packages_pro_prices_quarterly",
        DROP COLUMN "packages_pro_prices_monthly";
    `)
}
