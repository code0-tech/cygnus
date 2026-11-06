import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "editor_no_namespace_label" varchar;

        UPDATE "license_dialogs_locales" SET
            "editor_no_namespace_label" = CASE WHEN "_locale" = 'de' THEN 'Kein verknüpfter Workspace' ELSE 'No linked workspace' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "editor_no_namespace_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "editor_no_namespace_label";
    `)
}
