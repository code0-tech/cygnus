"use client"

import { SwipeCard } from "@/components/cards/SwipeCard"
import { cn } from "@/lib/utils"
import type { SwipeCardsLayoutBlock } from "@/lib/cms"
import { Button } from "@code0-tech/pictor"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { m as motion, type PanInfo } from "motion/react"
import { type TouchEvent as ReactTouchEvent, useRef, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

type SwipeCardItem = NonNullable<SwipeCardsLayoutBlock["cards"]>[number]

interface SwipeCardsClientProps {
    cards: SwipeCardItem[]
}

export function SwipeCardsClient({ cards }: SwipeCardsClientProps) {
    const [focusedIndex, setFocusedIndex] = useState(0)
    const touchStartX = useRef<number | null>(null)
    const handledTouchSwipe = useRef(false)
    const { trigger } = useWebHaptics()

    const handlePrevious = () => {
        trigger("light")
        setFocusedIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
    }

    const handleNext = () => {
        trigger("light")
        setFocusedIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
    }

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (handledTouchSwipe.current) {
            handledTouchSwipe.current = false
            return
        }

        const swipeThreshold = 48

        if (Math.abs(info.offset.x) < swipeThreshold) return

        if (info.offset.x > 0) {
            handlePrevious()
            return
        }

        handleNext()
    }

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        handledTouchSwipe.current = true
        touchStartX.current = event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
        window.setTimeout(() => {
            handledTouchSwipe.current = false
        }, 250)

        if (touchStartX.current === null) return

        const touchEndX = event.changedTouches[0]?.clientX
        if (touchEndX === undefined) return

        const offsetX = touchEndX - touchStartX.current
        touchStartX.current = null

        if (Math.abs(offsetX) < 48) return

        if (offsetX > 0) {
            handlePrevious()
            return
        }

        handleNext()
    }

    return (
        <>
            <div className="relative w-full overflow-hidden">
                <div aria-hidden="true" className="pointer-events-none absolute -inset-y-6 left-0 z-30 w-0 bg-linear-to-r from-primary via-primary/80 to-transparent lg:w-40" />
                <div aria-hidden="true" className="pointer-events-none absolute -inset-y-6 right-0 z-30 w-0 bg-linear-to-l from-primary via-primary/80 to-transparent lg:w-40" />

                <div className="relative flex items-center justify-center gap-4 px-2 md:gap-8">
                    <motion.div
                        className="relative flex w-full items-center justify-center px-0 touch-pan-y"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.08}
                        onDragEnd={handleDragEnd}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="relative flex w-full items-stretch justify-center">
                            <div className="invisible pointer-events-none grid w-full sm:w-[80%] lg:w-[60%]">
                                {cards.map((card, index) => (
                                    <div key={card.id || index} className="col-start-1 row-start-1">
                                        <SwipeCard title={card.title} description={card.description} image={card.image} link={card.link} isFocused className="h-auto" />
                                    </div>
                                ))}
                            </div>
                            {cards.map((card, index) => {
                                const offset = index - focusedIndex
                                const isVisibleMobile = offset === 0
                                const isVisibleDesktop = Math.abs(offset) <= 1

                                return (
                                    <div
                                        key={card.id || index}
                                        className={cn(
                                            "absolute top-0 w-full transition-all duration-500 ease-out",
                                            "left-1/2 w-full sm:w-[80%] lg:w-[60%]",
                                            !isVisibleMobile && "lg:opacity-100 lg:pointer-events-auto opacity-0 pointer-events-none",
                                            !isVisibleDesktop && "lg:opacity-0 lg:pointer-events-none"
                                        )}
                                        style={{
                                            transform: `translateX(calc(-50% + ${offset * 104}%))`,
                                        }}
                                    >
                                        <SwipeCard title={card.title} description={card.description} image={card.image} link={card.link} isFocused={index === focusedIndex} />
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="z-20 flex items-center justify-center gap-4">
                <Button onClick={handlePrevious} variant="filled" className="shrink-0 size-12! rounded-full! p-0!" aria-label="Previous card">
                    <IconChevronLeft className="size-6 mr-0.5" />
                </Button>

                <Button onClick={handleNext} variant="filled" className="shrink-0 size-12! rounded-full! p-0!" aria-label="Next card">
                    <IconChevronRight className="size-6 ml-0.5" />
                </Button>
            </div>
        </>
    )
}
