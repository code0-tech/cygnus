"use client"

import { clearCheckoutDraftKeys } from "@/lib/checkout/checkoutDraft"
import { useEffect } from "react"

export function CheckoutDraftCleanup() {
    useEffect(() => {
        clearCheckoutDraftKeys()
    }, [])

    return null
}
