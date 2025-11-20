import {
    differenceInMonths,
    format,
    getDaysInMonth,
} from "date-fns";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type FC,
    type CSSProperties,
    type ReactNode,
} from "react";

export type GanttFeature = {
    id: string;
    name: string;
    startAt: Date;
    endAt: Date;
};

type TimelineData = {
    year: number;
    months: { days: number }[];
}[];

type GanttContextProps = {
    zoom: number;
    range: "monthly";
    columnWidth: number;
    sidebarWidth: number;
    headerHeight: number;
    rowHeight: number;
    timelineData: TimelineData;
    ref: React.RefObject<HTMLDivElement | null>;
};

const GanttContext = createContext<GanttContextProps | null>(null);
const useGantt = () => useContext(GanttContext)!;

const createInitialTimeline = (today: Date): TimelineData => {
    const years = [
        today.getFullYear() - 1,
        today.getFullYear(),
        today.getFullYear() + 1,
    ];

    return years.map((year) => ({
        year,
        months: new Array(12).fill(null).map((_, month) => ({
            days: getDaysInMonth(new Date(year, month, 1)),
        })),
    }));
};

export const GanttProvider: FC<{
    range: "monthly";
    zoom?: number;
    children: ReactNode;
    className?: string;
}> = ({ range = "monthly", zoom = 100, children, className }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const [timelineData, setTimelineData] = useState<TimelineData>(createInitialTimeline(new Date()));

    const sidebarWidth = 300;
    const headerHeight = 60;
    const rowHeight = 36;
    const columnWidth = 150; // monthly default

    /* CSS Vars */
    const cssVars: CSSProperties = {
        "--gantt-column-width": `${(zoom / 100) * columnWidth}px`,
        "--gantt-header-height": `${headerHeight}px`,
        "--gantt-row-height": `${rowHeight}px`,
        "--gantt-sidebar-width": `${sidebarWidth}px`,
    } as CSSProperties;

    /* Infinite scroll (monthly) */
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;

        // extend left
        if (scrollLeft === 0) {
            const firstYear = timelineData[0].year;
            const newYear = firstYear - 1;

            setTimelineData((prev) => [
                {
                    year: newYear,
                    months: new Array(12).fill(null).map((_, m) => ({
                        days: getDaysInMonth(new Date(newYear, m, 1)),
                    })),
                },
                ...prev,
            ]);

            el.scrollLeft = 1;
        }

        // extend right
        if (scrollLeft + clientWidth >= scrollWidth) {
            const lastYear = timelineData.at(-1)!.year;
            const newYear = lastYear + 1;

            setTimelineData((prev) => [
                ...prev,
                {
                    year: newYear,
                    months: new Array(12).fill(null).map((_, m) => ({
                        days: getDaysInMonth(new Date(newYear, m, 1)),
                    })),
                },
            ]);
        }
    }, [timelineData]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <GanttContext.Provider
            value={{
                zoom,
                range,
                columnWidth,
                sidebarWidth,
                headerHeight,
                rowHeight,
                timelineData,
                ref: scrollRef,
            }}
        >
            <div
                ref={scrollRef}
                className={`grid w-full h-full overflow-auto bg-secondary ${className}`}
                style={{
                    ...cssVars,
                    gridTemplateColumns: "var(--gantt-sidebar-width) 1fr",
                }}
            >
                {children}
            </div>
        </GanttContext.Provider>
    );
};

export const GanttHeader: FC = () => {
    const gantt = useGantt();

    return (
        <div className="sticky top-0 z-20 bg-primary/80 backdrop-blur-md text-white w-max">
            <div className="flex divide-x divide-border/30">
                {gantt.timelineData.map((year) => (
                    <div key={year.year} className="flex flex-col">
                        <div className="px-3 py-2 text-xs font-semibold">
                            {year.year}
                        </div>

                        <div
                            className="grid border-t border-border/30"
                            style={{
                                gridTemplateColumns: `repeat(12, var(--gantt-column-width))`,
                            }}
                        >
                            {year.months.map((_, m) => (
                                <div
                                    key={`${year.year}-${m}`}
                                    className="text-center text-xs py-1 border-r border-border/20"
                                >
                                    {format(new Date(year.year, m, 1), "MMM")}
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
    const gantt = useGantt();
    return (
        <div
            className="absolute left-0 top-0"
            style={{ marginTop: "var(--gantt-header-height)" }}
        >
            {children}
        </div>
    );
};

export const GanttFeatureListGroup: FC<{ children: ReactNode }> = ({children}) => {
    return (
        <div style={{ paddingTop: "var(--gantt-row-height)" }}>
            {children}
        </div>
    );
};

export const GanttFeatureItem: FC<GanttFeature> = ({name, startAt, endAt}) => {
    const gantt = useGantt();
    const zoomWidth = (gantt.columnWidth * gantt.zoom) / 100;

    const timelineStart = new Date(gantt.timelineData[0].year, 0, 1);

    const offset = differenceInMonths(startAt, timelineStart) * zoomWidth;
    const width =
        Math.max(1, differenceInMonths(endAt, startAt)) * zoomWidth;

    return (
        <div className="relative w-max">
            <div
                className="absolute bg-white/10 shadow p-2 rounded text-xs top-0"
                style={{
                    left: offset,
                    width,
                    height: "var(--gantt-row-height)",
                }}
            >
                {name}
            </div>
        </div>
    );
};

export const GanttTimeline: FC<{ children: ReactNode }> = ({ children }) => {
    return <div className="relative w-max h-full">{children}</div>;
};
