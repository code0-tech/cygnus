import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   CREATE TABLE "upgrade_banner" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pro_gradient_from" varchar DEFAULT '#7af69a' NOT NULL,
  	"pro_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
  	"max_gradient_from" varchar DEFAULT '#72c9f8' NOT NULL,
  	"max_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
  	"custom_gradient_from" varchar DEFAULT '#f872e2' NOT NULL,
  	"custom_gradient_to" varchar DEFAULT '#13102d' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "upgrade_banner_locales" (
  	"pro_text" varchar NOT NULL,
  	"pro_button_label" varchar NOT NULL,
  	"max_text" varchar NOT NULL,
  	"max_button_label" varchar NOT NULL,
  	"custom_text" varchar NOT NULL,
  	"custom_button_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "upgrade_banner_locales" ADD CONSTRAINT "upgrade_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."upgrade_banner"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "upgrade_banner_locales_locale_parent_id_unique" ON "upgrade_banner_locales" USING btree ("_locale","_parent_id");

  INSERT INTO "upgrade_banner" ("updated_at", "created_at") VALUES (now(), now());

  INSERT INTO "upgrade_banner_locales" (
    "pro_text",
    "pro_button_label",
    "max_text",
    "max_button_label",
    "custom_text",
    "custom_button_label",
    "_locale",
    "_parent_id"
  )
  SELECT
    COALESCE(
      (SELECT "upgrade_banner_text" FROM "checkout_locales" WHERE "_locale" = locale_data.locale LIMIT 1),
      CASE WHEN locale_data.locale = 'de' THEN 'Du brauchst mehr? {plan} bietet dir mehr Spielraum.' ELSE 'Need more? {plan} gives you more headroom.' END
    ),
    COALESCE(
      (SELECT "upgrade_banner_button_label" FROM "checkout_locales" WHERE "_locale" = locale_data.locale LIMIT 1),
      CASE WHEN locale_data.locale = 'de' THEN 'Auf {plan} upgraden' ELSE 'Upgrade to {plan}' END
    ),
    CASE WHEN locale_data.locale = 'de' THEN 'Du brauchst individuelle Kapazitäten? Mit {plan} passt du die Nutzung an deinen Bedarf an.' ELSE 'Need tailored capacity? {plan} lets you configure usage for your workload.' END,
    CASE WHEN locale_data.locale = 'de' THEN 'Auf {plan} upgraden' ELSE 'Upgrade to {plan}' END,
    CASE WHEN locale_data.locale = 'de' THEN 'Skaliere {plan}, indem du die enthaltenen Workflow-Ausführungen und KI-Tokens erhöhst.' ELSE 'Scale {plan} by increasing the included workflow executions and AI tokens.' END,
    CASE WHEN locale_data.locale = 'de' THEN 'Nutzung erhöhen' ELSE 'Increase usage' END,
    locale_data.locale,
    "upgrade_banner"."id"
  FROM "upgrade_banner"
  CROSS JOIN (VALUES ('en'::"_locales"), ('de'::"_locales")) AS locale_data(locale);

  ALTER TABLE "checkout_locales" DROP COLUMN "upgrade_banner_text";
  ALTER TABLE "checkout_locales" DROP COLUMN "upgrade_banner_button_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "upgrade_banner_text" varchar;
  ALTER TABLE "checkout_locales" ADD COLUMN "upgrade_banner_button_label" varchar;

  UPDATE "checkout_locales"
  SET
    "upgrade_banner_text" = COALESCE(
      (SELECT "pro_text" FROM "upgrade_banner_locales" WHERE "_locale" = "checkout_locales"."_locale" LIMIT 1),
      'Need more? {plan} gives you more headroom.'
    ),
    "upgrade_banner_button_label" = COALESCE(
      (SELECT "pro_button_label" FROM "upgrade_banner_locales" WHERE "_locale" = "checkout_locales"."_locale" LIMIT 1),
      'Upgrade'
    );

  ALTER TABLE "checkout_locales" ALTER COLUMN "upgrade_banner_text" SET NOT NULL;
  ALTER TABLE "checkout_locales" ALTER COLUMN "upgrade_banner_button_label" SET NOT NULL;
  DROP TABLE "upgrade_banner" CASCADE;
  DROP TABLE "upgrade_banner_locales" CASCADE;`)
}
