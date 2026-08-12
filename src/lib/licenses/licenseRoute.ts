export function decodeLicenseRouteId(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}
