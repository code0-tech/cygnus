import { ImageResponse } from "@takumi-rs/image-response"
import { generate, getImageResponseOptions } from "./generate"
import { notFound } from "next/navigation"

export const revalidate = false

type RouteContext = {
    params: Promise<{ slug: string[] }>
}

const DEFAULT_OG_TITLE = "Revolutionize the backend development"

export async function GET(req: Request, _ctx: RouteContext) {
    const { slug } = await _ctx.params
    const page = slug.slice(0, -1)
    if (!page) notFound()

    const backgroundSrc = new URL("/code0_rainbow.png", req.url).toString()
    const options = await getImageResponseOptions()

    return new ImageResponse(generate({ title: DEFAULT_OG_TITLE, backgroundSrc }), options)
}
