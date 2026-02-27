"use client"

import { cn } from "@/utils/cn"
import { IconAlignLeft } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

export interface TocHeading {
    id: string
    text: string
    level: 1 | 2 | 3 | 4 | 5 | 6
}

interface TableOfContentsProps {
    headings: TocHeading[]
}

const throttle = (func: () => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastExec = 0

    return () => {
        const elapsed = Date.now() - lastExec
        const execute = () => {
            func()
            lastExec = Date.now()
        }

        if (timeoutId) clearTimeout(timeoutId)

        if (elapsed > delay) {
            execute()
        } else {
            timeoutId = setTimeout(execute, delay - elapsed)
        }
    }
}

export function TableOfContents({ headings }: TableOfContentsProps) {
    const [activeIds, setActiveIds] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const mobileTocRef = useRef<HTMLDivElement>(null)
    const desktopTocRef = useRef<HTMLDivElement>(null)
    const [barStyle, setBarStyle] = useState({ top: 0, height: 0, opacity: 0 })

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 1023px)")
        const handleMediaChange = (e: MediaQueryListEvent | { matches: boolean }) => {
            setIsMobile(e.matches)
            setIsOpen(!e.matches)
        }

        handleMediaChange(mediaQuery)
        mediaQuery.addEventListener("change", handleMediaChange)

        return () => mediaQuery.removeEventListener("change", handleMediaChange)
    }, [])

    useEffect(() => {
        const elements = headings
            .map((heading) => document.getElementById(heading.id))
            .filter((el): el is HTMLElement => el !== null)

        if (!elements.length) return

        const handleScroll = () => {
            const newActiveIds = elements
                .filter((el) => {
                    const rect = el.getBoundingClientRect()
                    const viewportHeight = window.innerHeight
                    const topOffset = viewportHeight * 0.15
                    const bottomOffset = viewportHeight * 0.85
                    return rect.top < bottomOffset && rect.bottom > topOffset
                })
                .map((el) => el.id)

            setActiveIds(newActiveIds)
        }

        const throttledHandler = throttle(handleScroll, 100)
        window.addEventListener("scroll", throttledHandler)
        handleScroll()

        return () => window.removeEventListener("scroll", throttledHandler)
    }, [headings])

    useEffect(() => {
        const currentRef = isMobile ? mobileTocRef : desktopTocRef
        if (!currentRef.current) return

        if (!activeIds.length) {
            setBarStyle((prev) => ({ ...prev, opacity: 0 }))
            return
        }

        const listItems = Array.from(currentRef.current.querySelectorAll("[data-toc-item='true']"))
        const activeElements = activeIds
            .map((id) => listItems.find((item) => item.id === `toc-${id}`))
            .filter((el): el is HTMLElement => el !== null && el !== undefined)

        if (!activeElements.length) {
            setBarStyle((prev) => ({ ...prev, opacity: 0 }))
            return
        }

        const sortedActiveElements = activeElements.sort((a, b) => a.offsetTop - b.offsetTop)
        const firstElement = sortedActiveElements[0]
        const lastElement = sortedActiveElements[sortedActiveElements.length - 1]
        const top = firstElement.offsetTop
        const bottom = lastElement.offsetTop + lastElement.offsetHeight
        const height = bottom - top

        setBarStyle({ top, height, opacity: 1 })
    }, [activeIds, isOpen, isMobile])

    useEffect(() => {
        if (isMobile && isOpen) {
            document.body.style.overflow = "hidden"
            return () => {
                document.body.style.overflow = ""
            }
        }

        document.body.style.overflow = ""
        return undefined
    }, [isMobile, isOpen])

    if (!headings.length) return null

    return (
        <>
            <div className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto ml-1">
                <div className="flex items-start gap-2">
                    <IconAlignLeft size={20}/>
                    <h3 className="mb-2 text-sm font-semibold">Content</h3>
                </div>
                <div ref={desktopTocRef} className="relative border-l border-white/20 ml-1">
                    <div
                        className="absolute w-px bg-white transition-all duration-300 ease-in-out"
                        style={{ left: "-1.5px", ...barStyle }}
                    />
                    {headings.map((heading) => (
                        <div key={heading.id} id={`toc-${heading.id}`} data-toc-item="true">
                            <a
                                href={`#${heading.id}`}
                                className={cn(
                                    "block py-1 pl-4 text-sm text-white/60 transition-colors hover:text-white",
                                    heading.level >= 3 && "pl-7",
                                    activeIds.includes(heading.id) && "text-white",
                                )}
                            >
                                {heading.text}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
