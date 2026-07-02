import "server-only"

const MAX_REQUEST_BYTES = 16 * 1024
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 5000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ValidationResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ContactSubmission {
    name: string
    email: string
    message: string
}

export interface JobApplicationSubmission {
    name: string
    email: string
    text: string
}

function failure<T>(error: string): ValidationResult<T> {
    return { success: false, error }
}

async function readJsonObject(request: Request): Promise<ValidationResult<Record<string, unknown>>> {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    if (contentType !== "application/json") {
        return failure("Content-Type must be application/json.")
    }

    const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
        return failure("Request body is too large.")
    }

    let rawBody: string
    try {
        rawBody = await request.text()
    } catch {
        return failure("Unable to read request body.")
    }

    if (!rawBody || new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
        return failure(rawBody ? "Request body is too large." : "Request body is required.")
    }

    try {
        const value: unknown = JSON.parse(rawBody)
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return failure("Request body must be a JSON object.")
        }

        return { success: true, data: value as Record<string, unknown> }
    } catch {
        return failure("Request body contains invalid JSON.")
    }
}

function requiredString(body: Record<string, unknown>, field: string, label: string, maxLength: number): ValidationResult<string> {
    const value = body[field]
    if (typeof value !== "string") {
        return failure(`${label} is required.`)
    }

    const normalized = value.trim()
    if (!normalized) {
        return failure(`${label} is required.`)
    }

    if (normalized.length > maxLength) {
        return failure(`${label} must not exceed ${maxLength} characters.`)
    }

    return { success: true, data: normalized }
}

function validateSharedFields(body: Record<string, unknown>): ValidationResult<{ name: string; email: string }> {
    const name = requiredString(body, "name", "Name", MAX_NAME_LENGTH)
    if (!name.success) return name
    if (/[\r\n]/.test(name.data)) return failure("Name must be a single line.")

    const email = requiredString(body, "email", "Email", MAX_EMAIL_LENGTH)
    if (!email.success) return email
    if (!EMAIL_PATTERN.test(email.data)) return failure("Email must be valid.")

    if (body.acceptTerms !== true) {
        return failure("Terms must be accepted.")
    }

    return { success: true, data: { name: name.data, email: email.data } }
}

export async function validateContactSubmission(request: Request): Promise<ValidationResult<ContactSubmission>> {
    const parsed = await readJsonObject(request)
    if (!parsed.success) return parsed

    const shared = validateSharedFields(parsed.data)
    if (!shared.success) return shared

    const message = requiredString(parsed.data, "message", "Message", MAX_MESSAGE_LENGTH)
    if (!message.success) return message

    return {
        success: true,
        data: { ...shared.data, message: message.data },
    }
}

export async function validateJobApplicationSubmission(request: Request): Promise<ValidationResult<JobApplicationSubmission>> {
    const parsed = await readJsonObject(request)
    if (!parsed.success) return parsed

    const shared = validateSharedFields(parsed.data)
    if (!shared.success) return shared

    const text = requiredString(parsed.data, "text", "Message", MAX_MESSAGE_LENGTH)
    if (!text.success) return text

    return {
        success: true,
        data: { ...shared.data, text: text.data },
    }
}
