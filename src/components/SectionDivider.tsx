import React from "react"

export function SectionDivider({ height }: { height: number }) {
    return (
        <div className={"-mx-4 border-t border-white/10"}
             style={{height}}
        />
    )
}