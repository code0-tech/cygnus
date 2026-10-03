import type { Error as CraterError } from "@code0-tech/crater-graphql-types"

export function isNamespaceInUse(errors: CraterError[] | null | undefined) {
    return (
        errors?.some(
            (error) =>
                error.errorCode === "INVALID_SUBSCRIPTION" &&
                error.details?.some((detail) => detail.__typename === "MessageError" && detail.message === "Namespace is already linked to another subscription")
        ) ?? false
    )
}
