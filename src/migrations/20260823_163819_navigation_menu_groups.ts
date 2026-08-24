import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "navigation_items_items_sub_menu_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_items_items_sub_menu_groups_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_items_items_short_link_groups_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_items_items_short_link_groups_links_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_items_items_short_link_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_items_items_short_link_groups_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "navigation_items_items_sub_menu" RENAME TO "navigation_items_items_sub_menu_groups_items";
  ALTER TABLE "navigation_items_items_sub_menu_locales" RENAME TO "navigation_items_items_sub_menu_groups_items_locales";
  ALTER TABLE "navigation_items_items_sub_menu_groups_items" DROP CONSTRAINT "navigation_items_items_sub_menu_parent_id_fk";
  
  ALTER TABLE "navigation_items_items_sub_menu_groups_items_locales" DROP CONSTRAINT "navigation_items_items_sub_menu_locales_parent_id_fk";
  
  DROP INDEX "navigation_items_items_sub_menu_order_idx";
  DROP INDEX "navigation_items_items_sub_menu_parent_id_idx";
  DROP INDEX "navigation_items_items_sub_menu_locales_locale_parent_id_uni";

  INSERT INTO "navigation_items_items_sub_menu_groups" ("_order", "_parent_id", "id")
  SELECT 0, "_parent_id", 'legacy-group-' || "_parent_id"
  FROM "navigation_items_items_sub_menu_groups_items"
  GROUP BY "_parent_id";

  INSERT INTO "navigation_items_items_sub_menu_groups_locales" ("title", "_locale", "_parent_id")
  SELECT
    CASE WHEN item_locale."_locale" = 'de' THEN 'Menü' ELSE 'Menu' END,
    item_locale."_locale",
    submenu_group."id"
  FROM "navigation_items_items_sub_menu_groups" submenu_group
  INNER JOIN "navigation_items_items_locales" item_locale
    ON item_locale."_parent_id" = submenu_group."_parent_id";

  UPDATE "navigation_items_items_sub_menu_groups_items"
  SET "_parent_id" = 'legacy-group-' || "_parent_id";

  ALTER TABLE "navigation_items_items_sub_menu_groups" ADD CONSTRAINT "navigation_items_items_sub_menu_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_sub_menu_groups_locales" ADD CONSTRAINT "navigation_items_items_sub_menu_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_sub_menu_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_short_link_groups_links" ADD CONSTRAINT "navigation_items_items_short_link_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_short_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_short_link_groups_links_locales" ADD CONSTRAINT "navigation_items_items_short_link_groups_links_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_short_link_groups_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_short_link_groups" ADD CONSTRAINT "navigation_items_items_short_link_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_short_link_groups_locales" ADD CONSTRAINT "navigation_items_items_short_link_groups_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_short_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_items_items_sub_menu_groups_order_idx" ON "navigation_items_items_sub_menu_groups" USING btree ("_order");
  CREATE INDEX "navigation_items_items_sub_menu_groups_parent_id_idx" ON "navigation_items_items_sub_menu_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_items_sub_menu_groups_locales_locale_parent" ON "navigation_items_items_sub_menu_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_items_items_short_link_groups_links_order_idx" ON "navigation_items_items_short_link_groups_links" USING btree ("_order");
  CREATE INDEX "navigation_items_items_short_link_groups_links_parent_id_idx" ON "navigation_items_items_short_link_groups_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_items_short_link_groups_links_locales_local" ON "navigation_items_items_short_link_groups_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_items_items_short_link_groups_order_idx" ON "navigation_items_items_short_link_groups" USING btree ("_order");
  CREATE INDEX "navigation_items_items_short_link_groups_parent_id_idx" ON "navigation_items_items_short_link_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_items_short_link_groups_locales_locale_pare" ON "navigation_items_items_short_link_groups_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "navigation_items_items_sub_menu_groups_items" ADD CONSTRAINT "navigation_items_items_sub_menu_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_sub_menu_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_sub_menu_groups_items_locales" ADD CONSTRAINT "navigation_items_items_sub_menu_groups_items_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_sub_menu_groups_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_items_items_sub_menu_groups_items_order_idx" ON "navigation_items_items_sub_menu_groups_items" USING btree ("_order");
  CREATE INDEX "navigation_items_items_sub_menu_groups_items_parent_id_idx" ON "navigation_items_items_sub_menu_groups_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_items_sub_menu_groups_items_locales_locale_" ON "navigation_items_items_sub_menu_groups_items_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "navigation_items_items_sub_menu_groups_items" DROP CONSTRAINT "navigation_items_items_sub_menu_groups_items_parent_id_fk";
  ALTER TABLE "navigation_items_items_sub_menu_groups_items_locales" DROP CONSTRAINT "navigation_items_items_sub_menu_groups_items_locales_pare_fk";

  DROP INDEX "navigation_items_items_sub_menu_groups_items_order_idx";
  DROP INDEX "navigation_items_items_sub_menu_groups_items_parent_id_idx";
  DROP INDEX "navigation_items_items_sub_menu_groups_items_locales_locale_";

  UPDATE "navigation_items_items_sub_menu_groups_items" submenu_item
  SET "_parent_id" = submenu_group."_parent_id"
  FROM "navigation_items_items_sub_menu_groups" submenu_group
  WHERE submenu_item."_parent_id" = submenu_group."id";

  ALTER TABLE "navigation_items_items_sub_menu_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_items_sub_menu_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_items_short_link_groups_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_items_short_link_groups_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_items_short_link_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_items_short_link_groups_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "navigation_items_items_sub_menu_groups" CASCADE;
  DROP TABLE "navigation_items_items_sub_menu_groups_locales" CASCADE;
  DROP TABLE "navigation_items_items_short_link_groups_links" CASCADE;
  DROP TABLE "navigation_items_items_short_link_groups_links_locales" CASCADE;
  DROP TABLE "navigation_items_items_short_link_groups" CASCADE;
  DROP TABLE "navigation_items_items_short_link_groups_locales" CASCADE;
  ALTER TABLE "navigation_items_items_sub_menu_groups_items" RENAME TO "navigation_items_items_sub_menu";
  ALTER TABLE "navigation_items_items_sub_menu_groups_items_locales" RENAME TO "navigation_items_items_sub_menu_locales";
  ALTER TABLE "navigation_items_items_sub_menu" ADD CONSTRAINT "navigation_items_items_sub_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_items_sub_menu_locales" ADD CONSTRAINT "navigation_items_items_sub_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_items_sub_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_items_items_sub_menu_order_idx" ON "navigation_items_items_sub_menu" USING btree ("_order");
  CREATE INDEX "navigation_items_items_sub_menu_parent_id_idx" ON "navigation_items_items_sub_menu" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_items_sub_menu_locales_locale_parent_id_uni" ON "navigation_items_items_sub_menu_locales" USING btree ("_locale","_parent_id");`)
}
