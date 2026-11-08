// The exact script @stripe/stripe-js injects (ORIGIN + RELEASE_TRAIN + "/stripe.js" in its pure.js). Preloading any other
// URL would download Stripe twice, so a test compares it with the installed package on every upgrade.
export const STRIPE_JS_URL = "https://js.stripe.com/dahlia/stripe.js"
