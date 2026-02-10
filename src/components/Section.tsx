import { IconArrowUpRight } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { ReactNode } from "react"
import { Button } from "@/components/Button"

interface SectionProps {
    translationKey: string
    children: ReactNode
    showBlur?: boolean
    showFunnel?: boolean
    showLinkButton?: boolean
}

export function Section({ translationKey, children, showBlur = true, showFunnel = true, showLinkButton = true }: SectionProps) {
    const t = useTranslations(translationKey)

    return (
        <section className={"relative overflow-hidden flex flex-col gap-16 pt-16"}>
            {showBlur &&
                <div className="pointer-events-none absolute -inset-0 opacity-30 blur-xl will-change-filter [background:radial-gradient(circle,rgba(255,255,255,0.45),transparent_60%)]" />
            }
            {showFunnel &&
                <div className={"flex flex-col gap-4 items-center justify-center text-center pb-16 pt-48"}>
                    <h1 className={"text-4xl md:text-6xl text-white font-semibold"}>
                        {t("title")}
                    </h1>
                    <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                        {t("description")}
                    </p>
                    {showLinkButton &&
                        <Button variant="link" className="gap-1">
                            {t("linkButton")}
                            <IconArrowUpRight size={16} />
                        </Button>
                    }
                </div>
            }
            {children}
        </section>
    )
}
