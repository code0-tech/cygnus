import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import type { CheckoutData } from "@/lib/cms"
import Image from "next/image"
import Link from "next/link"
import { Card } from "../ui/Card"

interface CheckoutLoginProps {
    content: CheckoutData["login"]
    guestHref: string
    loginHref: string
}

export function CheckoutLogin({ content, guestHref, loginHref }: CheckoutLoginProps) {
    return (
        <main className="flex flex-1 items-center justify-center py-8">
            <Card variant={"light"} size={"lg"} className="w-full max-w-lg text-center">
                <Link href="/" className="mx-auto inline-flex">
                    <Image src="/code0_text_logo_white.png" alt="code0" width={128} height={32} className="h-8 w-32 object-contain" priority />
                </Link>
                <h1 className="mt-3 text-balance text-2xl font-semibold text-white sm:text-3xl">{content.heading}</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">{content.description}</p>

                <div className="mt-8 flex flex-col gap-3">
                    <HapticButtonLink href={loginHref} variant="filled" className="h-11! w-full! bg-white/90! font-semibold! text-primary! hover:bg-white!">
                        {content.loginLabel}
                    </HapticButtonLink>
                    <HapticButtonLink href={guestHref} variant="normal" className="h-11! w-full! font-medium!">
                        {content.guestLabel}
                    </HapticButtonLink>
                </div>
            </Card>
        </main>
    )
}
