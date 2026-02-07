import Aurora from "@/components/Aurora"
import {BlogPost} from "@/components/BlogPost"
import { LandingContainer } from "@/components/LandingContainer"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    return (
        <LandingContainer className="py-[10%]">
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
        </LandingContainer>
    )
}

export function generateStaticParams() {
    return [{ slug: 'features' }, { slug: 'integrations' }, { slug: 'security' }]
}

export const dynamicParams = false
