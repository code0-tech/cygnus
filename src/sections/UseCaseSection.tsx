"use client"

import { UseCaseCard } from "@/components/cards/UseCaseCard"
import { Section } from "@/components/Section"
import { cn } from "@/utils/cn"
import { DataTypeService } from "@/utils/datatype.service"
import { FlowService } from "@/utils/flow.service"
import { FunctionService } from "@/utils/function.service"
import { TypeService } from "@/utils/type.service"
import { ContextStoreProvider, DataTypeView, FlowTypeView, FunctionDefinitionView, useReactiveArrayService } from "@code0-tech/pictor"
import { FileTabsService } from "@code0-tech/pictor/dist/components/file-tabs/FileTabs.service"
import { FileTabsView } from "@code0-tech/pictor/dist/components/file-tabs/FileTabs.view"
import { Flow } from "@code0-tech/sagittarius-graphql-types"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import React, { useEffect, useRef, useState } from "react"
import DataTypesData from "../data/data_types.json"
import FlowTypeData from "../data/flow_types.json"
import FunctionsData from "../data/runtime_functions.json"

const useCases = ["CMS", "Workflow", "Bots"] as const;
type UseCase = typeof useCases[number];

export const UseCaseSection: React.FC = () => {
    const t = useTranslations('UseCaseSection')
    const [activeCase, setActiveCase] = useState<UseCase>("CMS")
    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })

    const handleUseCaseClick = (item: UseCase) => {
        setActiveCase(item)
    }

    const flow = useReactiveArrayService<Flow, FlowService>(FlowService,
     [{
            id: "gid://sagittarius/Flow/1",
            type: {
                id: "gid://sagittarius/FlowType/888",
            },
            name: "de/codezero/examples/REST Flow",
            settings: {
                nodes: [{
                    flowSettingIdentifier: "HTTP_URL",
                }, {
                    flowSettingIdentifier: "HTTP_METHOD",
                }, {
                    flowSettingIdentifier: "HTTP_HOST",
                }]
            },
            nodes: {
                nodes: []
            }
        }, {
            id: "gid://sagittarius/Flow/2",
            type: {
                id: "gid://sagittarius/FlowType/888",
            },
            name: "de/codezero/examples-2/REST Flow",
            settings: {
                nodes: [{
                    flowSettingIdentifier: "HTTP_URL",
                }, {
                    flowSettingIdentifier: "HTTP_METHOD",
                }, {
                    flowSettingIdentifier: "HTTP_HOST",
                }]
            },
            nodes: {
                nodes: []
            }
        }, {
            id: "gid://sagittarius/Flow/3",
            type: {
                id: "gid://sagittarius/FlowType/888",
            },
            name: "en/codezero/examples/REST Flow",
            settings: {
                nodes: [{
                    flowSettingIdentifier: "HTTP_URL",
                }, {
                    flowSettingIdentifier: "HTTP_METHOD",
                }, {
                    flowSettingIdentifier: "HTTP_HOST",
                }]
            },
            nodes: {
                nodes: []
            }
        }])
    const flowFunction = useReactiveArrayService<FunctionDefinitionView, FunctionService>(FunctionService, [...FunctionsData.map(data => new FunctionDefinitionView(data as any))])
    const flowType = useReactiveArrayService<FlowTypeView, TypeService>(TypeService, [...FlowTypeData.map(data => new FlowTypeView(data as any))])
    const fileTab = useReactiveArrayService<FileTabsView, FileTabsService>(FileTabsService, [])
    const dataType = useReactiveArrayService<DataTypeView, DataTypeService>(DataTypeService, [...DataTypesData.map(data => new DataTypeView(data as any))])

    return (
        <ContextStoreProvider services={[flow, flowFunction, flowType, fileTab, dataType]}>
            <Section translationKey="UseCaseSection">
                <div className={"w-full mx-auto flex flex-col items-center justify-center"}>
                    <div className={"z-10 relative w-max h-full flex items-center -mb-6 p-2 rounded-2xl bg-[#353343] border border-white/5 shadow-md"}>
                        <div className={"flex items-center gap-2"}>
                            {useCases.map((item) => (
                                <UseCaseTab key={item}
                                    title={item}
                                    setPosition={setPosition}
                                    selected={activeCase === item}
                                    onClick={() => handleUseCaseClick(item)}
                                />
                            ))}
                        </div>
                        <motion.div
                            animate={{...position}}
                            className={cn("absolute z-40 h-8 rounded-lg bg-white ring ring-white/20")}
                        />
                    </div>
                    <div className="flex w-full h-[600px] rounded-2xl bg-white/2 ring ring-white/5 shadow-lg">
                        {activeCase === "CMS" && (
                            <UseCaseCard flowId={"gid://sagittarius/Flow/1"} title={t("useCase1Title")} description={t("useCase1Description")}/>
                        )}
                        {activeCase === "Workflow" && (
                            <UseCaseCard flowId={"gid://sagittarius/Flow/2"} title={t("useCase2Title")} description={t("useCase2Description")}/>
                        )}
                        {activeCase === "Bots" && (
                            <UseCaseCard flowId={"gid://sagittarius/Flow/3"} title={t("useCase3Title")} description={t("useCase3Description")}/>
                        )}
                    </div>
                </div>
            </Section>
        </ContextStoreProvider>
    )
}

interface UseCaseTabProps {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    onClick: () => void
    selected: boolean
    title: string
}

const UseCaseTab: React.FC<UseCaseTabProps> = ({ setPosition, onClick, title, selected }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (selected && ref.current) {
            const { width } = ref.current.getBoundingClientRect()
            setPosition({
                left: ref.current.offsetLeft,
                width,
                opacity: 1,
            })
        }
    }, [selected, setPosition])

    const moveHighlight = () => {
        if (!ref.current) return
        const { width } = ref.current.getBoundingClientRect()
        setPosition({
            left: ref.current.offsetLeft,
            width,
            opacity: 1,
        })
        onClick()
    }


    return (
        <motion.div
            className={cn(
                "relative z-50 flex items-center gap-2 px-4 py-1 font-medium text-md cursor-pointer transition-all",
                selected ? "text-black" : "text-white")}
            ref={ref}
            onClick={moveHighlight}
            initial={{opacity: 0, filter: 'blur(10px)'}}
            animate={{opacity: 1, filter: 'blur(0px)'}}
            transition={{duration: 0.65}}
        >
            {title}
        </motion.div>
    )
}
