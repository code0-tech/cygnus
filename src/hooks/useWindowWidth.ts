import { useState, useEffect } from "react"

export function useWindowWidth() {
    const [width, setWidth] = useState<number>(
        typeof window !== "undefined" ? window.innerWidth : 0
    )

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)

        handleResize()

        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return width
}
