import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "checkout" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Checkout Content' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "checkout_locales" (
  	"navigation_back_label" varchar NOT NULL,
  	"summary_eyebrow" varchar NOT NULL,
  	"summary_heading" varchar NOT NULL,
  	"summary_description" varchar NOT NULL,
  	"summary_deployment_label" varchar NOT NULL,
  	"summary_customer_type_label" varchar NOT NULL,
  	"summary_workflow_executions_label" varchar NOT NULL,
  	"summary_additional_features_label" varchar NOT NULL,
  	"summary_additional_features_description" varchar NOT NULL,
  	"summary_pricing_label" varchar NOT NULL,
  	"summary_pricing_description" varchar NOT NULL,
  	"summary_pricing_base_label" varchar NOT NULL,
  	"summary_pricing_workflow_executions_label" varchar NOT NULL,
  	"summary_pricing_additional_features_label" varchar NOT NULL,
  	"summary_pricing_total_label" varchar NOT NULL,
  	"summary_pricing_per_month_suffix" varchar NOT NULL,
  	"form_billing_heading" varchar NOT NULL,
  	"form_payment_heading" varchar NOT NULL,
  	"form_continue_label" varchar NOT NULL,
  	"form_back_to_billing_label" varchar NOT NULL,
  	"form_pay_now_label" varchar NOT NULL,
  	"form_processing_label" varchar NOT NULL,
  	"form_payment_error_fallback" varchar NOT NULL,
  	"success_heading" varchar NOT NULL,
  	"success_description" varchar NOT NULL,
  	"success_back_to_homepage_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "licenses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'License Collection' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "licenses_locales" (
  	"cards_licenses" varchar,
  	"cards_subscriptions" varchar,
  	"cards_payment_profiles" varchar,
  	"cards_invoices" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "checkout_locales" ADD CONSTRAINT "checkout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."checkout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "licenses_locales" ADD CONSTRAINT "licenses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."licenses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "checkout_locales_locale_parent_id_unique" ON "checkout_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "licenses_locales_locale_parent_id_unique" ON "licenses_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "checkout" CASCADE;
  DROP TABLE "checkout_locales" CASCADE;
  DROP TABLE "licenses" CASCADE;
  DROP TABLE "licenses_locales" CASCADE;`)
}
