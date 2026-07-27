import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TYPE "public"."enum_pages_blocks_subscription_configurator_buttons_variant"
        AS ENUM('none', 'normal', 'outlined', 'filled');

      CREATE TABLE "pages_blocks_subscription_configurator_buttons" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "label" varchar NOT NULL,
        "url" varchar NOT NULL,
        "variant" "enum_pages_blocks_subscription_configurator_buttons_variant" DEFAULT 'normal'
      );

      ALTER TABLE "pages_blocks_subscription_configurator_buttons"
        ADD CONSTRAINT "pages_blocks_subscription_configurator_buttons_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."pages_blocks_subscription_configurator"("id")
        ON DELETE cascade;

      CREATE INDEX "pages_blocks_subscription_configurator_buttons_order_idx"
        ON "pages_blocks_subscription_configurator_buttons" ("_order");
      CREATE INDEX "pages_blocks_subscription_configurator_buttons_parent_id_idx"
        ON "pages_blocks_subscription_configurator_buttons" ("_parent_id");
      CREATE INDEX "pages_blocks_subscription_configurator_buttons_locale_idx"
        ON "pages_blocks_subscription_configurator_buttons" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE "pages_blocks_subscription_configurator_buttons";
      DROP TYPE "public"."enum_pages_blocks_subscription_configurator_buttons_variant";
    `)
}
