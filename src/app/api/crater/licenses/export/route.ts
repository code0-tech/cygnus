import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { isLicenseId } from "@/lib/licenses/craterLicenseRequest"
import type { Mutation, MutationLicensesExportArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type LicensesExportData = Pick<Mutation, "licensesExport">

const LICENSES_EXPORT: TypedDocumentNode<LicensesExportData, MutationLicensesExportArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation LicensesExport($input: LicensesExportInput!) {
        licensesExport(input: $input) {
            fileName
            licenseFile
            errors {
                ...CraterErrorFields
            }
        }
    }
`

function safeLicenseFileName(value: string) {
    const suggestedName = value.split(/[\\/]/).at(-1) ?? value
    const fileName = suggestedName
        .normalize("NFKD")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/^[.-]+/, "")
        .slice(0, 180)

    return fileName || "code0-license.czlc"
}

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isLicenseId(id)) {
        return craterJson({ error: "A valid Crater license id is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: LICENSES_EXPORT,
            variables: { input: { id } },
        })
        const payload = result.data?.licensesExport
        if (!payload) throw new Error("Crater returned no license export payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not export the license.")
        if (errorResponse) return errorResponse
        if (!payload.licenseFile || !payload.fileName) throw new Error("Crater returned an incomplete license export.")

        const fileName = safeLicenseFileName(payload.fileName)
        return new Response(payload.licenseFile, {
            status: 200,
            headers: {
                "cache-control": "private, no-store",
                "content-disposition": `attachment; filename="${fileName}"`,
                "content-type": "application/octet-stream",
                "x-content-type-options": "nosniff",
                "x-license-filename": fileName,
            },
        })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater license export error:", error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error")
        return craterJson({ error: "Could not export the Crater license." }, 502)
    }
}
