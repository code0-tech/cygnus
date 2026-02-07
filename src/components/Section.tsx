import { IconArrowUpRight } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { ReactNode } from "react"

interface SectionProps {
    translationKey: string
    children: ReactNode
    showBlur?: boolean
    showFunnel?: boolean
}

export function Section({ translationKey, children, showBlur = true, showFunnel = true }: SectionProps) {
    const t = useTranslations(translationKey)

    return (
        <section className={"relative overflow-hidden flex flex-col gap-16 -mx-4"}>
            {showBlur &&
                <div className="pointer-events-none absolute -inset-16 opacity-20 blur-lg will-change-filter [background:radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_45%)]" />
            }
            {showFunnel &&
                <div className={"flex flex-col gap-4 items-center justify-center text-center pb-16 pt-48"}>
                    <p className={"text-4xl md:text-6xl text-white"}>
                        {t("title")}
                    </p>
                    <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                        {t("description")}
                    </p>
                    <button className={"flex items-center gap-1 border-b border-dashed border-white/25 text-sm text-gray-500 hover:text-brand"}>
                        {t("linkButton")}
                        <IconArrowUpRight size={16} />
                    </button>
                </div>
            }
            {children}
        </section>
    )
}
