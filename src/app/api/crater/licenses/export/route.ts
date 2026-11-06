import { guestCheckoutId, readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject, isLicenseId } from "@/lib/crater/request"
import type { Mutation, MutationLicensesExportArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type LicensesExportData = Pick<Mutation, "licensesExport">

const LICENSES_EXPORT: TypedDocumentNode<LicensesExportData, MutationLicensesExportArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation LicensesExport($input: LicensesExportInput!) {
        licensesExport(input: $input) {
            license
            errors {
                ...CraterErrorFields
            }
        }
    }
`

function licenseFileName(id: string) {
    return `code0-license-${id.split("/").at(-1)}.czlc`
}

export const POST = withCraterSession({ log: "Crater license export error", error: "Could not export the Crater license." }, async (request, token) => {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isLicenseId(id)) {
        return craterJson({ error: "A valid Crater license id is required." }, 400)
    }

    if (guestCheckoutId(request) !== null && readGuestCheckoutSession(request)?.receipt?.licenseId !== id) {
        return craterJson({ error: "This guest purchase does not grant access to that license." }, 403)
    }

    return runCraterResourceMutation(token, LICENSES_EXPORT, { input: { id } }, (data) => data.licensesExport, {
        rejectionMessage: "Crater could not export the license.",
        selectResource: (payload) => payload.license,
        missingResourceMessage: "Crater returned an incomplete license export.",
        respond: (license) => {
            const fileName = licenseFileName(id)
            return new Response(license, {
                status: 200,
                headers: {
                    "cache-control": "private, no-store",
                    "content-disposition": `attachment; filename="${fileName}"`,
                    "content-type": "application/octet-stream",
                    "x-content-type-options": "nosniff",
                    "x-license-filename": fileName,
                },
            })
        },
    })
})
