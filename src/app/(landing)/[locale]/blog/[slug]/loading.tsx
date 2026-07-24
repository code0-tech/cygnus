import { BlogSkeleton } from "@/components/blog/BlogSkeleton"
import { LandingContainer } from "@/components/ui/LandingContainer"

export default function Loading() {
    return (
        <LandingContainer className="py-[20vh]">
            <div className="w-full max-w-4xl mx-auto">
                <BlogSkeleton />
            </div>
        </LandingContainer>
    )
}
