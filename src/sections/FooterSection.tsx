"use client"

import { LandingContainer } from "@/components/LandingContainer";
import { IconBrandDiscord, IconBrandGithub, IconBrandInstagram, IconBrandX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const FooterSection: React.FC = () => {
    return (
        <LandingContainer className="min-h-full py-48">

            <div className={"relative flex flex-col gap-16 overflow-hidden"}>
                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <div className={"flex flex-col lg:justify-between gap-2"}>
                        <div className="flex items-center gap-2">
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            <p className={"text-white"}>
                                Name
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
                            Company
                        </p>
                        <Link href={"/about-us"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                AboutUs
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            Products
                        </p>
                        <Link href={"/pricing"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Pricing
                            </p>
                        </Link>
                    </div>

                    <div className={"flex flex-col gap-2"}>
                        <p className={"text-white/75"}>
                            Legal
                        </p>
                        <Link href={"/policy"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Policy
                            </p>
                        </Link>
                        <Link href={"/terms"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Terms
                            </p>
                        </Link>
                        <Link href={"/imprint"}>
                            <p className={"text-white/50 hover:underline underline-offset-2"}>
                                Imprint
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </LandingContainer>
    )
}
