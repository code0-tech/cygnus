import type { Error as CraterError } from "@code0-tech/crater-graphql-types"

// Carries no token and no customer data, so it is safe to log as well as to return.
export function describeCraterError(errors: CraterError[] | null | undefined) {
    const error = errors?.[0]
    if (!error) return null

    const details =
        error.details
            ?.map((detail) => {
                if (detail.__typename === "MessageError") {
                    return detail.message ?? ""
                }

                if (detail.__typename === "ActiveModelError") {
                    return `${detail.attribute ?? "base"}: ${detail.type ?? "invalid"}`
                }

                return ""
            })
            .filter(Boolean) ?? []

    return { errorCode: error.errorCode ?? "UNKNOWN", details }
}

export function isNamespaceInUse(errors: CraterError[] | null | undefined) {
    return (
        errors?.some(
            (error) =>
                error.errorCode === "INVALID_SUBSCRIPTION" &&
                error.details?.some((detail) => detail.__typename === "MessageError" && detail.message === "Namespace is already linked to another subscription")
        ) ?? false
    )
}
