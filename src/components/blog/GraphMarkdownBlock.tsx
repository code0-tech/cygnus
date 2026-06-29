interface GraphMarkdownBlockProps {
    source: string
    title?: string
}

const toGraphNodes = (source: string) =>
    source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [from, to] = line.split("->").map((part) => part.trim())
            return { from: from ?? "", to: to ?? "" }
        })

const groupEdgesByTarget = (source: string) => {
    const edges = toGraphNodes(source)
    const grouped = new Map<string, Set<string>>()

    for (const edge of edges) {
        const target = edge.to || "Node"
        const sourceNode = edge.from || "Node"
        const existingSources = grouped.get(target) ?? new Set<string>()

        existingSources.add(sourceNode)
        grouped.set(target, existingSources)
    }

    return Array.from(grouped.entries()).map(([target, sources]) => ({ target, sources: Array.from(sources) }))
}

const NODE_SIZE = 112
const ROW_GAP = 16
const CONNECTOR_WIDTH = 176

const getGroupHeight = (count: number) => count * NODE_SIZE + (count - 1) * ROW_GAP
const getSourceCenterY = (index: number) => index * (NODE_SIZE + ROW_GAP) + NODE_SIZE / 2
const getTargetCenterY = (count: number) => getGroupHeight(count) / 2

export function GraphMarkdownBlock({ source, title }: GraphMarkdownBlockProps) {
    const groups = groupEdgesByTarget(source)

    if (groups.length <= 0) return

    return (
        <div className="my-6 overflow-hidden rounded-3xl bg-white/5 ring ring-white/10">
            {title && <div className="flex items-center gap-2 border-b border-white/10 bg-primary/50 px-6 py-3 text-xs font-semibold tracking-wide text-secondary">{title?.trim()}</div>}
            <div className="relative space-y-6 px-6 py-6">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
                        `,
                        backgroundPosition: "0 0",
                        backgroundSize: "24px 24px",
                        maskImage: "radial-gradient(circle at center, black 55%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(circle at center, black 55%, transparent 100%)",
                    }}
                />
                {groups.map((group, index) => (
                    <div key={`${group.target}-${index}`} className="relative flex items-center justify-center">
                        <div
                            className="grid items-center gap-x-0 gap-y-4"
                            style={{
                                gridTemplateColumns: `${NODE_SIZE}px ${CONNECTOR_WIDTH}px ${NODE_SIZE}px`,
                                gridTemplateRows: `repeat(${group.sources.length}, ${NODE_SIZE}px)`,
                            }}
                        >
                            <svg
                                aria-hidden="true"
                                className="pointer-events-none col-start-2 row-start-1 h-full w-full self-stretch"
                                style={{
                                    height: `${getGroupHeight(group.sources.length)}px`,
                                }}
                                viewBox={`0 0 ${CONNECTOR_WIDTH} ${getGroupHeight(group.sources.length)}`}
                                preserveAspectRatio="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {group.sources.map((sourceNode, sourceIndex) =>
                                    (() => {
                                        const y1 = getSourceCenterY(sourceIndex)
                                        const y2 = getTargetCenterY(group.sources.length)
                                        const particlePath = `M 0 ${y1} L ${CONNECTOR_WIDTH} ${y2}`
                                        const flowOffsets = ["0s", "-0.7s", "-1.4s", "-2.1s", "-2.8s"]

                                        return (
                                            <g key={`${group.target}-${sourceNode}-line`}>
                                                <line x1="0" y1={y1} x2={CONNECTOR_WIDTH} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                                {flowOffsets.map((offset) => (
                                                    <rect key={`${group.target}-${sourceNode}-${offset}`} x="-18" y="-1" width="18" height="2" rx="999" fill="rgba(255,255,255,0.5)">
                                                        <animateMotion begin={offset} dur="3.4s" repeatCount="indefinite" path={particlePath} rotate="auto" />
                                                    </rect>
                                                ))}
                                            </g>
                                        )
                                    })()
                                )}
                            </svg>
                            {group.sources.map((sourceNode, sourceIndex) => (
                                <div key={`${group.target}-${sourceNode}`} className="contents">
                                    <div
                                        className="col-start-1 flex h-28 w-28 items-center justify-center rounded-4xl bg-primary px-4 text-center text-sm font-semibold text-white border border-white/10"
                                        style={{ gridRowStart: sourceIndex + 1 }}
                                    >
                                        {sourceNode}
                                    </div>
                                    <div className="col-start-2 h-full w-full" style={{ gridRowStart: sourceIndex + 1 }} />
                                </div>
                            ))}
                            <div
                                className="col-start-3 row-start-1 flex h-28 w-28 items-center justify-center self-center rounded-4xl bg-primary px-4 text-center text-sm font-semibold text-white border border-white/10"
                                style={{ gridRowEnd: `span ${group.sources.length}` }}
                            >
                                {group.target}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
