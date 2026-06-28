import { NodesAnimation, type NodeItem, type NodeSegment } from "../animations/NodesAnimation"

interface TriggerMarkdownBlockProps {
    source: string
    title?: string
}

const colorCycle: NodeItem["color"][] = ["brand", "aqua", "yellow", "pink", "blue"]

const parseTriggerLine = (line: string, index: number): NodeItem => {
    const trimmed = line.trim().replace(/;$/, "")
    const match = trimmed.match(/^([^:\s]+):([^\s]+)\s+(.+)$/)

    if (!match) {
        return {
            color: colorCycle[index % colorCycle.length],
            outline: true,
            segments: [{ type: "text", value: trimmed }],
        }
    }

    const [, sourceSystem, targetNode, description] = match
    const segments: NodeSegment[] = [
        { type: "reference", value: sourceSystem },
        { type: "node", value: targetNode },
        { type: "text", value: description },
    ]

    return {
        color: colorCycle[index % colorCycle.length],
        outline: true,
        segments,
    }
}

const toNodes = (source: string) =>
    source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => parseTriggerLine(line, index))

export function TriggerMarkdownBlock({ source, title }: TriggerMarkdownBlockProps) {
    const nodes = toNodes(source)

    if (nodes.length <= 0) return

    return (
        <div className="my-6 overflow-hidden rounded-3xl bg-white/5 ring ring-white/10">
            {title && <div className="flex items-center gap-2 border-b border-white/10 bg-primary/50 px-6 py-3 text-xs font-semibold tracking-wide text-secondary">{title?.trim()}</div>}
            <div
                className="py-4"
                style={{
                    maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                }}
            >
                <NodesAnimation nodes={nodes} />
            </div>
        </div>
    )
}
