import { getBlogPosts } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const locale = searchParams.get("locale")
    const page = Number(searchParams.get("page") ?? "1")
    const limit = Number(searchParams.get("limit") ?? "12")

    if (!locale || !isSupportedLocale(locale)) {
        return NextResponse.json({ error: "Invalid locale." }, { status: 400 })
    }

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
        return NextResponse.json({ error: "Invalid pagination parameters." }, { status: 400 })
    }

    const result = await getBlogPosts(locale, { page, limit })

    return NextResponse.json(result)
}
