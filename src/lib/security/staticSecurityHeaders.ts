export const staticSecurityHeaders = [
    {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    // Browsers ignore HSTS on plain-HTTP responses, so local development is unaffected. Subdomains and
    // preload are left out until every code0 subdomain is confirmed to serve HTTPS.
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000",
    },
    // Only features the site never uses. payment stays at its default so Stripe's iframes can still offer
    // Apple Pay and Google Pay; clipboard and fullscreen stay available to the embedded playground.
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), usb=(), midi=(), browsing-topics=()",
    },
]
