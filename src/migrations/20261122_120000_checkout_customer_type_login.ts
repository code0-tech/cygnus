import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

const TABLE = "errors_locales"
const COLUMN = "checkout_customer_type_login"
const EN =
    "The account you signed in with already has a billing customer of the other type (personal or business), so it cannot be used for this checkout. Sign in with a different account or continue as a guest."
const DE =
    "Das Konto, mit dem du angemeldet warst, hat bereits einen Rechnungskunden des anderen Typs (privat oder geschäftlich) und kann für diesen Checkout nicht verwendet werden. Melde dich mit einem anderen Konto an oder fahre als Gast fort."

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    // One statement per call: Postgres refuses bound parameters in a multi-statement query.
    await db.execute(sql`ALTER TABLE ${sql.identifier(TABLE)} ADD COLUMN IF NOT EXISTS ${sql.identifier(COLUMN)} varchar`)
    await db.execute(sql`
        UPDATE ${sql.identifier(TABLE)} SET
            ${sql.identifier(COLUMN)} = COALESCE(
                NULLIF(${sql.identifier(COLUMN)}, ''),
                CASE WHEN "_locale" = 'de' THEN ${DE}::varchar ELSE ${EN}::varchar END
            )
    `)
    await db.execute(sql`ALTER TABLE ${sql.identifier(TABLE)} ALTER COLUMN ${sql.identifier(COLUMN)} SET NOT NULL`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`ALTER TABLE ${sql.identifier(TABLE)} DROP COLUMN IF EXISTS ${sql.identifier(COLUMN)}`)
}
