import type { BorderLayoutBlock } from "@/lib/cms"

interface BorderSectionProps {
    content?: BorderLayoutBlock | null
}

export function BorderSection({ content }: BorderSectionProps) {
    const paddingTop = content?.paddingTop ?? 0
    const paddingBottom = content?.paddingBottom ?? 0

    return (
        <div style={{ paddingTop, paddingBottom }}>
            <div className="relative left-1/2 w-dvw -translate-x-1/2 border-t border-white/10" />
        </div>
    )
}
