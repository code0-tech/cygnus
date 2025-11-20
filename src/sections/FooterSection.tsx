"use client"

import React from "react";
import Link from "next/link";
import {IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX} from "@tabler/icons-react"
import {Spotlight} from "@/components/Spotlight"
import {useTranslations} from "next-intl"

export const FooterSection: React.FC = () => {
    const t = useTranslations("FooterSection")

    return (
        <div className={"relative bg-primary overflow-hidden"}>
            <div className={"absolute inset-0 h-full w-full bg-black/20 border-t border-white/10"}/>
            <Spotlight opacity={0.2} duration={20}/>

            <div className="relative flex flex-col gap-16 px-8 lg:px-20 pt-24 lg:pt-40 pb-24 rounded-t-xl overflow-hidden">

                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <p className={"text-white"}>
                            {t("name")}
                        </p>
                        <div className={"flex items-center gap-4"}>
                            <Link href={"https://instagram.com/code0.tech"}>
                                <IconBrandInstagram size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://discord.com/invite/vsMtqBBqC7"}>
                                <IconBrandDiscord size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://x.com"}>
                                <IconBrandX size={24} className={"text-white/75"}/>
                            </Link>
                            <Link href={"https://github.com/code0-tech"}>
                                <IconBrandGithub size={24} className={"text-white/75"}/>
                            </Link>
                        </div>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            {t("company")}
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("aboutUs")}
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            {t("products")}
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("pricing")}
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            {t("legal")}
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("policy")}
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("terms")}
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}