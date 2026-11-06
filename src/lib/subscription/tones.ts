import type { IconColor } from "@/lib/cms"

// The accent a plan carries in the CMS; shared by the checkout summary badges and the license upgrade benefits.
export const TONE_CLASS_NAME: Record<IconColor, string> = {
    neutral: "border-white/10! bg-white/10! text-white!",
    brand: "border-brand/10! bg-brand/10! text-brand!",
    aqua: "border-aqua/10! bg-aqua/10! text-aqua!",
    blue: "border-blue/10! bg-blue/10! text-blue!",
    pink: "border-pink/10! bg-pink/10! text-pink!",
    yellow: "border-yellow/10! bg-yellow/10! text-yellow!",
    lime: "border-lime/10! bg-lime/10! text-lime!",
    magenta: "border-magenta/10! bg-magenta/10! text-magenta!",
}
