import type { Scalars } from "@code0-tech/crater-graphql-types"

export function isLicenseId(value: string): value is Scalars["LicenseID"]["input"] {
    return /^gid:\/\/crater\/License\/\d+$/.test(value)
}
