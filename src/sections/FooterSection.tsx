"use client"

import React from "react";
import Link from "next/link";
import {IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX} from "@tabler/icons-react"
import {Spotlight} from "@/components/Spotlight"
import { useTranslations } from "next-intl"
import Image from "next/image"

export const FooterSection: React.FC = () => {
    const t = useTranslations("FooterSection")

    return (
        <div className={"relative bg-primary overflow-hidden"}>
            <div className={"absolute inset-0 h-full w-full bg-black/20 border-t border-white/10"}/>
            <Spotlight opacity={0.4} duration={20} />

            <p className="absolute -bottom-42 left-1/2 -translate-x-1/2 text-[312px] font-bold opacity-2">CodeZero</p>

            <div className="relative flex flex-col gap-16 px-8 lg:px-20 pt-24 lg:pt-40 pb-24 rounded-t-xl overflow-hidden">

                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <div className="flex items-center gap-2">
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            <p className={"text-white"}>
                                {t("name")}
                            </p>
                        </div>
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
                        <Link href={"/about-us"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("aboutUs")}
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            {t("products")}
                        </p>
                        <Link href={"/pricing"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("pricing")}
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            {t("legal")}
                        </p>
                        <Link href={"/policy"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("policy")}
                            </p>
                        </Link>
                        <Link href={"/terms"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("terms")}
                            </p>
                        </Link>
                        <Link href={"/imprint"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                {t("imprint")}
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
