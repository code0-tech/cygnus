import React from "react"
import {Header} from "@/components/Header/Header"
import {Badge, Button, Card, Text} from "@code0-tech/pictor"
import {IconBrandDiscord, IconMail} from "@tabler/icons-react"
import Image from "next/image"

export const MainHeaderSection: React.FC = () => {

    return (
        <Header fh>
            <div className={"flex flex-col gap-4 mb-24"}>
                <Badge color={"secondary"}>
                    Join our Discord for early access
                </Badge>
                <h1 style={{color: "white", fontSize: "3rem"}}>Build <span
                    style={{color: "#70ffb2"}}>complex backends </span>in no-time</h1>
                <Text display={"block"} size={"md"}>
                    The backend world gets to the next era with the code0 no-code platform.
                    From database modelling to scalable backend endpoints in no-time <br/> all within our sleek and easy to use
                    dashboard made for everyone.
                </Text>
                <div className={"flex mt-4 gap-4"}>
                    <button
                        className={"h-10 flex items-center gap-2 bg-white/90 hover:bg-white text-primary rounded-xl px-4 py-1 border border-white/10 shadow-md"}
                    >
                        <IconBrandDiscord size={16}/>
                        Join our discord for early access
                    </button>
                    <button
                        className={"h-10 flex items-center gap-2 bg-primary hover:bg-white/10 text-white/75 hover:text-white rounded-xl px-4 py-1 border border-white/10 shadow-md"}
                    >
                        <Button.Icon>
                            <IconMail size={16}/>
                        </Button.Icon>
                        Contact us via mail
                    </button>
                </div>
            </div>

            <Card className={"relative aspect-auto w-max"} outline variant={"outlined"}>
                <Image src={"/code0_software.png"} alt={"Example image of code0 software"} width={1040} height={492}/>
            </Card>
        </Header>
    )
}