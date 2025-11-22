import React from "react"

export function SectionDivider({ height, side }: { height: number, side: "top" | "bottom" }) {
    return (
        <div className={"-mx-4 border-white/10"}
             style={{
                 height,
                 borderTop: side === "top" ? "1px" : "0px",
                 borderBottom: side === "bottom" ? "1px" : "0px"
            }}
        />
    )
}