'use client'

import { ClientSideOptionsProvider } from '@c15t/nextjs/client'
import { gtag } from '@c15t/scripts/google-tag'
import type { ReactNode } from 'react'

export function ConsentManagerClient({ children }: { children: ReactNode }) {
    return (
        <ClientSideOptionsProvider
            scripts={[
                gtag({
                    id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!,
                    category: 'measurement',
                }),
            ]}
        >
            {children}
        </ClientSideOptionsProvider>
    )
}
