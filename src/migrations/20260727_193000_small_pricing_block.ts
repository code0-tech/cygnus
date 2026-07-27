import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_packages_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_section_layout"
        AS ENUM('center', 'left');

      CREATE TABLE "pages_blocks_small_pricing" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "section_heading" varchar,
        "section_layout" "enum_pages_blocks_small_pricing_section_layout" DEFAULT 'center' NOT NULL,
        "section_description" varchar,
        "section_link_button_label" varchar,
        "section_link_button_url" varchar,
        "show_card" boolean DEFAULT true,
        "block_name" varchar
      );

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

      ALTER TABLE "pages_blocks_small_pricing"
        ADD CONSTRAINT "pages_blocks_small_pricing_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_packages"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_packages_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing_packages"("id") ON DELETE cascade;
      ALTER TABLE "pages_blocks_small_pricing_packages_missing_features"
        ADD CONSTRAINT "pages_blocks_small_pricing_packages_missing_features_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing_packages"("id") ON DELETE cascade;

      CREATE INDEX "pages_blocks_small_pricing_order_idx" ON "pages_blocks_small_pricing" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_parent_id_idx" ON "pages_blocks_small_pricing" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_path_idx" ON "pages_blocks_small_pricing" ("_path");
      CREATE INDEX "pages_blocks_small_pricing_locale_idx" ON "pages_blocks_small_pricing" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_packages_order_idx" ON "pages_blocks_small_pricing_packages" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_parent_id_idx" ON "pages_blocks_small_pricing_packages" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_locale_idx" ON "pages_blocks_small_pricing_packages" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_order_idx" ON "pages_blocks_small_pricing_packages_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_parent_id_idx" ON "pages_blocks_small_pricing_packages_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_features_locale_idx" ON "pages_blocks_small_pricing_packages_features" ("_locale");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_order_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_parent_id_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_packages_missing_features_locale_idx" ON "pages_blocks_small_pricing_packages_missing_features" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE "pages_blocks_small_pricing_packages_missing_features";
      DROP TABLE "pages_blocks_small_pricing_packages_features";
      DROP TABLE "pages_blocks_small_pricing_packages";
      DROP TABLE "pages_blocks_small_pricing";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_section_layout";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_packages_button_variant";
    `)
}
