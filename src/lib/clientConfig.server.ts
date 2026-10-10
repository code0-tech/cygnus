import "server-only"

export function getClientConfig() {
    const stripePublicKey = process.env.STRIPE_PUBLIC_KEY?.trim()
    return {
        gaMeasurementId: process.env.GA_MEASUREMENT_ID?.trim() || undefined,
        stripePublicKey: stripePublicKey?.startsWith("pk_") ? stripePublicKey : null,
        sculptorUrl: process.env.SCULPTOR_URL?.trim() ?? "",
        sculptorLoginUrl: process.env.SCULPTOR_LOGIN_URL?.trim() ?? "",
    }
}
