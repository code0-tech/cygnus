import config from "@/payload.config"
import { getPayload } from "payload"
import { NextResponse } from "next/server"
import { createSmtpTransporter } from "@/lib/smtp"
import {
    EMAIL_REGEX,
    createRateLimitChecker,
    escapeHtml,
    getClientIdentifier,
    getRateLimitConfig,
} from "@/lib/smtp"

export const runtime = "nodejs"

type JobApplicationPayload = {
    name: string
    email: string
    text: string
}

const MAX_NAME_LENGTH = 120
const MAX_EMAIL_LENGTH = 254
const MAX_TEXT_LENGTH = 5000

const checkRateLimit = createRateLimitChecker(
    getRateLimitConfig("JOBS_RATE_LIMIT_MAX", "JOBS_RATE_LIMIT_WINDOW_SECONDS")
)

const parsePayload = (raw: unknown): JobApplicationPayload | null => {
    if (!raw || typeof raw !== "object") return null

    const candidate = raw as Partial<Record<keyof JobApplicationPayload, unknown>>
    const name = typeof candidate.name === "string" ? candidate.name.trim() : ""
    const email = typeof candidate.email === "string" ? candidate.email.trim() : ""
    const text = typeof candidate.text === "string" ? candidate.text.trim() : ""

    if (!name || !email || !text) return null
    if (!EMAIL_REGEX.test(email)) return null
    if (name.length > MAX_NAME_LENGTH || email.length > MAX_EMAIL_LENGTH || text.length > MAX_TEXT_LENGTH) return null

    return { name, email, text }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const jobSlug = slug?.trim()
    if (!jobSlug) {
        return new Response("Ungueltiger Job-Slug.", { status: 400 })
    }

    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId)
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
        const cms = await getPayload({ config })
        const jobResult = await cms.find({
            collection: "jobs",
            where: {
                slug: {
                    equals: jobSlug,
                },
            },
            limit: 1,
            pagination: false,
        })

        const job = jobResult.docs[0]
        if (!job) {
            return new Response("Job nicht gefunden.", { status: 404 })
        }

        const toEmail = (process.env.JOBS_TO_EMAIL?.trim() || process.env.CONTACT_TO_EMAIL?.trim() || "").trim()
        const fromEmail = (process.env.JOBS_FROM_EMAIL?.trim() || process.env.CONTACT_FROM_EMAIL?.trim() || "").trim()
        const transporter = createSmtpTransporter()

        await transporter.sendMail({
            from: fromEmail,
            to: toEmail,
            subject: `Neue Bewerbung fuer ${job.title} (${jobSlug})`,
            replyTo: payload.email,
            text: [
                "Neue Job-Bewerbung",
                "",
                `Job: ${job.title}`,
                `Slug: ${jobSlug}`,
                "",
                `Name: ${payload.name}`,
                `E-Mail: ${payload.email}`,
                "",
                "Text:",
                payload.text,
            ].join("\n"),
            html: `
                <h2>Neue Job-Bewerbung</h2>
                <p><strong>Job:</strong> ${escapeHtml(String(job.title))}</p>
                <p><strong>Slug:</strong> ${escapeHtml(jobSlug)}</p>
                <hr />
                <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
                <p><strong>E-Mail:</strong> ${escapeHtml(payload.email)}</p>
                <p><strong>Text:</strong></p>
                <p>${escapeHtml(payload.text).replace(/\n/g, "<br />")}</p>
            `,
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error("Jobs route error:", error)
        return new Response("Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es spaeter erneut.", { status: 500 })
    }
}
