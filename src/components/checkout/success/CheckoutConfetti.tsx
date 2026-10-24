"use client"

import { m as motion } from "motion/react"

const PIECE_COUNT = 70
const COLORS = ["var(--color-brand)", "var(--color-yellow)", "var(--color-aqua)", "var(--color-blue)", "var(--color-pink)", "var(--color-magenta)", "var(--color-lime)"]

// Deterministic pseudo-random values keep rendering pure and stable across re-renders.
function random(seed: number) {
    const value = Math.sin(seed * 12.9898) * 43758.5453
    return value - Math.floor(value)
}

const PIECES = Array.from({ length: PIECE_COUNT }, (_, index) => {
    const fromLeft = index % 2 === 0
    const direction = fromLeft ? 1 : -1
    const spread = random(index + 1)
    const width = 6 + random(index + 101) * 6

    return {
        color: COLORS[index % COLORS.length],
        delay: random(index + 201) * 0.25,
        duration: 2.4 + random(index + 301) * 1.4,
        fromLeft,
        height: random(index + 401) > 0.5 ? width : width * 0.45,
        peakX: direction * (15 + spread * 30),
        peakY: -(45 + random(index + 501) * 40),
        endX: direction * (25 + spread * 45),
        endY: 10 + random(index + 601) * 20,
        rotate: direction * (360 + random(index + 701) * 720),
        round: random(index + 801) > 0.75,
        width,
    }
})

export function CheckoutConfetti() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {PIECES.map((piece, index) => (
                <motion.span
                    key={index}
                    className="absolute bottom-0"
                    style={{
                        backgroundColor: piece.color,
                        borderRadius: piece.round ? "9999px" : "2px",
                        height: piece.height,
                        left: piece.fromLeft ? 0 : undefined,
                        right: piece.fromLeft ? undefined : 0,
                        width: piece.width,
                    }}
                    initial={{ x: "0vw", y: "0vh", rotate: 0, opacity: 1 }}
                    animate={{
                        x: ["0vw", `${piece.peakX}vw`, `${piece.endX}vw`],
                        y: ["0vh", `${piece.peakY}vh`, `${piece.endY}vh`],
                        rotate: [0, piece.rotate / 2, piece.rotate],
                        opacity: [1, 1, 0],
                    }}
                    transition={{ delay: piece.delay, duration: piece.duration, ease: ["easeOut", "easeIn"], times: [0, 0.35, 1] }}
                />
            ))}
        </div>
    )
}
