import { Aurora } from "@/components/Aurora"
import { BlogPost } from "@/components/BlogPost"
import { LandingContainer } from "@/components/LandingContainer"

export default async function Page({params}: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    return (
        <>
            <Aurora/>
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto"}>
                    <BlogPost slug={slug}/>
                </div>
            </LandingContainer>
        </>
    )
}

export function generateStaticParams() {
    return [
        { slug: 'features' },
        { slug: 'integrations' },
        { slug: 'security' }
    ]
}

export const dynamicParams = false
