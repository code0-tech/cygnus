import {
    EMAIL_REGEX,
    createRateLimitChecker,
    escapeHtml,
    getClientIdentifier,
    getRateLimitConfig
} from "@/lib/smtp"
import { createSmtpTransporter } from "@/lib/smtp"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type ContactPayload = {
    name: string
    email: string
    message: string
}

const parsePayload = (raw: unknown): ContactPayload | null => {
    if (!raw || typeof raw !== "object") return null

    const candidate = raw as Partial<Record<keyof ContactPayload, unknown>>
    const name = typeof candidate.name === "string" ? candidate.name.trim() : ""
    const email = typeof candidate.email === "string" ? candidate.email.trim() : ""
    const message = typeof candidate.message === "string" ? candidate.message.trim() : ""

    if (!name || !email || !message) return null
    if (!EMAIL_REGEX.test(email)) return null
    if (name.length > 120 || email.length > 254 || message.length > 5000) return null

    return { name, email, message }
}

const checkContactRateLimit = createRateLimitChecker(
    getRateLimitConfig("CONTACT_RATE_LIMIT_MAX", "CONTACT_RATE_LIMIT_WINDOW_SECONDS")
)

export async function POST(req: Request) {
    const clientId = getClientIdentifier(req)
    const rateLimit = checkContactRateLimit(clientId)

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Zu viele Anfragen. Bitte spaeter erneut versuchen." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfterSeconds),
                },
            }
        )
    }

    const payload = parsePayload(await req.json().catch(() => null))
    if (!payload) {
        return new Response("Ungueltige Anfrage. Bitte pruefen Sie Ihre Eingaben.", { status: 400 })
    }

    try {
        const toEmail = (process.env.JOBS_TO_EMAIL?.trim() || process.env.CONTACT_TO_EMAIL?.trim() || "").trim()
        const fromEmail = (process.env.JOBS_FROM_EMAIL?.trim() || process.env.CONTACT_FROM_EMAIL?.trim() || "").trim()
        const transporter = createSmtpTransporter()

        await transporter.sendMail({
            from: fromEmail,
            to: toEmail,
            subject: `Neue Kontaktanfrage von ${payload.name}`,
            replyTo: payload.email,
            text: [
                "Neue Kontaktanfrage",
                "",
                `Name: ${payload.name}`,
                `E-Mail: ${payload.email}`,
                "",
                "Nachricht:",
                payload.message,
            ].join("\n"),
            html: `
                <h2>Neue Kontaktanfrage</h2>
                <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
                <p><strong>E-Mail:</strong> ${escapeHtml(payload.email)}</p>
                <p><strong>Nachricht:</strong></p>
                <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
            `,
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error("Contact route error:", error)
        return new Response("Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es spaeter erneut.", {
            status: 500,
        })
    }
}
