import React from "react"

export const BrandSection: React.FC = () => {
    return (
        <div className={"flex flex-col gap-8 items-center justify-center my-40"}>
            <p className={"text-xl"}>Trusted by teams who want complex backends</p>
            <div className={"flex items-center justify-center gap-8"}>
                <p className={"text-4xl font-bold"}>Logo1</p>
                <p className={"text-4xl font-bold"}>Logo2</p>
                <p className={"text-4xl font-bold"}>Logo3</p>
                <p className={"text-4xl font-bold"}>Logo4</p>
                <p className={"text-4xl font-bold"}>Logo5</p>
                <p className={"text-4xl font-bold"}>Logo6</p>
            </div>
        </div>
    )
}
