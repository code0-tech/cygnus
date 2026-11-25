import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Only rewrite the previous defaults so headings an editor already changed in the CMS stay untouched.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "checkout_locales" SET
            "summary_heading" = CASE WHEN "_locale" = 'de' THEN '{plan}-Plan' ELSE '{plan} Plan' END
        WHERE "summary_heading" IN ('Your Plan: {plan}', 'Dein Plan: {plan}')
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        UPDATE "checkout_locales" SET
            "summary_heading" = CASE WHEN "_locale" = 'de' THEN 'Dein Plan: {plan}' ELSE 'Your Plan: {plan}' END
        WHERE "summary_heading" IN ('{plan} Plan', '{plan}-Plan')
    `)
}
