interface RecordLike {
    [key: string]: unknown
}

function isRecord(value: unknown): value is RecordLike {
    return typeof value === "object" && value !== null
}

function normalizeUploadNodeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return undefined
    }

    if (!isRecord(value)) return value

    const id = value.id
    if (typeof id === "number" || typeof id === "string") {
        return id
    }

    return value
}

function sanitizeNode(node: unknown): unknown {
    if (Array.isArray(node)) {
        return node.map(sanitizeNode)
    }

    if (!isRecord(node)) {
        return node
    }

    const nextNode: RecordLike = {}

    for (const [key, value] of Object.entries(node)) {
        if (key === "value") {
            const nodeType = typeof node.type === "string" ? node.type : ""
            if (nodeType === "upload") {
                const normalizedValue = normalizeUploadNodeValue(value)
                if (normalizedValue !== undefined) {
                    nextNode[key] = normalizedValue
                }
            } else {
                nextNode[key] = sanitizeNode(value)
            }
            continue
        }

        nextNode[key] = sanitizeNode(value)
    }

    return nextNode
}

export function sanitizeLexicalUploadValues<T>(value: T): T {
    return sanitizeNode(value) as T
}
