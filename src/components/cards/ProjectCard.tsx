import React from "react"
import {IconFolders, IconUsersGroup} from "@tabler/icons-react"

export const ProjectCard: React.FC = () => {
    return (
        <div className={"relative flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-4 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>
            <div className={"h-full w-full flex flex-col items-center justify-center gap-4"}>

                <div className={"flex justify-center relative w-full"}>
                    <div className="absolute z-0 inset-0 left-1/2 -translate-x-1/2 w-4/5 ">
                        <div className="absolute inset-5 bg-[#70ffb2]/25 blur-[10px] rounded-sm" />
                        <div className="absolute inset-0 bg-[#70ffb2]/5 blur-[20px] rounded-sm" />
                    </div>

                    <div className={"relative z-10 w-4/5 flex items-center gap-2 p-2 bg-primary rounded-xl border border-white/5 ring-2 ring-[#70ffb2]/2 shadow-xl"}>
                        <div className={"flex items-center justify-center size-12 rounded-lg bg-[#70ffb2]/5"}>
                            <IconUsersGroup className={"text-[#70ffb2]"} size={30}/>
                        </div>
                        <p className={"text-white/75 font-medium"}>Join your organization</p>
                    </div>
                </div>

                <div className={"flex justify-center relative w-full"}>
                    <div className="absolute z-0 inset-0 left-1/2 -translate-x-1/2 w-4/5">
                        <div className="absolute inset-5 bg-[#b570ff]/25 blur-[10px] rounded-sm" />
                        <div className="absolute inset-0 bg-[#b570ff]/5 blur-[20px] rounded-sm" />
                    </div>

                    <div className={"relative z-10 w-4/5 flex items-center gap-2 p-2 bg-primary rounded-xl border border-white/5 ring-2 ring-[#b570ff]/2 shadow-xl"}>
                        <div className={"flex items-center justify-center size-12 rounded-lg bg-[#b570ff]/5"}>
                            <IconFolders className={"text-[#b570ff]"} size={30}/>
                        </div>
                        <p className={"text-white/75 font-medium"}>Create multiple projects</p>
                    </div>
                </div>

            </div>

            <div className={"flex flex-col gap-1"}>
                <p className={"font-mono font-semibold text-lg text-white/25"}>ORGANIZATIONS & PROJECTS</p>
                <p className={"text-white/50 text-justify"}>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna.</p>
            </div>
        </div>

    )
}