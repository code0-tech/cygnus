"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import { replaceCheckoutPage, restoreCraterSession } from "@/lib/checkout/client"
import { clearCraterUserLoginMarker } from "@/lib/crater/userLogin.client"
import { useEffect, useState, type ReactNode } from "react"

interface CheckoutLoginSessionGateProps {
    sessionHref: string
    checkSession: boolean
    children: ReactNode
}

export function CheckoutLoginSessionGate({ sessionHref, checkSession, children }: CheckoutLoginSessionGateProps) {
    const [checking, setChecking] = useState(checkSession)

    useEffect(() => {
        if (!checkSession) return
        let active = true

        restoreCraterSession()
            .then((session) => {
                if (!active) return
                if (session) {
                    replaceCheckoutPage(sessionHref)
                    return
                }
                clearCraterUserLoginMarker()
                setChecking(false)
            })
            .catch(() => {
                if (active) setChecking(false)
            })

        return () => {
            active = false
        }
    }, [checkSession, sessionHref])

    if (checking) {
        return (
            <div className="flex flex-1 items-center justify-center py-8 text-secondary">
                <ButtonLoader />
            </div>
        )
    }

    return children
}
