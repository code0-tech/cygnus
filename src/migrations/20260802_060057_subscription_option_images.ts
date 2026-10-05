import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "deployment_self_hosted_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "deployment_cloud_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "plan_pro_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "plan_max_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "plan_custom_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "customer_type_b2b_image_id" integer;
  ALTER TABLE "subscription_config" ADD COLUMN "customer_type_b2c_image_id" integer;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_deployment_self_hosted_image_id_media_id_fk" FOREIGN KEY ("deployment_self_hosted_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_deployment_cloud_image_id_media_id_fk" FOREIGN KEY ("deployment_cloud_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_plan_pro_image_id_media_id_fk" FOREIGN KEY ("plan_pro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_plan_max_image_id_media_id_fk" FOREIGN KEY ("plan_max_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_plan_custom_image_id_media_id_fk" FOREIGN KEY ("plan_custom_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_customer_type_b2b_image_id_media_id_fk" FOREIGN KEY ("customer_type_b2b_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_config" ADD CONSTRAINT "subscription_config_customer_type_b2c_image_id_media_id_fk" FOREIGN KEY ("customer_type_b2c_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "subscription_config_deployment_self_hosted_deployment_se_idx" ON "subscription_config" USING btree ("deployment_self_hosted_image_id");
  CREATE INDEX "subscription_config_deployment_cloud_deployment_cloud_im_idx" ON "subscription_config" USING btree ("deployment_cloud_image_id");
  CREATE INDEX "subscription_config_plan_pro_plan_pro_image_idx" ON "subscription_config" USING btree ("plan_pro_image_id");
  CREATE INDEX "subscription_config_plan_max_plan_max_image_idx" ON "subscription_config" USING btree ("plan_max_image_id");
  CREATE INDEX "subscription_config_plan_custom_plan_custom_image_idx" ON "subscription_config" USING btree ("plan_custom_image_id");
  CREATE INDEX "subscription_config_customer_type_b2b_customer_type_b2b__idx" ON "subscription_config" USING btree ("customer_type_b2b_image_id");
  CREATE INDEX "subscription_config_customer_type_b2c_customer_type_b2c__idx" ON "subscription_config" USING btree ("customer_type_b2c_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_deployment_self_hosted_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_deployment_cloud_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_plan_pro_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_plan_max_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_plan_custom_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_customer_type_b2b_image_id_media_id_fk";
  
  ALTER TABLE "subscription_config" DROP CONSTRAINT "subscription_config_customer_type_b2c_image_id_media_id_fk";
  
  DROP INDEX "subscription_config_deployment_self_hosted_deployment_se_idx";
  DROP INDEX "subscription_config_deployment_cloud_deployment_cloud_im_idx";
  DROP INDEX "subscription_config_plan_pro_plan_pro_image_idx";
  DROP INDEX "subscription_config_plan_max_plan_max_image_idx";
  DROP INDEX "subscription_config_plan_custom_plan_custom_image_idx";
  DROP INDEX "subscription_config_customer_type_b2b_customer_type_b2b__idx";
  DROP INDEX "subscription_config_customer_type_b2c_customer_type_b2c__idx";
  ALTER TABLE "subscription_config" DROP COLUMN "deployment_self_hosted_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "deployment_cloud_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_pro_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_max_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_custom_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "customer_type_b2b_image_id";
  ALTER TABLE "subscription_config" DROP COLUMN "customer_type_b2c_image_id";`)
}
