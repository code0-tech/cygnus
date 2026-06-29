"use client"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { IconAlignLeft, IconChevronDown } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import { useEffect, useReducer, useRef, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

export interface TocHeading {
    id: string
    text: string
    level: 1 | 2 | 3 | 4 | 5 | 6
}

interface TableOfContentsProps {
    headings: TocHeading[]
}

type DesktopMode = "static" | "fixed" | "bottom"
type DesktopStyle = { left: number; width: number; top: number }

interface TocLayoutState {
    isOpen: boolean
    showMobileToc: boolean
    desktopMode: DesktopMode
    desktopStyle: DesktopStyle | null
}

type TocLayoutAction =
    | { type: "setOpen"; isOpen: boolean }
    | { type: "toggleOpen" }
    | { type: "mobileVisibilityChanged"; isVisible: boolean }
    | { type: "desktopPositionChanged"; mode: DesktopMode; style?: DesktopStyle }

const initialTocLayoutState: TocLayoutState = {
    isOpen: false,
    showMobileToc: false,
    desktopMode: "static",
    desktopStyle: null,
}

function tocLayoutReducer(state: TocLayoutState, action: TocLayoutAction): TocLayoutState {
    switch (action.type) {
        case "setOpen":
            return state.isOpen === action.isOpen ? state : { ...state, isOpen: action.isOpen }
        case "toggleOpen":
            return { ...state, isOpen: !state.isOpen }
        case "mobileVisibilityChanged":
            return state.showMobileToc === action.isVisible && !state.isOpen ? state : { ...state, showMobileToc: action.isVisible, isOpen: false }
        case "desktopPositionChanged": {
            const nextStyle = action.style ?? state.desktopStyle
            const styleUnchanged =
                state.desktopStyle === nextStyle ||
                (state.desktopStyle !== null &&
                    nextStyle !== null &&
                    state.desktopStyle.left === nextStyle.left &&
                    state.desktopStyle.width === nextStyle.width &&
                    state.desktopStyle.top === nextStyle.top)

            return state.desktopMode === action.mode && styleUnchanged ? state : { ...state, desktopMode: action.mode, desktopStyle: nextStyle }
        }
    }
}

export function TableOfContents({ headings }: TableOfContentsProps) {
    const { trigger } = useWebHaptics()
    const desktopTopOffset = 96
    const headingScrollOffset = 120

    const [activeIds, setActiveIds] = useState<string[]>([])
    const [barStyle, setBarStyle] = useState({ y: 0, scaleY: 0, opacity: 0 })
    const [layoutState, dispatchLayout] = useReducer(tocLayoutReducer, initialTocLayoutState)
    const { isOpen, showMobileToc, desktopMode, desktopStyle } = layoutState
    const isMobile = useMediaQuery("(max-width: 1023px)")

    const mobileTocRef = useRef<HTMLDivElement>(null)
    const desktopTocRef = useRef<HTMLDivElement>(null)
    const desktopWrapperRef = useRef<HTMLDivElement>(null)
    const desktopContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const elements = headings.map((heading) => document.getElementById(heading.id)).filter((el): el is HTMLElement => el !== null)

        if (!elements.length) return

        const activationOffset = isMobile ? headingScrollOffset + 16 : desktopTopOffset + 24
        const visibleHeadings = new Map<string, number>()

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = (entry.target as HTMLElement).id

                    if (entry.isIntersecting) {
                        visibleHeadings.set(id, entry.boundingClientRect.top)
                    } else {
                        visibleHeadings.delete(id)
                    }
                }

                let nextId = elements[0].id

                if (visibleHeadings.size > 0) {
                    const sortedVisibleIds = Array.from(visibleHeadings.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([id]) => id)

                    nextId = sortedVisibleIds[0]
                } else {
                    for (const element of elements) {
                        if (element.offsetTop <= window.scrollY + activationOffset) {
                            nextId = element.id
                        } else {
                            break
                        }
                    }
                }

                setActiveIds((prev) => (prev[0] === nextId ? prev : [nextId]))
            },
            {
                root: null,
                rootMargin: `-${activationOffset}px 0px -55% 0px`,
                threshold: [0, 1],
            }
        )

        for (const element of elements) {
            observer.observe(element)
        }

        return () => observer.disconnect()
    }, [headings, isMobile])

    useEffect(() => {
        const currentRef = isMobile ? mobileTocRef : desktopTocRef
        if (!currentRef.current) return

        if (!activeIds.length) {
            setBarStyle((prev) => ({ ...prev, opacity: 0 }))
            return
        }

        const listItems = Array.from(currentRef.current.querySelectorAll("[data-toc-item='true']"))
        const activeElements = activeIds.map((id) => listItems.find((item) => item.id === `toc-${id}`)).filter((el): el is HTMLElement => el !== null && el !== undefined)

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

        setBarStyle({ y: top, scaleY: height, opacity: 1 })
    }, [activeIds, isOpen, isMobile])

    useEffect(() => {
        if (!isMobile) {
            dispatchLayout({ type: "mobileVisibilityChanged", isVisible: true })
            return
        }

        let frame = 0

        const handleScrollVisibility = () => {
            if (frame) return

            frame = window.requestAnimationFrame(() => {
                frame = 0

                const shouldShow = window.scrollY > 32
                dispatchLayout({ type: "mobileVisibilityChanged", isVisible: shouldShow })
            })
        }

        handleScrollVisibility()
        window.addEventListener("scroll", handleScrollVisibility, { passive: true })
        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame)
            }
            window.removeEventListener("scroll", handleScrollVisibility)
        }
    }, [isMobile])

    useEffect(() => {
        if (isMobile) {
            dispatchLayout({ type: "desktopPositionChanged", mode: "static" })
            return
        }

        const wrapper = desktopWrapperRef.current
        const container = desktopContainerRef.current
        if (!wrapper || !container) return

        const updateDesktopPosition = () => {
            const wrapperRect = wrapper.getBoundingClientRect()
            const containerHeight = container.offsetHeight
            const wrapperHeight = wrapper.offsetHeight
            const maxTop = Math.max(wrapperHeight - containerHeight, 0)
            const wrapperTop = window.scrollY + wrapperRect.top
            const fixedTop = window.scrollY + desktopTopOffset

            const nextMode = fixedTop <= wrapperTop ? "static" : fixedTop >= wrapperTop + maxTop ? "bottom" : "fixed"

            dispatchLayout({
                type: "desktopPositionChanged",
                mode: nextMode,
                style: { left: wrapperRect.left, width: wrapperRect.width, top: maxTop },
            })
        }

        updateDesktopPosition()

        const resizeObserver = new ResizeObserver(updateDesktopPosition)
        resizeObserver.observe(wrapper)
        resizeObserver.observe(container)

        window.addEventListener("scroll", updateDesktopPosition, { passive: true })
        window.addEventListener("resize", updateDesktopPosition)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("scroll", updateDesktopPosition)
            window.removeEventListener("resize", updateDesktopPosition)
        }
    }, [desktopTopOffset, isMobile])

    if (!headings.length) return null

    return (
        <>
            <AnimatePresence initial={false}>
                {showMobileToc && (
                    <motion.div
                        className="fixed left-0 right-0 top-18 z-50 px-4 lg:hidden md:px-[20%]"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="mx-auto w-[calc(100%-1rem)] max-w-7xl">
                            <div className="rounded-2xl border border-white/5 bg-primary/50 p-1.5 backdrop-blur-lg">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-secondary transition-colors hover:bg-white/10 hover:text-white"
                                    onClick={() => {
                                        trigger("soft")
                                        dispatchLayout({ type: "toggleOpen" })
                                    }}
                                    aria-expanded={isOpen}
                                    aria-controls="mobile-toc-panel"
                                >
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <IconAlignLeft size={16} />
                                        Content
                                    </span>
                                    <IconChevronDown size={16} className={cn("text-secondary transition-transform", isOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            layout
                                            id="mobile-toc-panel"
                                            ref={mobileTocRef}
                                            className="relative overflow-hidden py-2"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                        >
                                            <div className="absolute bottom-2 top-2 w-px bg-white/20" style={{ left: "11px" }} />
                                            <motion.div
                                                className="absolute top-0 w-px origin-top bg-white will-change-transform"
                                                animate={barStyle}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                style={{ left: "11px", height: 1 }}
                                            />
                                            {headings.map((heading) => (
                                                <div key={heading.id} id={`toc-${heading.id}`} data-toc-item="true">
                                                    <a
                                                        href={`#${heading.id}`}
                                                        onClick={() => {
                                                            trigger("light")
                                                            dispatchLayout({ type: "setOpen", isOpen: false })
                                                        }}
                                                        className={cn(
                                                            "ml-5 block rounded-xl py-1.5 pl-4 pr-3 text-sm text-tertiary transition-colors hover:bg-white/10 hover:text-white",
                                                            heading.level >= 3 && "pl-8",
                                                            activeIds.includes(heading.id) && "text-white"
                                                        )}
                                                    >
                                                        {heading.text}
                                                    </a>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={desktopWrapperRef} className="relative hidden h-full lg:block lg:w-52">
                <div
                    ref={desktopContainerRef}
                    className={cn("max-h-[calc(100vh-8rem)] overflow-y-auto", desktopMode === "fixed" && "fixed z-30", desktopMode === "bottom" && "absolute left-0 right-0")}
                    style={
                        desktopMode === "fixed" && desktopStyle
                            ? {
                                  top: `${desktopTopOffset}px`,
                                  left: `${desktopStyle.left}px`,
                                  width: `${desktopStyle.width}px`,
                              }
                            : desktopMode === "bottom" && desktopStyle
                              ? { top: `${desktopStyle.top}px` }
                              : undefined
                    }
                >
                    <div className="flex items-start gap-2">
                        <IconAlignLeft size={20} />
                        <h3 className="mb-2 text-sm font-semibold">Content</h3>
                    </div>
                    <div ref={desktopTocRef} className="relative border-l border-white/20 ml-1">
                        <motion.div
                            className="absolute top-0 w-px origin-top bg-white will-change-transform"
                            animate={barStyle}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ left: "-1.5px", height: 1 }}
                        />
                        {headings.map((heading) => (
                            <div key={heading.id} id={`toc-${heading.id}`} data-toc-item="true">
                                <a
                                    href={`#${heading.id}`}
                                    className={cn(
                                        "block py-1 pl-4 text-sm text-tertiary transition-colors hover:text-white",
                                        heading.level >= 3 && "pl-7",
                                        activeIds.includes(heading.id) && "text-white"
                                    )}
                                >
                                    {heading.text}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
