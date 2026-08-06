import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import type { CheckoutData } from "@/lib/cms"
import Image from "next/image"
import Link from "next/link"

interface CheckoutLoginProps {
    content: CheckoutData["login"]
    guestHref: string
    loginHref: string
}

export function CheckoutLogin({ content, guestHref, loginHref }: CheckoutLoginProps) {
    return (
        <main className="flex flex-1 items-center justify-center py-8">
            <div className="w-full flex flex-col gap-8 max-w-3xl text-center">
                <Link href="/" className="mx-auto flex w-fit">
                    <Image src="/code0_text_logo_white.png" alt="code0" width={128} height={32} className="h-8 w-32 object-contain" priority />
                </Link>

                <div className="relative mt-10 grid gap-8 md:grid-cols-2 md:gap-0">
                    <section className="flex flex-col items-center md:px-10">
                        <h1 className="text-balance text-2xl font-semibold text-white sm:text-3xl">{content.heading}</h1>
                        <p className="mt-3 max-w-sm flex-1 text-sm leading-6 text-secondary">{content.description}</p>
                        <div className="mt-7 w-full">
                            <HapticButtonLink href={loginHref} variant="filled" className="h-11! w-full! bg-white/90! font-semibold! text-primary! hover:bg-white!">
                                {content.loginLabel}
                            </HapticButtonLink>
                        </div>
                    </section>

                    <div aria-hidden="true" className="h-px bg-white/10 md:absolute md:inset-y-0 md:left-1/2 md:h-auto md:w-px" />

                    <section className="flex flex-col items-center md:px-10">
                        <h2 className="text-balance text-2xl font-semibold text-white sm:text-3xl">{content.guestHeading}</h2>
                        <p className="mt-3 max-w-sm flex-1 text-sm leading-6 text-secondary">{content.guestDescription}</p>
                        <div className="mt-7 w-full">
                            <HapticButtonLink href={guestHref} variant="normal" className="h-11! w-full! font-medium!">
                                {content.guestLabel}
                            </HapticButtonLink>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
