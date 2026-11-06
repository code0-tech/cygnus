import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout" DROP COLUMN "login_login_url";
        ALTER TABLE "licenses" DROP COLUMN "redirect_url";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout" ADD COLUMN "login_login_url" varchar DEFAULT 'https://app.code0.tech/login' NOT NULL;
        ALTER TABLE "licenses" ADD COLUMN "redirect_url" varchar DEFAULT 'http://localhost:3001' NOT NULL;
    `)
}
