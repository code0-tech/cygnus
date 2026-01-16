"use client"

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconDatabase, IconApi, IconBrandStripe } from "@tabler/icons-react";
import { cn } from "@/utils/cn";

const adapters = [
  {
    id: 1,
    title: "Database",
    description: "Connect to any SQL or NoSQL database.",
    icon: <IconDatabase size={48} />,
  },
  {
    id: 2,
    title: "REST API",
    description: "Integrate with any third-party REST API.",
    icon: <IconApi size={48} />,
  },
  {
    id: 3,
    title: "Stripe",
    description: "Process payments with the Stripe API.",
    icon: <IconBrandStripe size={48} />,
  },
];

export const AdapterCard: React.FC = () => {
    const t = useTranslations("FeatureSection")
    const [selectedId, setSelectedId] = useState<number | null>(null)

    return (
        <div className={"flex flex-col justify-between items-center overflow-hidden gap-4 p-4 h-[420px] col-span-3 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>
            <div className={"flex flex-col gap-1 text-center"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("adapterTitle")}
                </p>
                <p className={"text-white/50 text-sm max-w-md"}>
                    {t("adapterDescription")}
                </p>
            </div>

            <div className="w-full flex justify-center items-center gap-4 h-full">
                {adapters.map(adapter => (
                    <motion.div
                        layout
                        key={adapter.id}
                        onClick={() => setSelectedId(selectedId === adapter.id ? null : adapter.id)}
                        className={cn(
                            "relative cursor-pointer rounded-lg p-4",
                            selectedId === adapter.id ? "w-3/5" : "w-1/5",
                            "h-2/3 bg-white/5 border border-white/10 flex items-center overflow-hidden",
                            selectedId === adapter.id ? "justify-start" : "justify-center"
                        )}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <motion.div layout>
                            {adapter.icon}
                        </motion.div>

                        <AnimatePresence mode="wait">
                        {selectedId === adapter.id && (
                            <motion.div
                                className="absolute left-24 text-left"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.2 } }}
                                exit={{ opacity: 0, transition: { duration: 0.01 } }}
                            >
                                <h3 className="text-white text-lg font-bold">{adapter.title}</h3>
                                <p className="text-white/75 mt-2 text-sm max-w-xs">{adapter.description}</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
