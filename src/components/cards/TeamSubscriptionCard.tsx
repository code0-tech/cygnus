"use client"

import Image from "next/image"
import { FeatureCard } from "./FeatureCard"

export function TeamSubscriptionCard() {
    return (
        <FeatureCard className="col-span-1 md:col-span-1 row-span-1">
            <div className="w-full h-full flex items-center gap-2 p-3 bg-primary/10 border border-white/10 rounded-md">
                <Image src="/code0_logo_color.png" alt="CodeZero Logo" height={48} width={48} />
                <div className="w-full inline-flex items-center gap-2 rounded-full bg-yellow/20 ring ring-yellow/30 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-yellow" />
                    <p className="text-xs font-semibold font-mono uppercase tracking-[0.08em] text-yellow">Team</p>
                </div>
            </div>
        </FeatureCard>
    )
}
