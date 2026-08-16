import { LandingContainer } from "@/components/ui/LandingContainer"
import type { ReactNode } from "react"

// The login page carries no header and no Crater session: there is nothing to authenticate against yet.
export default function CheckoutLoginLayout({ children }: { children: ReactNode }) {
    return <LandingContainer className="min-h-0 flex-1 overflow-y-auto my-8">{children}</LandingContainer>
}
