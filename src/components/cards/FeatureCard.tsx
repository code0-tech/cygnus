"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

export function FeatureCard({children, className, contentClassName}: {children: ReactNode, className?: string, contentClassName?: string}) {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentRef = cardRef.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(currentRef);
                }
            },
            { rootMargin: "100px" }
        );

        observer.observe(currentRef);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={cardRef} className={cn("relative h-full overflow-hidden bg-linear-to-br from-white/5 to-primary rounded-xl ring ring-white/10 shadow-md", className)}>
            <div className={cn("absolute inset-0 z-10 flex flex-col justify-start items-center gap-4 p-4", contentClassName)}>
                {children}
            </div>
            {isVisible && (
                <>
                    <div
                        className="
                            pointer-events-none
                            absolute -inset-12
                            opacity-25 blur-lg
                            will-change-filter
                            [background:radial-gradient(circle_at_top,rgba(112,255,179,0.3),transparent_45%)]
                        "
                    />
                    <div className="h-full w-full relative opacity-4">
                        <div
                            className="absolute -inset-2 z-0"
                            style={{
                                backgroundImage: `
                                linear-gradient(to right, #e7e5e4 1px, transparent 1px),
                                linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
                                `,
                                backgroundSize: "20px 20px",
                                backgroundPosition: "0 0, 0 0",
                                maskImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+PC9zdmc+")`,
                                WebkitMaskImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+PC9zdmc+")`,
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
