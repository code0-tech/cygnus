"use client"

import { IconArrowLeft, IconHome, IconRefresh } from "@tabler/icons-react"
import { AuroraBackground } from "@code0-tech/pictor/dist/components/aurora/Aurora"
import type { AppLocale } from "@/lib/i18n"

const buttonClassName =
    "inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-[0.6rem] text-sm no-underline transition-[filter] duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [&>svg]:shrink-0"
const secondaryButtonClassName = `${buttonClassName} border-white/5 bg-[#191825] text-white`
const primaryButtonClassName = `${buttonClassName} border-transparent bg-white text-[#0c0b14]`
const footerLinkClassName = "no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"

export interface PageErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

interface StatusPageProps {
    code: "404" | "500"
    locale?: AppLocale
    reference?: string
    reset?: () => void
}

export function StatusPage({ code, locale = "en", reference, reset }: StatusPageProps) {
    const de = locale === "de"
    const notFound = code === "404"
    const home = `/${locale}`
    const title = notFound ? (de ? "Dieser Weg führt ins Leere." : "This path leads nowhere.") : de ? "Bei uns ist etwas schiefgelaufen." : "Something broke on our side."
    const subtitle = notFound ? (de ? "Alle anderen stehen dir offen." : "Every other one still does.") : de ? "Versuche es gleich noch einmal." : "Give it another try."

    return (
        <section
            className="relative isolate flex h-dvh flex-col overflow-x-hidden overflow-y-auto bg-primary text-white"
            data-status-page
            aria-labelledby="status-title"
            data-qa-selector={notFound ? "not-found-page" : "error-page"}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 -scale-x-100 opacity-25 motion-reduce:[&_.aurora-background__aurora]:after:animate-none" aria-hidden="true">
                <AuroraBackground />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_0%,var(--bg-primary)_35%)] backdrop-blur-[5rem]" />
            </div>
            <div className="relative m-auto box-border w-full max-w-[30rem] shrink-0 px-6 py-8">
                <div
                    className={[
                        "relative inline-block text-[clamp(4.5rem,13vw,8rem)] leading-none font-semibold tracking-[-0.06em]",
                        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:animate-[error-code-tear-strong_4s_steps(1,end)_infinite] before:select-none before:content-[attr(data-code)]",
                        "after:pointer-events-none after:absolute after:top-0 after:left-0 after:animate-[error-code-tear-soft_4s_steps(1,end)_infinite] after:select-none after:content-[attr(data-code)]",
                        "motion-reduce:before:hidden motion-reduce:after:hidden",
                        notFound ? "before:text-[#ffbe0b]/95 after:text-[#ffbe0b]/50" : "before:text-[#d90429]/95 after:text-[#d90429]/50",
                    ].join(" ")}
                    data-code={code}
                    aria-hidden="true"
                >
                    {code}
                </div>
                <h1 id="status-title" className="my-6 text-[2rem] leading-[1.3] font-semibold tracking-[-0.03em]">
                    <span className="sr-only">{code}: </span>
                    {title} <span className="text-tertiary">{subtitle}</span>
                </h1>
                <p className="m-0 text-sm leading-[1.6] text-tertiary">
                    {notFound
                        ? de
                            ? "Die gesuchte Seite wurde verschoben, umbenannt oder hat nie existiert. Prüfe die Adresse oder gehe zurück zur Startseite."
                            : "The page you requested was moved, renamed or never existed. Check the address or continue from our homepage."
                        : de
                          ? "Diese Seite konnte nicht geladen werden. Ein erneuter Versuch hilft meistens. Falls der Fehler weiterhin auftritt, kontaktiere uns."
                          : "This page could not be rendered. Trying again usually resolves it. If it keeps happening, please contact us."}
                </p>
                {!notFound && reference && (
                    <p className="mt-3 text-sm leading-[1.6] wrap-anywhere text-secondary">
                        {de ? "Fehlerreferenz" : "Error reference"}: {reference}
                    </p>
                )}
                <div className="mt-8 flex gap-3 max-[360px]:flex-col">
                    {notFound ? (
                        <button
                            type="button"
                            className={secondaryButtonClassName}
                            onClick={() => {
                                if (window.history.length > 1) window.history.back()
                                else window.location.assign(home)
                            }}
                        >
                            <IconArrowLeft size={16} aria-hidden="true" />
                            {de ? "Zurück" : "Go back"}
                        </button>
                    ) : (
                        <a href={home} className={secondaryButtonClassName}>
                            <IconHome size={16} aria-hidden="true" />
                            {de ? "Zur Startseite" : "Back to homepage"}
                        </a>
                    )}
                    {notFound ? (
                        <a href={home} className={primaryButtonClassName}>
                            <IconHome size={16} aria-hidden="true" />
                            {de ? "Zur Startseite" : "Back to homepage"}
                        </a>
                    ) : (
                        <button type="button" className={primaryButtonClassName} onClick={reset}>
                            <IconRefresh size={16} aria-hidden="true" />
                            {de ? "Erneut versuchen" : "Try again"}
                        </button>
                    )}
                </div>
            </div>
            <footer className="relative flex shrink-0 flex-wrap items-center justify-center gap-x-[1.3rem] gap-y-3 p-[1.3rem] text-xs text-tertiary">
                <span>© Code0 UG (haftungsbeschränkt)</span>
                <nav className="flex flex-wrap justify-center gap-[1.3rem]" aria-label={de ? "Rechtliches" : "Legal"}>
                    <a href={`${home}/privacy`} className={footerLinkClassName}>
                        {de ? "Datenschutz" : "Privacy Policy"}
                    </a>
                    <a href={`${home}/legal-notice`} className={footerLinkClassName}>
                        {de ? "Impressum" : "Legal Notice"}
                    </a>
                    <a href={`${home}/terms`} className={footerLinkClassName}>
                        {de ? "AGB" : "Terms & Conditions"}
                    </a>
                </nav>
            </footer>
        </section>
    )
}
