import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

const pricingTableSuffixes = [
    "pro_features",
    "pro_missing_features",
    "max_features",
    "max_missing_features",
    "custom_features",
    "custom_missing_features",
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TYPE "public"."enum_pages_blocks_small_pricing_section_layout"
        RENAME TO "enum_pages_blocks_pricing_section_layout";
      ALTER TYPE "public"."enum_pages_blocks_small_pricing_pro_button_variant"
        RENAME TO "enum_pages_blocks_pricing_pro_button_variant";
      ALTER TYPE "public"."enum_pages_blocks_small_pricing_max_button_variant"
        RENAME TO "enum_pages_blocks_pricing_max_button_variant";
      ALTER TYPE "public"."enum_pages_blocks_small_pricing_custom_button_variant"
        RENAME TO "enum_pages_blocks_pricing_custom_button_variant";
    `)

    for (const suffix of pricingTableSuffixes) {
        await db.execute(sql.raw(`ALTER TABLE "pages_blocks_small_pricing_${suffix}" RENAME TO "pages_blocks_pricing_${suffix}"`))
        await db.execute(
            sql.raw(
                `ALTER TABLE "pages_blocks_pricing_${suffix}" RENAME CONSTRAINT "pages_blocks_small_pricing_${suffix}_parent_id_fk" TO "pages_blocks_pricing_${suffix}_parent_id_fk"`
            )
        )
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_small_pricing_${suffix}_order_idx" RENAME TO "pages_blocks_pricing_${suffix}_order_idx"`))
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_small_pricing_${suffix}_parent_id_idx" RENAME TO "pages_blocks_pricing_${suffix}_parent_id_idx"`))
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_small_pricing_${suffix}_locale_idx" RENAME TO "pages_blocks_pricing_${suffix}_locale_idx"`))
    }

    await db.execute(sql`
      ALTER TABLE "pages_blocks_small_pricing" RENAME TO "pages_blocks_pricing";
      ALTER TABLE "pages_blocks_pricing"
        RENAME CONSTRAINT "pages_blocks_small_pricing_parent_id_fk" TO "pages_blocks_pricing_parent_id_fk";
      ALTER INDEX "pages_blocks_small_pricing_order_idx" RENAME TO "pages_blocks_pricing_order_idx";
      ALTER INDEX "pages_blocks_small_pricing_parent_id_idx" RENAME TO "pages_blocks_pricing_parent_id_idx";
      ALTER INDEX "pages_blocks_small_pricing_path_idx" RENAME TO "pages_blocks_pricing_path_idx";
      ALTER INDEX "pages_blocks_small_pricing_locale_idx" RENAME TO "pages_blocks_pricing_locale_idx";
      ALTER TABLE "pages_blocks_pricing" DROP COLUMN "show_card";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_pricing" ADD COLUMN "show_card" boolean DEFAULT true;
      ALTER TABLE "pages_blocks_pricing" RENAME TO "pages_blocks_small_pricing";
      ALTER TABLE "pages_blocks_small_pricing"
        RENAME CONSTRAINT "pages_blocks_pricing_parent_id_fk" TO "pages_blocks_small_pricing_parent_id_fk";
      ALTER INDEX "pages_blocks_pricing_order_idx" RENAME TO "pages_blocks_small_pricing_order_idx";
      ALTER INDEX "pages_blocks_pricing_parent_id_idx" RENAME TO "pages_blocks_small_pricing_parent_id_idx";
      ALTER INDEX "pages_blocks_pricing_path_idx" RENAME TO "pages_blocks_small_pricing_path_idx";
      ALTER INDEX "pages_blocks_pricing_locale_idx" RENAME TO "pages_blocks_small_pricing_locale_idx";
    `)

    for (const suffix of [...pricingTableSuffixes].reverse()) {
        await db.execute(sql.raw(`ALTER TABLE "pages_blocks_pricing_${suffix}" RENAME TO "pages_blocks_small_pricing_${suffix}"`))
        await db.execute(
            sql.raw(
                `ALTER TABLE "pages_blocks_small_pricing_${suffix}" RENAME CONSTRAINT "pages_blocks_pricing_${suffix}_parent_id_fk" TO "pages_blocks_small_pricing_${suffix}_parent_id_fk"`
            )
        )
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_pricing_${suffix}_order_idx" RENAME TO "pages_blocks_small_pricing_${suffix}_order_idx"`))
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_pricing_${suffix}_parent_id_idx" RENAME TO "pages_blocks_small_pricing_${suffix}_parent_id_idx"`))
        await db.execute(sql.raw(`ALTER INDEX "pages_blocks_pricing_${suffix}_locale_idx" RENAME TO "pages_blocks_small_pricing_${suffix}_locale_idx"`))
    }

    await db.execute(sql`
      ALTER TYPE "public"."enum_pages_blocks_pricing_custom_button_variant"
        RENAME TO "enum_pages_blocks_small_pricing_custom_button_variant";
      ALTER TYPE "public"."enum_pages_blocks_pricing_max_button_variant"
        RENAME TO "enum_pages_blocks_small_pricing_max_button_variant";
      ALTER TYPE "public"."enum_pages_blocks_pricing_pro_button_variant"
        RENAME TO "enum_pages_blocks_small_pricing_pro_button_variant";
      ALTER TYPE "public"."enum_pages_blocks_pricing_section_layout"
        RENAME TO "enum_pages_blocks_small_pricing_section_layout";
    `)
}
