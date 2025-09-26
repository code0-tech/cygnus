"use client"

import React from "react"
import Image from "next/image"

export function ChipLogo() {
    return (
        <div className={"relative"}>


            <p className={"z-50 absolute top-4 left-9 font-mono text-[6px] text-white/20 font-bold tracking-wider scale-y-75"}>CODE0 RUNTIME</p>
            <p className={"z-50 absolute top-14 -right-3 font-mono text-[6px] text-white/20 font-bold tracking-wider rotate-90 scale-y-75"}>BUILD FOR BACKENDS</p>
            <p className={"z-50 absolute bottom-4 left-11 font-mono text-[6px] text-white/20 font-bold tracking-wider rotate-180 scale-y-75"}>EST. 2023</p>
            <p className={"z-50 absolute top-14 -left-1 font-mono text-[6px] text-white/20 font-bold tracking-wider rotate-270 scale-y-75"}>COMPUTE POWER</p>

            <Image src={"/code0_logo_transparent.png"} width={"120"} height={"120"} alt={"Code0 Logo"} className={"z-50 absolute shadow-2xl opacity-80 object-contain"}/>

            <div
                className="absolute inset-0 z-50 w-24 h-24 top-3 left-3 pointer-events-none"
                style={{
                    backgroundImage: `
                                    repeating-linear-gradient(-40deg, 
                                      rgba(255, 255, 255, 0.1) 13px, 
                                      rgba(255, 255, 255, 0.1) 14px, 
                                      transparent 3px, 
                                      transparent 24px
                                    )
                                  `,
                }}
            />

            <svg
                width={120}
                height={120}
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
            >
                {/* Outer chip border */}
                <rect
                    x="10"
                    y="10"
                    width="100"
                    height="100"
                    rx="8"
                    className="stroke stroke-white/20 fill-primary z-0 shadow-xl"
                />

                {/* Circuit traces - horizontal */}
                <g opacity="0.8">
                    <line x1="20" y1="30" x2="100" y2="30" stroke="url(#traceGradient)" strokeWidth="1" />
                    <line x1="20" y1="40" x2="80" y2="40" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="40" y1="50" x2="100" y2="50" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="20" y1="60" x2="90" y2="60" stroke="url(#traceGradient)" strokeWidth="1" />
                    <line x1="30" y1="70" x2="100" y2="70" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="20" y1="80" x2="85" y2="80" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="35" y1="90" x2="100" y2="90" stroke="url(#traceGradient)" strokeWidth="1" />
                </g>

                {/* Circuit traces - vertical */}
                <g opacity="0.8">
                    <line x1="30" y1="20" x2="30" y2="100" stroke="url(#traceGradient)" strokeWidth="1" />
                    <line x1="45" y1="20" x2="45" y2="85" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="60" y1="35" x2="60" y2="100" stroke="url(#traceGradient)" strokeWidth="0.8" />
                    <line x1="75" y1="20" x2="75" y2="95" stroke="url(#traceGradient)" strokeWidth="1" />
                    <line x1="90" y1="25" x2="90" y2="100" stroke="url(#traceGradient)" strokeWidth="0.8" />
                </g>

                {/* Pin connectors */}
                <g>
                    {/* Top pins */}
                    <rect x="25" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="35" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="45" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="55" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="65" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="75" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="85" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="95" y="8" width="3" height="4" rx="0.5" className={"fill-white/50"} />

                    {/* Bottom pins */}
                    <rect x="25" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="35" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="45" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="55" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="65" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="75" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="85" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />
                    <rect x="95" y="108" width="3" height="4" rx="0.5" className={"fill-white/50"} />

                    {/* Left pins */}
                    <rect x="8" y="25" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="35" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="45" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="55" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="65" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="75" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="85" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="8" y="95" width="4" height="3" rx="0.5" className={"fill-white/50"} />

                    {/* Right pins */}
                    <rect x="108" y="25" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="35" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="45" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="55" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="65" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="75" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="85" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                    <rect x="108" y="95" width="4" height="3" rx="0.5" className={"fill-white/50"} />
                </g>

                {/* Gradients */}
                <defs>
                    <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.15 0.05 220)" />
                        <stop offset="50%" stopColor="oklch(0.12 0.03 220)" />
                        <stop offset="100%" stopColor="oklch(0.08 0.02 220)" />
                    </linearGradient>

                    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.4 0.15 220)" />
                        <stop offset="100%" stopColor="oklch(0.25 0.1 220)" />
                    </linearGradient>

                    <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="oklch(0.65 0.25 220)" />
                        <stop offset="50%" stopColor="oklch(0.55 0.3 180)" />
                        <stop offset="100%" stopColor="oklch(0.65 0.25 220)" />
                    </linearGradient>

                    <radialGradient id="pointGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="oklch(0.8 0.3 180)" />
                        <stop offset="100%" stopColor="oklch(0.6 0.25 220)" />
                    </radialGradient>

                    <linearGradient id="processorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.2 0.1 220)" />
                        <stop offset="50%" stopColor="oklch(0.15 0.08 220)" />
                        <stop offset="100%" stopColor="oklch(0.1 0.05 220)" />
                    </linearGradient>

                    <linearGradient id="processorBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.5 0.2 220)" />
                        <stop offset="100%" stopColor="oklch(0.3 0.15 220)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}
