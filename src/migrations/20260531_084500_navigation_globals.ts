import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_navbar_buttons_buttons_variant') THEN
        CREATE TYPE "public"."enum_navbar_buttons_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "navbar_items_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "href" varchar,
      "order" numeric DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "navbar_items_items_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "navbar_items_items_sub_menu" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "href" varchar NOT NULL,
      "icon" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "navbar_items_items_sub_menu_locales" (
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "navbar_buttons" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "navbar_buttons_buttons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "href" varchar NOT NULL,
      "order" numeric DEFAULT 0 NOT NULL,
      "icon" varchar,
      "new_tab" boolean DEFAULT false,
      "variant" "enum_navbar_buttons_buttons_variant" DEFAULT 'normal' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "navbar_buttons_buttons_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "navbar_items_items"
        ADD CONSTRAINT "navbar_items_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "navbar_items_items_locales"
        ADD CONSTRAINT "navbar_items_items_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items_items"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "navbar_items_items_sub_menu"
        ADD CONSTRAINT "navbar_items_items_sub_menu_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items_items"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "navbar_items_items_sub_menu_locales"
        ADD CONSTRAINT "navbar_items_items_sub_menu_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items_items_sub_menu"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "navbar_buttons_buttons"
        ADD CONSTRAINT "navbar_buttons_buttons_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_buttons"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "navbar_buttons_buttons_locales"
        ADD CONSTRAINT "navbar_buttons_buttons_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_buttons_buttons"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "navbar_items_items_order_idx" ON "navbar_items_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "navbar_items_items_parent_id_idx" ON "navbar_items_items" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "navbar_items_items_locales_locale_parent_id_unique" ON "navbar_items_items_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX IF NOT EXISTS "navbar_items_items_sub_menu_order_idx" ON "navbar_items_items_sub_menu" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "navbar_items_items_sub_menu_parent_id_idx" ON "navbar_items_items_sub_menu" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "navbar_items_items_sub_menu_locales_locale_parent_id_unique" ON "navbar_items_items_sub_menu_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX IF NOT EXISTS "navbar_buttons_buttons_order_idx" ON "navbar_buttons_buttons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "navbar_buttons_buttons_parent_id_idx" ON "navbar_buttons_buttons" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "navbar_buttons_buttons_locales_locale_parent_id_unique" ON "navbar_buttons_buttons_locales" USING btree ("_locale", "_parent_id");

    DO $$
    DECLARE
      global_id integer;
    BEGIN
      SELECT MIN("id") INTO global_id FROM "navbar_items";

      IF global_id IS NULL THEN
        INSERT INTO "navbar_items" ("updated_at", "created_at") VALUES (now(), now()) RETURNING "id" INTO global_id;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navbar_items' AND column_name = 'href'
      ) THEN
        INSERT INTO "navbar_items_items" ("_order", "_parent_id", "id", "href", "order")
        SELECT row_number() OVER (ORDER BY "order", "id")::integer - 1, global_id, "id"::varchar, "href", "order"
        FROM "navbar_items"
        WHERE NOT EXISTS (
          SELECT 1 FROM "navbar_items_items" WHERE "navbar_items_items"."id" = "navbar_items"."id"::varchar
        );
      END IF;

      IF to_regclass('public.navbar_items_locales') IS NOT NULL THEN
        INSERT INTO "navbar_items_items_locales" ("title", "_locale", "_parent_id")
        SELECT "title", "_locale", "_parent_id"::varchar
        FROM "navbar_items_locales"
        WHERE EXISTS (
          SELECT 1 FROM "navbar_items_items" WHERE "navbar_items_items"."id" = "navbar_items_locales"."_parent_id"::varchar
        )
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;

      IF to_regclass('public.navbar_items_sub_menu') IS NOT NULL THEN
        INSERT INTO "navbar_items_items_sub_menu" ("_order", "_parent_id", "id", "key", "href", "icon")
        SELECT "_order", "_parent_id"::varchar, "id", "key", "href", "icon"::varchar
        FROM "navbar_items_sub_menu"
        WHERE EXISTS (
          SELECT 1 FROM "navbar_items_items" WHERE "navbar_items_items"."id" = "navbar_items_sub_menu"."_parent_id"::varchar
        )
        ON CONFLICT ("id") DO NOTHING;
      END IF;

      IF to_regclass('public.navbar_items_sub_menu_locales') IS NOT NULL THEN
        INSERT INTO "navbar_items_items_sub_menu_locales" ("title", "description", "_locale", "_parent_id")
        SELECT "title", "description", "_locale", "_parent_id"
        FROM "navbar_items_sub_menu_locales"
        WHERE EXISTS (
          SELECT 1 FROM "navbar_items_items_sub_menu" WHERE "navbar_items_items_sub_menu"."id" = "navbar_items_sub_menu_locales"."_parent_id"
        )
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    DO $$
    DECLARE
      global_id integer;
      icon_expression text;
      new_tab_expression text;
      variant_expression text;
    BEGIN
      SELECT MIN("id") INTO global_id FROM "navbar_buttons";

      IF global_id IS NULL THEN
        INSERT INTO "navbar_buttons" ("updated_at", "created_at") VALUES (now(), now()) RETURNING "id" INTO global_id;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navbar_buttons' AND column_name = 'href'
      ) THEN
        icon_expression := CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'navbar_buttons' AND column_name = 'icon'
        ) THEN '"icon"' ELSE 'NULL' END;

        new_tab_expression := CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'navbar_buttons' AND column_name = 'new_tab'
        ) THEN 'COALESCE("new_tab", false)' ELSE 'false' END;

        variant_expression := CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'navbar_buttons' AND column_name = 'variant'
        ) THEN 'CASE WHEN "variant"::text IN (''none'', ''normal'', ''outlined'', ''filled'') THEN "variant"::text ELSE ''normal'' END::"public"."enum_navbar_buttons_buttons_variant"'
        ELSE '''normal''::"public"."enum_navbar_buttons_buttons_variant"' END;

        EXECUTE format(
          'INSERT INTO "navbar_buttons_buttons" ("_order", "_parent_id", "id", "href", "order", "icon", "new_tab", "variant")
           SELECT row_number() OVER (ORDER BY "order", "id")::integer - 1, %s, "id"::varchar, "href", "order", %s, %s, %s
           FROM "navbar_buttons"
           WHERE NOT EXISTS (
             SELECT 1 FROM "navbar_buttons_buttons" WHERE "navbar_buttons_buttons"."id" = "navbar_buttons"."id"::varchar
           )',
          global_id,
          icon_expression,
          new_tab_expression,
          variant_expression
        );
      END IF;

      IF to_regclass('public.navbar_buttons_locales') IS NOT NULL THEN
        INSERT INTO "navbar_buttons_buttons_locales" ("title", "_locale", "_parent_id")
        SELECT "title", "_locale", "_parent_id"::varchar
        FROM "navbar_buttons_locales"
        WHERE EXISTS (
          SELECT 1 FROM "navbar_buttons_buttons" WHERE "navbar_buttons_buttons"."id" = "navbar_buttons_locales"."_parent_id"::varchar
        )
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "navbar_buttons_buttons_locales" CASCADE;
    DROP TABLE IF EXISTS "navbar_buttons_buttons" CASCADE;
    DROP TABLE IF EXISTS "navbar_items_items_sub_menu_locales" CASCADE;
    DROP TABLE IF EXISTS "navbar_items_items_sub_menu" CASCADE;
    DROP TABLE IF EXISTS "navbar_items_items_locales" CASCADE;
    DROP TABLE IF EXISTS "navbar_items_items" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_navbar_buttons_buttons_variant";
  `)
}
