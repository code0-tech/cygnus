import React from "react"

export const DemoSection: React.FC = () => {
    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full border-y border-white/10"}>
            <div className={""}>
                <div className="h-full w-full relative text-white">
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                    repeating-linear-gradient(-40deg, 
                                      rgba(255, 255, 255, 0.05) 11px, 
                                      rgba(255, 255, 255, 0.05) 12px, 
                                      transparent 12px, 
                                      transparent 24px
                                    )
                                  `,
                        }}
                    />
                </div>
            </div>
            <div className={"border border-white/10 aspect-video bg-white/10 w-full"}/>
            <div className={""}>
                <div className="h-full w-full relative text-white">
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                    repeating-linear-gradient(-40deg, 
                                      rgba(255, 255, 255, 0.05) 11px, 
                                      rgba(255, 255, 255, 0.05) 12px, 
                                      transparent 12px, 
                                      transparent 24px
                                    )
                                  `,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}