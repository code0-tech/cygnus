import React from "react"
import {Button, Card} from "@code0-tech/pictor"
import {IconBrandDiscord, IconMail} from "@tabler/icons-react"
import Image from "next/image"
import {Spotlight} from "@/components/Spotlight"

export const HeroSection: React.FC = () => {
    return (
        <div className={"relative flex flex-col px-[12%] pt-28 pb-32 gap-16 overflow-hidden"}>
            <Spotlight />
            <div className={"flex flex-col gap-4 mb-24"}>
                <div className={"bg-[#70ffb2]/10 border border-[#70ffb2]/20 text-[#70ffb2]/80 w-fit px-2 py-0.5 rounded-full flex items-center gap-1 text-xs font-medium"}>
                    Join the closed beta
                </div>
                <h1 style={{color: "white", fontSize: "3rem"}}>Build <span
                    style={{color: "#70ffb2"}}>complex backends </span>in no-time</h1>
                <p className={"w-2/3 text-white/75 text-md"}>
                    The backend world gets to the next era with the code0 no-code platform.
                    From database modelling to scalable backend endpoints in no-time <br/> all within our sleek and easy to use
                    dashboard made for everyone.
                </p>
                <div className={"flex mt-4 gap-4"}>
                    <button
                        className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}
                    >
                        <IconBrandDiscord size={16}/>
                        Join our discord
                    </button>
                    <button
                        className={"h-10 flex items-center gap-2 bg-primary hover:bg-white/10 text-white/75 hover:text-white rounded-xl px-4 py-1 border border-white/10 shadow-md"}
                    >
                        <Button.Icon>
                            <IconMail size={16}/>
                        </Button.Icon>
                        Contact
                    </button>
                </div>
            </div>

            <div className={"relative"}>
                <div className="absolute inset-0">
                    <div className="absolute inset-5 bg-[#160a59] blur-[40px] rounded-lg" />
                    <div className="absolute inset-0 bg-[#160a59] blur-[80px] rounded-lg" />
                </div>

                <Card className={" overflow-auto shadow-[0px_0px_60px_rgba(0,0,0,0.25)]"} outline variant={"outlined"}>
                    <Image src={"/code0_software.png"} alt={"Example image of code0 software"} height={1080} width={1920} className={"rounded-sm"}/>
                </Card>
            </div>
        </div>
    )
}