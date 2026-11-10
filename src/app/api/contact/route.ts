import { escapeHtml } from "@/lib/smtp"
import { validateContactSubmission } from "@/lib/formSubmissions"
import { getPayloadClient } from "@/lib/payloadClient"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
    const rateLimited = enforceRateLimit("contact", req)
    if (rateLimited) return rateLimited

    const validation = await validateContactSubmission(req)
    if (!validation.success) return new Response(validation.error, { status: 400 })

    try {
        const payload = validation.data
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
