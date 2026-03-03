interface AboutUsPageContent {
    title: string
    description: string
}

interface AboutUsPageClientProps {
    locale: string
    content?: Partial<AboutUsPageContent> | null
}

const defaultContent: AboutUsPageContent = {
    title: "About us",
    description: "Learn more about our team and who we are.",
}

export function AboutUsPageClient({ locale, content }: AboutUsPageClientProps) {
    const labels = { ...defaultContent, ...content }

    return (
        <div className={"md:w-[50vw] mx-auto flex flex-col gap-8"}>
            <h1 className={"text-4xl font-semibold mb-8 text-center"}>{labels.title}</h1>
            <p>{labels.description}</p>
        </div>
    )
}
