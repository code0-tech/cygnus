export function decodeLicenseRouteId(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

export function getNamespaceDisplayId(value?: string) {
    if (!value) return undefined

    const normalizedValue = value.trim().replace(/\/+$/, "")
    return normalizedValue.split("/").at(-1) || normalizedValue
}
