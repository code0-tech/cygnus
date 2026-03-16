import {
    createRateLimitChecker,
    escapeHtml,
    getClientIdentifier,
    getRateLimitConfig,
} from "@/lib/smtp"
import { getPayloadClient } from "@/lib/payloadClient"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const checkContactRateLimit = createRateLimitChecker(
    getRateLimitConfig("CONTACT_RATE_LIMIT_MAX", "CONTACT_RATE_LIMIT_WINDOW_SECONDS")
)

export async function POST(req: Request) {
    const clientId = getClientIdentifier(req)
    const rateLimit = checkContactRateLimit(clientId)

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfterSeconds),
                },
            }
        )
    }

    const payload = await req.json()
    if (!payload) {
        return new Response("Invalid request. Please check your input.", { status: 400 })
    }

    try {
        const payloadClient = await getPayloadClient()

        await payloadClient.sendEmail({
            to: process.env.CONTACT_TO_EMAIL,
            subject: `New contact request from ${payload.name}`,
            replyTo: payload.email,
            text: [
                "New contact request",
                "",
                `Name: ${payload.name}`,
                `Email: ${payload.email}`,
                "",
                "Message:",
                payload.message,
            ].join("\n"),
            html: `
                <h2>New contact request</h2>
                <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
            `,
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error("Contact route error:", error)
        return new Response("An error occurred while sending. Please try again later.", {
            status: 500,
        })
    }
}
