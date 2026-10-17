import type { CheckoutDiscount } from "@code0-tech/crater-graphql-types"

// The route validates code and duration before returning a discount to the form.
export type CheckoutDiscountData = Required<Omit<CheckoutDiscount, "__typename" | "code" | "duration">> & {
    code: NonNullable<CheckoutDiscount["code"]>
    duration: NonNullable<CheckoutDiscount["duration"]>
}
