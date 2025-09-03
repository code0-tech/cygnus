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
                <div className={"bg-white/10 border border-white/20 text-white/50 shadow-xs shadow-white/10 w-fit px-2 py-0.5 rounded-full flex items-center gap-1 text-xs font-medium"}>
                    Join the closed beta
                </div>

                <div className={"flex items-center gap-2 font-semibold text-5xl"}>
                    <h1 className={"bg-gradient-to-b from-white/50 to-white bg-clip-text text-transparent"}>
                        Build
                    </h1>
                    <h1 className={"bg-gradient-to-b from-[#70ffb2]/30 to-[#70ffb2] bg-clip-text text-transparent"}>
                        complex backends
                    </h1>
                    <h1 className={"bg-gradient-to-b from-white/50 to-white bg-clip-text text-transparent"}>
                        in no-time
                    </h1>
                </div>
                <p className={"font-medium bg-gradient-to-r from-white/75 to-white/50 bg-clip-text text-transparent text-lg"}>
                    The backend world gets to the next era with the code0 no-code platform. <br/>
                    From database modelling to scalable backend endpoints in no-time.
                </p>
                <div className={"flex mt-4 gap-4"}>
                    <button className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                        <IconBrandDiscord size={16}/>
                        Join our discord
                    </button>
                    <button className={"h-10 flex items-center gap-2 bg-primary hover:bg-white/10 text-white/75 hover:text-white rounded-xl px-4 py-1 border border-white/10 shadow-md"}>
                        <IconMail size={16}/>
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