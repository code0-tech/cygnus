export type AnimationPreset = "none" | "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in"

export type AnimationConfig = {
    initial: Record<string, number>
    whileInView: Record<string, number>
    transition: { duration: number; ease: "easeOut" | "easeInOut" | "easeIn" }
}

export const ANIMATION_PRESETS: Record<Exclude<AnimationPreset, "none">, AnimationConfig> = {
    "fade-up": {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.65, ease: "easeOut" },
    },
    "fade-in": {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        transition: { duration: 0.6, ease: "easeOut" },
    },
    "slide-left": {
        initial: { opacity: 0, x: 36 },
        whileInView: { opacity: 1, x: 0 },
        transition: { duration: 0.7, ease: "easeOut" },
    },
    "slide-right": {
        initial: { opacity: 0, x: -36 },
        whileInView: { opacity: 1, x: 0 },
        transition: { duration: 0.7, ease: "easeOut" },
    },
    "zoom-in": {
        initial: { opacity: 0, scale: 0.96 },
        whileInView: { opacity: 1, scale: 1 },
        transition: { duration: 0.6, ease: "easeOut" },
    },
}
