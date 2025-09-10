"use client"

import React from "react";
import {Col, Row, Text} from "@code0-tech/pictor";
import Image from "next/image";
import Link from "next/link";
import {IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX} from "@tabler/icons-react"
import {Spotlight} from "@/components/Spotlight"

export const FooterSection: React.FC = () => {
    return (
        <div className={"relative bg-primary px-[8%] overflow-hidden"}>
            <div className={"absolute inset-0 h-full w-full bg-black/20"}/>
            <Spotlight opacity={0.2} duration={20}/>

            <div className="relative flex flex-col gap-16 px-8 lg:px-20 pt-24 lg:pt-40 pb-24 rounded-t-xl overflow-hidden">

                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <p className={"text-white"}>
                            Code0 Technology
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
                            Company
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                About us
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Team
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Career
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            Service
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                FAQ
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Support
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Prices
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            Legal
                        </p>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Privacy Policy
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Terms of Service
                            </p>
                        </Link>
                        <Link href={"/legal-notice"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Imprint
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}