"use client"

import React from "react";
import {Col, Row, Text} from "@code0-tech/pictor";
import Image from "next/image";
import Link from "next/link";
import {IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX} from "@tabler/icons-react"

export const FooterSection: React.FC = () => {
    return (
        <div className={"bg-primary pt-20 px-[12%] overflow-hidden"}>
            <div className="relative bg-black/20 p-20 border border-white/10 rounded-t-xl shadow-xl overflow-hidden">
                <Image src={"/code0_logo.png"} alt={"Code0 Logo"} width={400} height={400} className={"absolute -top-12 -left-24 opacity-3"}/>

                <div className={"grid grid-cols-4 gap-4"}>
                    <div className={"h-40 flex flex-col justify-between gap-2"}>
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