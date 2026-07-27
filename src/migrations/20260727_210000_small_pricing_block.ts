import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

const packageArraySuffixes = [
    "pro_features",
    "pro_missing_features",
    "max_features",
    "max_missing_features",
    "custom_features",
    "custom_missing_features",
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_section_layout"
        AS ENUM('center', 'left');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_pricing_period"
        AS ENUM('monthly', 'quarterly', 'yearly');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_gradient"
        AS ENUM('blue', 'yellow', 'pink', 'aqua', 'brand', 'lime', 'magenta', 'neutral');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_gradient_direction"
        AS ENUM('topLeft', 'topRight', 'bottomLeft', 'bottomRight');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_pro_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_max_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');
      CREATE TYPE "public"."enum_pages_blocks_small_pricing_custom_button_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');

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
        "pricing_period" "enum_pages_blocks_small_pricing_pricing_period" DEFAULT 'monthly' NOT NULL,
        "gradient" "enum_pages_blocks_small_pricing_gradient" DEFAULT 'blue',
        "gradient_direction" "enum_pages_blocks_small_pricing_gradient_direction" DEFAULT 'topLeft',
        "pro_button_label" varchar,
        "pro_button_url" varchar,
        "pro_button_variant" "enum_pages_blocks_small_pricing_pro_button_variant" DEFAULT 'normal',
        "max_button_label" varchar,
        "max_button_url" varchar,
        "max_button_variant" "enum_pages_blocks_small_pricing_max_button_variant" DEFAULT 'normal',
        "custom_button_label" varchar,
        "custom_button_url" varchar,
        "custom_button_variant" "enum_pages_blocks_small_pricing_custom_button_variant" DEFAULT 'normal',
        "block_name" varchar
      );

      ALTER TABLE "pages_blocks_small_pricing"
        ADD CONSTRAINT "pages_blocks_small_pricing_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade;
      CREATE INDEX "pages_blocks_small_pricing_order_idx" ON "pages_blocks_small_pricing" ("_order");
      CREATE INDEX "pages_blocks_small_pricing_parent_id_idx" ON "pages_blocks_small_pricing" ("_parent_id");
      CREATE INDEX "pages_blocks_small_pricing_path_idx" ON "pages_blocks_small_pricing" ("_path");
      CREATE INDEX "pages_blocks_small_pricing_locale_idx" ON "pages_blocks_small_pricing" ("_locale");
    `)

    for (const suffix of packageArraySuffixes) {
        await db.execute(
            sql.raw(`
              CREATE TABLE "pages_blocks_small_pricing_${suffix}" (
                "_order" integer NOT NULL,
                "_parent_id" varchar NOT NULL,
                "_locale" "_locales" NOT NULL,
                "id" varchar PRIMARY KEY NOT NULL,
                "text" varchar NOT NULL
              );
              ALTER TABLE "pages_blocks_small_pricing_${suffix}"
                ADD CONSTRAINT "pages_blocks_small_pricing_${suffix}_parent_id_fk"
                FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_small_pricing"("id") ON DELETE cascade;
              CREATE INDEX "pages_blocks_small_pricing_${suffix}_order_idx" ON "pages_blocks_small_pricing_${suffix}" ("_order");
              CREATE INDEX "pages_blocks_small_pricing_${suffix}_parent_id_idx" ON "pages_blocks_small_pricing_${suffix}" ("_parent_id");
              CREATE INDEX "pages_blocks_small_pricing_${suffix}_locale_idx" ON "pages_blocks_small_pricing_${suffix}" ("_locale");
            `)
        )
    }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    for (const suffix of [...packageArraySuffixes].reverse()) {
        await db.execute(sql.raw(`DROP TABLE "pages_blocks_small_pricing_${suffix}"`))
    }

    await db.execute(sql`
      DROP TABLE "pages_blocks_small_pricing";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_custom_button_variant";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_max_button_variant";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_pro_button_variant";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_gradient_direction";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_gradient";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_pricing_period";
      DROP TYPE "public"."enum_pages_blocks_small_pricing_section_layout";
    `)
}
