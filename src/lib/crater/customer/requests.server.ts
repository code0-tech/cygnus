import { readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { craterJson } from "@/lib/crater/api.server"
import { isCustomerId, isValidEmail, optionalString, readJsonObject, readOptionalAddress } from "@/lib/crater/request"
import { normalizeCraterCustomerType, toCraterCustomerTypeEnum } from "@/lib/crater/values"
import type { CustomerAddressCreateInput, CustomerAddressUpdateInput, CustomersCreateInput, CustomersUpdateInput } from "@code0-tech/crater-graphql-types"
import type { NextResponse } from "next/server"

type RequestResult<T> = { data: T; response?: never } | { data?: never; response: NextResponse }

const INVALID_UPDATE_VALUE = Symbol("invalid-update-value")

function nullableString(value: unknown) {
    if (value === undefined) return undefined
    if (value === null) return null
    if (typeof value !== "string") return INVALID_UPDATE_VALUE
    return value.trim() || null
}

function readCreateAddress(value: unknown): CustomerAddressCreateInput | null {
    const address = readOptionalAddress(value)
    if (!address?.line1 || !address.city || !address.postalCode || !address.country) return null

    return {
        city: address.city,
        country: address.country,
        line1: address.line1,
        line2: address.line2 ?? "",
        postalCode: address.postalCode,
        state: address.state ?? "",
    }
}

function readUpdateAddress(value: unknown): CustomerAddressUpdateInput | undefined | typeof INVALID_UPDATE_VALUE {
    if (value === undefined) return undefined
    if (!value || typeof value !== "object" || Array.isArray(value)) return INVALID_UPDATE_VALUE

    const source = value as Record<string, unknown>
    const address: CustomerAddressUpdateInput = {}

    for (const field of ["city", "country", "line1", "line2", "postalCode", "state"] as const) {
        const nextValue = nullableString(source[field])
        if (nextValue === INVALID_UPDATE_VALUE) return INVALID_UPDATE_VALUE
        if (nextValue !== undefined) address[field] = nextValue
    }

    return address
}

export async function readCustomerCreateRequest(request: Request): Promise<RequestResult<CustomersCreateInput>> {
    const body = await readJsonObject(request)
    const customerType = normalizeCraterCustomerType(optionalString(body?.customerType))
    const email = readGuestCheckoutSession(request)?.email ?? optionalString(body?.email)
    const name = optionalString(body?.name)
    const phone = optionalString(body?.phone)
    const taxIdType = optionalString(body?.taxIdType)
    const taxIdValue = optionalString(body?.taxIdValue)
    const address = readCreateAddress(body?.address)

    if (!body || !customerType || !name || !email || !isValidEmail(email) || !address) {
        return { response: craterJson({ error: "customerType, name, a valid email, and an address with line1, city, postalCode, and country are required." }, 400) }
    }

    if (Boolean(taxIdType) !== Boolean(taxIdValue)) {
        return { response: craterJson({ error: "taxIdType and taxIdValue must be provided together." }, 400) }
    }

    return {
        data: {
            customerType: toCraterCustomerTypeEnum(customerType),
            address,
            email,
            name,
            ...(phone ? { phone } : {}),
            ...(taxIdType ? { taxIdType } : {}),
            ...(taxIdValue ? { taxIdValue } : {}),
        },
    }
}

export async function readCustomerUpdateRequest(request: Request): Promise<RequestResult<{ input: CustomersUpdateInput; removePaymentMethodId?: string }>> {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    const email = nullableString(body?.email)
    const name = nullableString(body?.name)
    const phone = nullableString(body?.phone)
    const address = readUpdateAddress(body?.address)
    if (body && "paymentMethods" in body) {
        return { response: craterJson({ error: "Replacing paymentMethods is not supported. Provide removePaymentMethodId instead." }, 400) }
    }
    const removePaymentMethodId = body?.removePaymentMethodId
    if (removePaymentMethodId !== undefined && (typeof removePaymentMethodId !== "string" || !removePaymentMethodId.trim())) {
        return { response: craterJson({ error: "removePaymentMethodId must be a non-empty payment method ID." }, 400) }
    }

    if (!body || !id || !isCustomerId(id) || email === INVALID_UPDATE_VALUE || name === INVALID_UPDATE_VALUE || phone === INVALID_UPDATE_VALUE || address === INVALID_UPDATE_VALUE) {
        return { response: craterJson({ error: "A valid Crater customer id is required and address must be valid when provided." }, 400) }
    }

    if (email === undefined && name === undefined && phone === undefined && address === undefined && removePaymentMethodId === undefined) {
        return { response: craterJson({ error: "Provide at least one customer field to update." }, 400) }
    }

    return {
        data: {
            input: {
                id,
                ...(address !== undefined ? { address } : {}),
                ...(email !== undefined ? { email } : {}),
                ...(name !== undefined ? { name } : {}),
                ...(phone !== undefined ? { phone } : {}),
            },
            ...(typeof removePaymentMethodId === "string" ? { removePaymentMethodId: removePaymentMethodId.trim() } : {}),
        },
    }
}
