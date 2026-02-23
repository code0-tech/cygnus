import { NextResponse } from "next/server"

export function POST() {
    return NextResponse.json(
        { error: "Bitte Job-Slug verwenden: POST /api/jobs/{slug}" },
        { status: 400 }
    )
}
