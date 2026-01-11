"use client"

import { cn } from "@/utils/cn";
import {getDaysInMonth,} from "date-fns";
import React, {createContext, type CSSProperties, type FC, type ReactNode, useContext} from "react";
import {
    Tooltip,
    TooltipArrow,
    TooltipContent,
    TooltipPortal,
    TooltipTrigger
} from "@code0-tech/pictor";

export type GanttFeature = {
    id: string;
    name: string;
    content?: string;
    icon?: ReactNode;
    startAt: Date;
    endAt: Date;
};

type TimelineData = {
    year: number;
    quarters: {
        index: number;
        label: string;
        days: number;
    }[];
}[];

type GanttContextProps = {
    columnWidth: number;
    headerHeight: number;
    rowHeight: number;
    timelineData: TimelineData;
};

const GanttContext = createContext<GanttContextProps | null>(null);
const useGantt = () => useContext(GanttContext)!;

const createYearQuarters = (year: number) => {
    const quarters = [0, 1, 2, 3] as const;
    return quarters.map((qIdx) => {
        const startMonth = qIdx * 3;
        const months = [0, 1, 2].map((m) => startMonth + m);
        const days = months.reduce(
            (sum, m) => sum + getDaysInMonth(new Date(year, m, 1)),
            0
        );

        return {
            index: qIdx + 1,
            label: `Q${qIdx + 1}`,
            days,
        };
    });
};

export const GanttProvider: FC<{children: ReactNode; className?: string; }> = ({ children, className }) => {
    const years = [2024, 2025, 2026, 2027];
    const timelineData = years.map((year) => ({year, quarters: createYearQuarters(year)}));

    const columnWidth = 150;
    const headerHeight = 60;
    const rowHeight = 80;

    const cssVars: CSSProperties = {
        "--gantt-column-width": `${columnWidth}px`,
        "--gantt-header-height": `${headerHeight}px`,
        "--gantt-row-height": `${rowHeight}px`,
    } as CSSProperties

    return (
        <GanttContext.Provider
            value={{
                timelineData,
                columnWidth,
                headerHeight,
                rowHeight
            }}
        >
            <div
                className={cn("grid min-w-full w-max bg-[#020010] ", className)}
                style={{...cssVars}}
            >
                <div className="relative w-max">
                    {children}
                </div>
            </div>
        </GanttContext.Provider>
    );
};

export const GanttHeader: FC = () => {
    const gantt = useGantt();

    return (
        <div className="sticky top-0 z-20 bg-[#020010] backdrop-blur-md text-white w-max">
            <div className="flex divide-x divide-white/10">
                {gantt.timelineData.map((year) => (
                    <div key={year.year} className="flex flex-col">
                        <div className="p-2 text-md font-bold tracking-wide text-center border-b border-white/10">
                            {year.year}
                        </div>

                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: `repeat(4, var(--gantt-column-width))`,
                            }}
                        >
                            {year.quarters.map((q) => (
                                <div
                                    key={`${year.year}-Q${q.index}`}
                                    className="text-center text-xs py-2 font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-r border-b border-white/10 last:border-r-0"
                                >
                                    {q.label}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GanttTodayLine: FC = () => {
    const gantt = useGantt();
    const today = new Date();
    const baseYear = gantt.timelineData[0].year;

    if (today.getFullYear() < baseYear) return null;

    const yearDiff = today.getFullYear() - baseYear;
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const offset = (yearDiff * 4 * gantt.columnWidth) + ((dayOfYear / 365) * 4 * gantt.columnWidth);

    return (
        <div
            className="absolute top-0 bottom-0 w-px bg-brand/20 z-0 pointer-events-none"
            style={{ left: offset }}
        >
             <div className="absolute top-0 -translate-x-1/2 -translate-y-full text-[10px] font-bold text-brand bg-black/80 px-1.5 py-0.5 rounded border border-brand/30">TODAY</div>
             <div className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand/20 via-transparent to-transparent opacity-50"></div>
        </div>
    );
};

export const GanttFeatureList: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div
            className="pb-2 relative min-h-[400px]"
        >
            <GanttTodayLine />
            {children}
        </div>
    );
};

export const GanttFeatureListGroup: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div style={{ height: "var(--gantt-row-height)" }}>
            {children}
        </div>
    );
};

export const GanttFeatureItem: FC<GanttFeature> = ({ name, content, startAt, endAt, icon }) => {
    const gantt = useGantt();
    const baseYear = gantt.timelineData[0].year;
    const gap = 16

    const getQuarterIndex = (date: Date) => {
        const yearOffset = date.getFullYear() - baseYear;
        const quarter = Math.floor(date.getMonth() / 3);
        return yearOffset * 4 + quarter;
    };

    const startIndex = getQuarterIndex(startAt);
    const endIndex = getQuarterIndex(endAt);
    const widthQuarters = Math.max(1, endIndex - startIndex + 1);
    const width = (widthQuarters * gantt.columnWidth) - gap;
    const height = gantt.rowHeight - gap;
    const offset = startIndex * gantt.columnWidth

    return (
        <div className="relative w-max">
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "absolute flex items-center gap-2 p-2 rounded text-xs top-0",
                                "overflow-hidden cursor-default group border border-brand/10 bg-[#070c18] hover:bg-[#0c171f]",
                                "shadow-md transition-all"
                            )}
                            style={{
                                left: offset + (gap/2),
                                top: gap/2,
                                width,
                                height,
                            }}
                        >
                            <div
                                className="absolute inset-0 z-0 opacity-50 pointer-events-none"
                                style={{
                                    backgroundImage: `
                                        repeating-linear-gradient(-40deg,
                                        rgba(255, 255, 255, 0.05) 11px,
                                        rgba(255, 255, 255, 0.05) 12px,
                                        transparent 12px,
                                        transparent 24px
                                        )
                                    `,
                                }}
                            />
                            <div className="relative z-10 flex items-center gap-2 w-full overflow-hidden">
                                {icon && <span className="shrink-0 text-white/70 group-hover:text-white transition-colors">{icon}</span>}
                                <span className="truncate font-medium text-white/90 group-hover:text-white transition-colors">
                                    {name}
                                </span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipPortal>
                        <TooltipContent sideOffset={5} className="max-w-xs bg-white!">
                            <div className="flex flex-col gap-1 p-2 text-center">
                                <p className="font-semibold text-sm text-black">{name}</p>
                                {content && <p className="text-xs text-black/75">{content}</p>}
                            </div>
                            <TooltipArrow className="fill-white!"/>
                        </TooltipContent>
                    </TooltipPortal>
                </Tooltip>
        </div>
    );
};
