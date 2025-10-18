import {BlogPost} from "@/components/BlogPost"
import Aurora from "@/components/Aurora"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    return (
        <div className={"relative h-full w-full bg-primary px-[20%] py-32 border-b border-white/5"}>

            <Aurora
                className="absolute top-0 left-0 w-full opacity-10"
                colorStops={["#70ffb3", "#70ffb3", "#70ffb3"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.5}
            />
            <div className={"z-20"}>
                <BlogPost slug={slug}/>
            </div>
        </div>
    )
}

export function generateStaticParams() {
    return [{ slug: 'test' }]
}

export const dynamicParams = false