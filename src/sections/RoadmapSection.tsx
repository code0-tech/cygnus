import { Timeline, TimelineItem } from "@/components/Timeline";
import React from "react"
import {IconCube, IconGlobe, IconLock, IconManualGearbox, IconRocket, IconWand} from "@tabler/icons-react"

export const RoadmapSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full"}>
            <div className={""}/>
            <div className={"py-16 border-x border-dashed border-white/10"}>
                <Timeline
                    data={TIMELINE}
                    defaultActiveStep={{ time: "2025 Q3", stepIndex: 0 }}
                    arcConfig={{
                        circleWidth: 4500,
                        angleBetweenMinorSteps: 0.4,
                        lineCountFillBetweenSteps: 8,
                        boundaryPlaceholderLinesCount: 50,
                    }}
                />
            </div>
            <div className={""}/>
        </div>
    )
}

const TIMELINE: TimelineItem[] = [
    {
        time: "2022",
        steps: [
            {
                icon: <IconRocket size={20} />,
                content:
                    "Founded Visionary Tech, a cutting-edge AI development company.",
            },
            {
                icon: <IconCube size={20} />,
                content:
                    "Launched first AI-powered mobile app for personalized recommendations.",
            },
        ],
    },
    {
        time: "2023",
        steps: [
            {
                icon: <IconLock size={20} />,
                content: "Raised $3M seed round at a $20M valuation.",
            },
            {
                icon: <IconGlobe size={20} />,
                content:
                    "Expanded to global markets with localized app versions in 5 countries.",
            },
            {
                icon: <IconManualGearbox size={20}/>,
                content:
                    "Implemented enhanced machine learning algorithms for data prediction.",
            },
        ],
    },
    {
        time: "2025 Q3",
        steps: [
            {
                icon: <IconCube size={20} />,
                content: "Launched self-driving AI platform for industrial automation.",
            },
            {
                icon: <IconWand size={20} />,
                content: "Added virtual reality integration to the product suite.",
            },
        ],
    },
]