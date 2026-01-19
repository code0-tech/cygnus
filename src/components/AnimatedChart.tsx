'use client'

import React, { useState, useEffect } from 'react'
import { motion, animate } from 'framer-motion'

function Counter({ from, to, duration }: {from: number, to: number, duration: number}) {
    const [value, setValue] = useState(from)

    useEffect(() => {
        const controls = animate(from, to, {
            duration,
            onUpdate: (latest) => {
                setValue(Math.round(latest))
            },
        })
        return () => controls.stop()
    }, [from, to, duration])

    return <>{value}</>
}

export const AnimatedChart: React.FC = () => {
    const [show, setShow] = useState(true)
    const maxValue = 200
    const competitorsValue = 123
    const codezeroValue = 42

    useEffect(() => {
        const interval = setInterval(() => {
            setShow(false) // Animate out
            setTimeout(() => {
                setShow(true) // Animate in
            }, 2000) // Duration of out animation
        }, 12500)

        return () => clearInterval(interval)
    }, [])

    const barTransition = { duration: 2, ease: [0.22, 1, 0.36, 1] as const }
    const textTransition = { duration: 1 }

    return (
        <div className="flex h-full w-full items-end justify-center gap-8">
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <motion.span
                    animate={{ opacity: show ? 1 : 0, y: show ? 0 : -20 }}
                    transition={textTransition}
                    className="text-lg font-semibold text-white/70"
                >
                    {show ? <Counter from={0} to={competitorsValue} duration={2} /> : competitorsValue}ms
                </motion.span>
                <motion.div
                    className="relative w-full overflow-hidden rounded-t-md bg-linear-to-t from-white/50 to-white/70"
                    animate={{ height: show ? `${(competitorsValue / maxValue) * 100}%` : '0%' }}
                    transition={barTransition}
                >
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px)',
                            backgroundSize: '200% 200%',
                        }}
                        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </motion.div>
                <span className="text-sm text-white/70">Other runtimes</span>
            </div>

            <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <motion.span
                    animate={{ opacity: show ? 1 : 0, y: show ? 0 : -20 }}
                    transition={textTransition}
                    className="text-lg font-semibold text-brand"
                >
                    {show ? <Counter from={0} to={codezeroValue} duration={2} /> : codezeroValue}ms
                </motion.span>
                <motion.div
                    className="relative w-full overflow-hidden rounded-t-md bg-linear-to-t from-brand/70 to-brand"
                    animate={{ height: show ? `${(codezeroValue / maxValue) * 100}%` : '0%' }}
                    transition={barTransition}
                >
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.05) 10px, rgba(255, 255, 255, 0.05) 20px)',
                            backgroundSize: '200% 200%',
                        }}
                        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </motion.div>
                <span className="text-sm text-white/80">CodeZero-Runtime</span>
            </div>
        </div>
    )
}
