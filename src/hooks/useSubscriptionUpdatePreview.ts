"use client"

import { previewSubscriptionUpdate, type SubscriptionUpdateFields, type SubscriptionUpdatePreview } from "@/lib/subscription/client"
import { useEffect, useMemo, useState } from "react"

export function useSubscriptionUpdatePreview(subscriptionId: string | undefined, fields: SubscriptionUpdateFields | null, errorMessage: string, delay = 0) {
    const requestBody = subscriptionId && fields ? JSON.stringify({ id: subscriptionId, ...fields }) : null
    const request = useMemo(() => (requestBody ? (JSON.parse(requestBody) as { id: string } & SubscriptionUpdateFields) : null), [requestBody])
    const [preview, setPreview] = useState<SubscriptionUpdatePreview | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)

    useEffect(() => {
        if (!request) {
            setPreview(null)
            setPreviewError(null)
            setIsLoadingPreview(false)
            return
        }

        const controller = new AbortController()
        setIsLoadingPreview(true)
        setPreviewError(null)
        const timer = window.setTimeout(() => {
            void previewSubscriptionUpdate(request, errorMessage, controller.signal)
                .then(setPreview)
                .catch((error) => {
                    if (!(error instanceof DOMException && error.name === "AbortError")) setPreviewError(errorMessage)
                })
                .finally(() => {
                    if (!controller.signal.aborted) setIsLoadingPreview(false)
                })
        }, delay)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [delay, errorMessage, request])

    return { isLoadingPreview, preview, previewError }
}
