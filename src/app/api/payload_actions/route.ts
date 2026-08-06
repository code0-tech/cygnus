import { getPaginatedActions, type ActionSortOrder, type ActionTag } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { NextRequest, NextResponse } from "next/server"

const ACTION_TAGS: ActionTag[] = [
    "AI",
    "Analytics",
    "Communication",
    "Cybersecurity",
    "Data & Storage",
    "Developer Tools",
    "Development",
    "Finance & Accounting",
    "HITL",
    "Marketing",
    "Miscellaneous",
    "Productivity",
    "Sales",
    "Utility",
]

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const locale = searchParams.get("locale")
    const page = Number(searchParams.get("page") ?? "1")
    const limit = Number(searchParams.get("limit") ?? "18")
    const search = searchParams.get("search")?.trim() ?? ""
    const tagParam = searchParams.get("tag")
    const sortOrder = searchParams.get("sort") ?? "newest"

    if (!locale || !isSupportedLocale(locale)) {
        return NextResponse.json({ error: "Invalid locale." }, { status: 400 })
    }

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || search.length > 256) {
        return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 })
    }

    if ((tagParam && !ACTION_TAGS.includes(tagParam as ActionTag)) || (sortOrder !== "newest" && sortOrder !== "oldest")) {
        return NextResponse.json({ error: "Invalid filter parameters." }, { status: 400 })
    }

    const result = await getPaginatedActions(locale, {
        page,
        limit,
        search,
        tag: (tagParam as ActionTag | null) || null,
        sortOrder: sortOrder as ActionSortOrder,
    })

    return NextResponse.json(result)
}
