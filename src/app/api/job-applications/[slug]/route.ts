import { getPayloadClient } from "@/lib/payloadClient"
import { validateJobApplicationSubmission } from "@/lib/formSubmissions"
import {
    createRateLimitChecker,
    escapeHtml,
    getClientIdentifier,
    getRateLimitConfig,
} from "@/lib/smtp"
import { NextResponse } from "next/server"

const checkRateLimit = createRateLimitChecker(
    getRateLimitConfig("JOBS_RATE_LIMIT_MAX", "JOBS_RATE_LIMIT_WINDOW_SECONDS")
)

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const jobSlug = slug?.trim()
    if (!jobSlug || jobSlug.length > 200 || /[\r\n]/.test(jobSlug)) {
        return new Response("Invalid job slug.", { status: 400 })
    }

    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId)
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

    const validation = await validateJobApplicationSubmission(req)
    if (!validation.success) return new Response(validation.error, { status: 400 })

    try {
        const payload = validation.data
        const cms = await getPayloadClient()
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
            return new Response("Job not found.", { status: 404 })
        }


        await cms.sendEmail({
            to: process.env.CONTACT_FROM_EMAIL,
            subject: `New application for ${job.title} (${jobSlug})`,
            replyTo: payload.email,
            text: [
                "New job application",
                "",
                `Job: ${job.title}`,
                `Slug: ${jobSlug}`,
                "",
                `Name: ${payload.name}`,
                `Email: ${payload.email}`,
                "",
                "Text:",
                payload.text,
            ].join("\n"),
            html: `
                <h2>New job application</h2>
                <p><strong>Job:</strong> ${escapeHtml(String(job.title))}</p>
                <p><strong>Slug:</strong> ${escapeHtml(jobSlug)}</p>
                <hr />
                <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
                <p><strong>Text:</strong></p>
                <p>${escapeHtml(payload.text).replace(/\n/g, "<br />")}</p>
            `,
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error("Job applications route error:", error)
        return new Response("An error occurred while sending. Please try again later.", { status: 500 })
    }
}
