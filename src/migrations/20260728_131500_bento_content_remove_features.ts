import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

const bentoCards = [
    { slug: "projects", prefix: "feature_content_projects", fallbackTitle: "Projects" },
    { slug: "role-system", prefix: "feature_content_role_system", fallbackTitle: "Role System" },
    { slug: "organizations", prefix: "feature_content_organizations", fallbackTitle: "Organizations" },
    { slug: "member-management", prefix: "feature_content_member_management", fallbackTitle: "Member Management" },
    { slug: "nodes", prefix: "runtime_content_nodes", fallbackTitle: "Nodes" },
    { slug: "suggestion-menu", prefix: "runtime_content_suggestion_menu", fallbackTitle: "Suggestion Menu" },
    { slug: "action-list", prefix: "runtime_content_action_list", fallbackTitle: "Action List" },
    { slug: "runtime-types", prefix: "runtime_content_runtime_types", fallbackTitle: "Runtime Types" },
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_bento"
            ADD COLUMN "feature_content_projects_title" varchar,
            ADD COLUMN "feature_content_projects_description" varchar,
            ADD COLUMN "feature_content_projects_link_label" varchar,
            ADD COLUMN "feature_content_projects_link_url" varchar,
            ADD COLUMN "feature_content_role_system_title" varchar,
            ADD COLUMN "feature_content_role_system_description" varchar,
            ADD COLUMN "feature_content_role_system_link_label" varchar,
            ADD COLUMN "feature_content_role_system_link_url" varchar,
            ADD COLUMN "feature_content_organizations_title" varchar,
            ADD COLUMN "feature_content_organizations_description" varchar,
            ADD COLUMN "feature_content_organizations_link_label" varchar,
            ADD COLUMN "feature_content_organizations_link_url" varchar,
            ADD COLUMN "feature_content_member_management_title" varchar,
            ADD COLUMN "feature_content_member_management_description" varchar,
            ADD COLUMN "feature_content_member_management_link_label" varchar,
            ADD COLUMN "feature_content_member_management_link_url" varchar,
            ADD COLUMN "runtime_content_nodes_title" varchar,
            ADD COLUMN "runtime_content_nodes_description" varchar,
            ADD COLUMN "runtime_content_nodes_link_label" varchar,
            ADD COLUMN "runtime_content_nodes_link_url" varchar,
            ADD COLUMN "runtime_content_suggestion_menu_title" varchar,
            ADD COLUMN "runtime_content_suggestion_menu_description" varchar,
            ADD COLUMN "runtime_content_suggestion_menu_link_label" varchar,
            ADD COLUMN "runtime_content_suggestion_menu_link_url" varchar,
            ADD COLUMN "runtime_content_action_list_title" varchar,
            ADD COLUMN "runtime_content_action_list_description" varchar,
            ADD COLUMN "runtime_content_action_list_link_label" varchar,
            ADD COLUMN "runtime_content_action_list_link_url" varchar,
            ADD COLUMN "runtime_content_runtime_types_title" varchar,
            ADD COLUMN "runtime_content_runtime_types_description" varchar,
            ADD COLUMN "runtime_content_runtime_types_link_label" varchar,
            ADD COLUMN "runtime_content_runtime_types_link_url" varchar;
    `)

    for (const { prefix, slug } of bentoCards) {
        await db.execute(
            sql.raw(`
                WITH "feature_content" AS (
                    SELECT
                        "bento"."id" AS "bento_id",
                        COALESCE("localized"."title", "fallback"."title") AS "title",
                        COALESCE("localized"."description", "fallback"."description") AS "description",
                        COALESCE("localized"."link_label", "fallback"."link_label") AS "link_label",
                        "feature"."link_url" AS "link_url"
                    FROM "pages_blocks_bento" AS "bento"
                    INNER JOIN "features" AS "feature"
                        ON "feature"."slug"::text = '${slug}'
                    LEFT JOIN "features_locales" AS "localized"
                        ON "localized"."_parent_id" = "feature"."id"
                        AND "localized"."_locale" = "bento"."_locale"
                    LEFT JOIN "features_locales" AS "fallback"
                        ON "fallback"."_parent_id" = "feature"."id"
                        AND "fallback"."_locale" = 'en'
                )
                UPDATE "pages_blocks_bento" AS "bento"
                SET
                    "${prefix}_title" = "content"."title",
                    "${prefix}_description" = "content"."description",
                    "${prefix}_link_label" = "content"."link_label",
                    "${prefix}_link_url" = "content"."link_url"
                FROM "feature_content" AS "content"
                WHERE "content"."bento_id" = "bento"."id";
            `)
        )
    }

    await db.execute(sql`
        ALTER TABLE "payload_locked_documents_rels"
            DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_features_fk";
        ALTER TABLE "payload_locked_documents_rels"
            DROP COLUMN IF EXISTS "features_id";

        DROP TABLE "features_locales";
        DROP TABLE "features";
        DROP TYPE "public"."enum_features_slug";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_features_slug" AS ENUM(
            'projects',
            'role-system',
            'member-management',
            'organizations',
            'suggestion-menu',
            'nodes',
            'runtime-types',
            'action-list'
        );

        CREATE TABLE "features" (
            "id" serial PRIMARY KEY NOT NULL,
            "slug" "enum_features_slug" NOT NULL,
            "link_url" varchar,
            "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
            "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE "features_locales" (
            "title" varchar NOT NULL,
            "description" varchar,
            "link_label" varchar,
            "id" serial PRIMARY KEY NOT NULL,
            "_locale" "_locales" NOT NULL,
            "_parent_id" integer NOT NULL
        );

        ALTER TABLE "features_locales"
            ADD CONSTRAINT "features_locales_parent_id_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "public"."features"("id") ON DELETE cascade;

        CREATE UNIQUE INDEX "features_slug_idx" ON "features" ("slug");
        CREATE INDEX "features_updated_at_idx" ON "features" ("updated_at");
        CREATE INDEX "features_created_at_idx" ON "features" ("created_at");
        CREATE UNIQUE INDEX "features_locales_locale_parent_id_unique" ON "features_locales" ("_locale", "_parent_id");

        ALTER TABLE "payload_locked_documents_rels"
            ADD COLUMN "features_id" integer;
        ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT "payload_locked_documents_rels_features_fk"
            FOREIGN KEY ("features_id") REFERENCES "public"."features"("id") ON DELETE cascade;
        CREATE INDEX "payload_locked_documents_rels_features_id_idx"
            ON "payload_locked_documents_rels" ("features_id");
    `)

    for (const { fallbackTitle, prefix, slug } of bentoCards) {
        await db.execute(
            sql.raw(`
                INSERT INTO "features" ("slug", "link_url")
                VALUES (
                    '${slug}',
                    (
                        SELECT "${prefix}_link_url"
                        FROM "pages_blocks_bento"
                        WHERE "${prefix}_link_url" IS NOT NULL
                        ORDER BY "_parent_id", "_order"
                        LIMIT 1
                    )
                );

                INSERT INTO "features_locales" (
                    "title",
                    "description",
                    "link_label",
                    "_locale",
                    "_parent_id"
                )
                SELECT
                    COALESCE("content"."title", '${fallbackTitle}'),
                    "content"."description",
                    "content"."link_label",
                    "locale"."value",
                    "feature"."id"
                FROM (
                    VALUES ('en'::"_locales"), ('de'::"_locales")
                ) AS "locale"("value")
                INNER JOIN "features" AS "feature"
                    ON "feature"."slug"::text = '${slug}'
                LEFT JOIN LATERAL (
                    SELECT
                        "${prefix}_title" AS "title",
                        "${prefix}_description" AS "description",
                        "${prefix}_link_label" AS "link_label"
                    FROM "pages_blocks_bento"
                    WHERE "_locale" = "locale"."value"
                        AND "${prefix}_title" IS NOT NULL
                    ORDER BY "_parent_id", "_order"
                    LIMIT 1
                ) AS "content" ON true;
            `)
        )
    }

    await db.execute(sql`
        ALTER TABLE "pages_blocks_bento"
            DROP COLUMN "feature_content_projects_title",
            DROP COLUMN "feature_content_projects_description",
            DROP COLUMN "feature_content_projects_link_label",
            DROP COLUMN "feature_content_projects_link_url",
            DROP COLUMN "feature_content_role_system_title",
            DROP COLUMN "feature_content_role_system_description",
            DROP COLUMN "feature_content_role_system_link_label",
            DROP COLUMN "feature_content_role_system_link_url",
            DROP COLUMN "feature_content_organizations_title",
            DROP COLUMN "feature_content_organizations_description",
            DROP COLUMN "feature_content_organizations_link_label",
            DROP COLUMN "feature_content_organizations_link_url",
            DROP COLUMN "feature_content_member_management_title",
            DROP COLUMN "feature_content_member_management_description",
            DROP COLUMN "feature_content_member_management_link_label",
            DROP COLUMN "feature_content_member_management_link_url",
            DROP COLUMN "runtime_content_nodes_title",
            DROP COLUMN "runtime_content_nodes_description",
            DROP COLUMN "runtime_content_nodes_link_label",
            DROP COLUMN "runtime_content_nodes_link_url",
            DROP COLUMN "runtime_content_suggestion_menu_title",
            DROP COLUMN "runtime_content_suggestion_menu_description",
            DROP COLUMN "runtime_content_suggestion_menu_link_label",
            DROP COLUMN "runtime_content_suggestion_menu_link_url",
            DROP COLUMN "runtime_content_action_list_title",
            DROP COLUMN "runtime_content_action_list_description",
            DROP COLUMN "runtime_content_action_list_link_label",
            DROP COLUMN "runtime_content_action_list_link_url",
            DROP COLUMN "runtime_content_runtime_types_title",
            DROP COLUMN "runtime_content_runtime_types_description",
            DROP COLUMN "runtime_content_runtime_types_link_label",
            DROP COLUMN "runtime_content_runtime_types_link_url";
    `)
}
