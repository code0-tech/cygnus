import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "actions" DROP CONSTRAINT "actions_icon_id_media_id_fk";
   ALTER TABLE "actions" DROP CONSTRAINT "actions_trigger_id_media_id_fk";
   ALTER TABLE "actions" DROP CONSTRAINT "actions_functiondefinitions_id_media_id_fk";
   ALTER TABLE "actions_locales" DROP CONSTRAINT "actions_locales_parent_id_fk";
   DROP INDEX "public"."actions_slug_idx";
   DROP INDEX "public"."actions_icon_idx";
   DROP INDEX "public"."actions_trigger_idx";
   DROP INDEX "public"."actions_functiondefinitions_idx";
   DROP TABLE "actions_locales" CASCADE;
   ALTER TABLE "actions" ADD COLUMN "module_id" integer;
   ALTER TABLE "actions" ADD CONSTRAINT "actions_module_id_media_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   CREATE INDEX "actions_module_idx" ON "actions" USING btree ("module_id");
   ALTER TABLE "actions" DROP COLUMN "slug";
   ALTER TABLE "actions" DROP COLUMN "icon_id";
   ALTER TABLE "actions" DROP COLUMN "trigger_id";
   ALTER TABLE "actions" DROP COLUMN "functiondefinitions_id";
   ALTER TABLE "actions" DROP COLUMN "documentation_url";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "actions" DROP CONSTRAINT "actions_module_id_media_id_fk";
   DROP INDEX "public"."actions_module_idx";
   ALTER TABLE "actions" ADD COLUMN "slug" varchar NOT NULL;
   ALTER TABLE "actions" ADD COLUMN "icon_id" integer;
   ALTER TABLE "actions" ADD COLUMN "trigger_id" integer;
   ALTER TABLE "actions" ADD COLUMN "functiondefinitions_id" integer;
   ALTER TABLE "actions" ADD COLUMN "documentation_url" varchar;
   CREATE TABLE "actions_locales" (
    "title" varchar NOT NULL,
    "short_description" varchar,
    "description" varchar,
    "documentation_label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "public"."_locales" NOT NULL,
    "_parent_id" integer NOT NULL
   );

   ALTER TABLE "actions" ADD CONSTRAINT "actions_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "actions" ADD CONSTRAINT "actions_trigger_id_media_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "actions" ADD CONSTRAINT "actions_functiondefinitions_id_media_id_fk" FOREIGN KEY ("functiondefinitions_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "actions_locales" ADD CONSTRAINT "actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
   CREATE UNIQUE INDEX "actions_slug_idx" ON "actions" USING btree ("slug");
   CREATE INDEX "actions_icon_idx" ON "actions" USING btree ("icon_id");
   CREATE INDEX "actions_trigger_idx" ON "actions" USING btree ("trigger_id");
   CREATE INDEX "actions_functiondefinitions_idx" ON "actions" USING btree ("functiondefinitions_id");
   CREATE UNIQUE INDEX "actions_locales_locale_parent_id_unique" ON "actions_locales" USING btree ("_locale","_parent_id");
   ALTER TABLE "actions" DROP COLUMN "module_id";`)
}
