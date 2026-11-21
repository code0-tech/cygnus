"use client"

import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

export type MobileCheckoutView = "summary" | "form"

const HISTORY_KEY = "checkoutView"

/**
 * The mobile checkout shows the summary and the form as two full-screen views of the same page. Every step forward
 * (summary → billing → payment) adds a history entry without changing the URL, so the browser back button walks the
 * steps backwards instead of leaving the checkout. Nothing remounts: the session, customer and Stripe Elements stay.
 *
 * `enabled` is false on desktop, where both columns are visible and no history entries are added.
 */
export function useMobileCheckoutView(enabled: boolean) {
    const [view, setView] = useState<MobileCheckoutView>("summary")
    const { hasError, setStage, stage } = useCheckoutStage()
    const historyDepthRef = useRef(0)
    const ignoreNextPopRef = useRef(false)
    const stageChangeFromPopRef = useRef(false)
    const previousStageRef = useRef(stage)
    const summaryScrollRef = useRef(0)
    const stateRef = useRef({ enabled, stage, view })
    useLayoutEffect(() => {
        stateRef.current = { enabled, stage, view }
    })

    const pushStep = useCallback(() => {
        historyDepthRef.current += 1
        // Spread the current state: it carries the Next.js router entry, which a popstate needs to stay a no-op.
        window.history.pushState({ ...window.history.state, [HISTORY_KEY]: historyDepthRef.current }, "")
    }, [])

    const returnToSummary = useCallback(() => {
        setView("summary")
        requestAnimationFrame(() => window.scrollTo({ top: summaryScrollRef.current }))
    }, [])

    const showForm = useCallback(() => {
        if (!stateRef.current.enabled) return
        summaryScrollRef.current = window.scrollY
        setView("form")
        pushStep()
        window.scrollTo({ top: 0 })
    }, [pushStep])

    const goBack = useCallback(() => {
        if (historyDepthRef.current > 0) {
            window.history.back()
            return
        }
        if (stateRef.current.stage === "payment") setStage("billingAddress")
        else returnToSummary()
    }, [returnToSummary, setStage])

    useEffect(() => {
        const handlePopState = () => {
            if (ignoreNextPopRef.current) {
                ignoreNextPopRef.current = false
                return
            }
            if (historyDepthRef.current === 0) return
            historyDepthRef.current -= 1
            if (stateRef.current.stage === "payment") {
                stageChangeFromPopRef.current = true
                setStage("billingAddress")
                window.scrollTo({ top: 0 })
            } else {
                returnToSummary()
            }
        }
        window.addEventListener("popstate", handlePopState)
        return () => window.removeEventListener("popstate", handlePopState)
    }, [returnToSummary, setStage])

    // One history entry per step: moving on to payment adds one, the form's own "back to billing" link removes it.
    useEffect(() => {
        const previousStage = previousStageRef.current
        previousStageRef.current = stage
        if (previousStage === stage || !stateRef.current.enabled || stateRef.current.view !== "form") return

        if (stage === "payment") {
            pushStep()
            window.scrollTo({ top: 0 })
        } else if (stageChangeFromPopRef.current) {
            stageChangeFromPopRef.current = false
        } else if (historyDepthRef.current > 1) {
            historyDepthRef.current -= 1
            ignoreNextPopRef.current = true
            window.history.back()
        }
    }, [pushStep, stage])

    useEffect(() => {
        // The summary is hidden on errors and the message lives in the form, so show the form.
        if (hasError && enabled) setView("form")
    }, [enabled, hasError])

    return { goBack, setView, showForm, view }
}
