import { BlogSkeleton } from "@/components/blog/BlogSkeleton"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"

export default function Loading() {
    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <div className="w-full max-w-4xl mx-auto">
                    <BlogSkeleton />
                </div>
            </LandingContainer>
        </>
    )
}
