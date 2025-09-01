import { Timeline, TimelineItem } from "@/components/Timeline";
import React from "react"
import {IconCube, IconGlobe, IconLock, IconManualGearbox, IconRocket, IconWand} from "@tabler/icons-react"

export const RoadmapSection: React.FC = () => {
    return (
        <Timeline
            // className={cn(
            //   "[--step-line-active-color:#888888] dark:[--step-line-active-color:#9780ff]",
            //   "[--step-line-inactive-color:#b1b1b1] dark:[--step-line-inactive-color:#737373]",
            //   "[--placeholder-line-color:#a1a1a1] dark:[--placeholder-line-color:#737373]",
            //   "[--icon-active-color:#555555] dark:[--icon-active-color:#d4d4d4]",
            //   "[--icon-inactive-color:#a3a3a3] dark:[--icon-inactive-color:#a3a3a3]",
            //   "[--time-active-color:#555555] dark:[--time-active-color:#d4d4d4]",
            //   "[--time-inactive-color:#a3a3a3] dark:[--time-inactive-color:#a3a3a3]",
            //   "[--description-color:#555555] dark:[--description-color:#d4d4d4]"
            // )}
            data={TIMELINE}
            defaultActiveStep={{ time: "2025 Q2", stepIndex: 0 }}
            arcConfig={{
                circleWidth: 4500,
                angleBetweenMinorSteps: 0.4,
                lineCountFillBetweenSteps: 8,
                boundaryPlaceholderLinesCount: 50,
            }}
        />
    );
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
];