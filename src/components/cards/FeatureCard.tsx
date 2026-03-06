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

        </div>
    )
}
