"use client"

import { Alert, Button } from "@code0-tech/pictor"

export function CheckoutErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
    return (
        <Alert color="error" className="w-full">
            <p className="min-w-0 flex-1">{message}</p>
            {onRetry && retryLabel ? (
                <Button type="button" variant="normal" onClick={onRetry} className="shrink-0 text-sm!">
                    {retryLabel}
                </Button>
            ) : null}
        </Alert>
    )
}
