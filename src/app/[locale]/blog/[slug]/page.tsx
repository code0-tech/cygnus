import {AuroraBackground} from "@code0-tech/pictor"
import {BlogPost} from "@/components/BlogPost"
import { LandingContainer } from "@/components/LandingContainer"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    return (
        <LandingContainer className="py-[10%]">
            <AuroraBackground/>
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
