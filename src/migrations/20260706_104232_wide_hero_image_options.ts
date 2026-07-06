import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_widehero_mask" AS ENUM('top', 'right', 'bottom', 'left');
  CREATE TABLE "pages_blocks_widehero_mask" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_widehero_mask",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "pages_blocks_widehero" ADD COLUMN "show_image_border" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_widehero_mask" ADD CONSTRAINT "pages_blocks_widehero_mask_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_widehero"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_widehero_mask_order_idx" ON "pages_blocks_widehero_mask" USING btree ("order");
  CREATE INDEX "pages_blocks_widehero_mask_parent_idx" ON "pages_blocks_widehero_mask" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_widehero_mask_locale_idx" ON "pages_blocks_widehero_mask" USING btree ("locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_widehero_mask" CASCADE;
  ALTER TABLE "pages_blocks_widehero" DROP COLUMN "show_image_border";
  DROP TYPE "public"."enum_pages_blocks_widehero_mask";`)
}
