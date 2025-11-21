import {getDaysInMonth,} from "date-fns";
import React, {createContext, type CSSProperties, type FC, type ReactNode, useContext} from "react";

export type GanttFeature = {
    id: string;
    name: string;
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
                className={`grid h-full w-full ${className ?? ""}`}
                style={{...cssVars}}
            >
                <div className="relative w-max h-full">
                    {children}
                </div>
            </div>
        </GanttContext.Provider>
    );
};

export const GanttHeader: FC = () => {
    const gantt = useGantt();

    return (
        <div className="sticky top-0 z-20 bg-primary/80 backdrop-blur-md text-white w-max">
            <div className="flex divide-x divide-white/10">
                {gantt.timelineData.map((year) => (
                    <div key={year.year} className="flex flex-col">
                        <div className="px-3 py-2 text-xs font-semibold">
                            {year.year}
                        </div>

                        <div
                            className="grid border-y border-white/10"
                            style={{
                                gridTemplateColumns: `repeat(4, var(--gantt-column-width))`,
                            }}
                        >
                            {year.quarters.map((q) => (
                                <div
                                    key={`${year.year}-Q${q.index}`}
                                    className="text-center text-xs py-1 border-r border-white/10"
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

export const GanttFeatureList: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div
            className="absolute left-0 top-0"
            style={{ marginTop: "var(--gantt-header-height)" }}
        >
            {children}
        </div>
    );
};

export const GanttFeatureListGroup: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div style={{ paddingTop: "var(--gantt-row-height)" }}>
            {children}
        </div>
    );
};

export const GanttFeatureItem: FC<GanttFeature> = ({ name, startAt, endAt, icon }) => {
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
            <div
                className="absolute flex items-center gap-2 border border-white/10 bg-white/5 shadow p-2 rounded text-xs top-0"
                style={{left: offset + (gap/2) ?? 0, top: gap/2, width, height}}
            >
                <div
                    className="absolute inset-0 z-10 pointer-events-none"
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
                {icon}
                {name}
            </div>
        </div>
    );
};
