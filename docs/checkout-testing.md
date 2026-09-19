# Checkout testing

Run the automated checkout suite first:

```sh
npm run test:checkout
```

The automated suite covers B2C and B2B customer payloads, required contact and tax fields, incomplete and complete Stripe billing addresses, successful and failed confirmation results, discount session replacement, return identifiers, component remounts, and API error rendering.

## Stripe sandbox verification

Use only Stripe sandbox keys and synthetic test data. Start the application with a sandbox Crater instance and complete each scenario through the real Stripe Elements UI.

For every scenario, verify that the browser returns to the localized `/checkout/success?session_id=cs_...` URL, the success page accepts the return identifier, and access is not granted until Crater processes the verified Stripe webhook.

| Scenario | Test data and expected result |
| --- | --- |
| B2C card | Use card `4242 4242 4242 4242`, any future expiry, any CVC, and a complete billing address. Confirmation succeeds and returns to the success page. |
| B2B card | Enter company contact data and a sandbox-valid tax ID, then use card `4242 4242 4242 4242`. The Customer and resulting subscription retain the business customer type. |
| Incomplete address | Leave a required Stripe address field empty. The Payment Element and Payment step remain unavailable. |
| Completed address | Complete all required address fields. The Payment Element appears and the stepper advances to Payment. |
| 3D Secure | Use card `4000 0000 0000 3220`, complete the sandbox authentication challenge, and verify the return to the success page. Repeat once by failing the challenge and verify that no success or entitlement is produced. |
| Redirect method | Enable a redirect-based sandbox payment method such as iDEAL for the Stripe account, authorize it on Stripe's test page, and verify the return URL. Repeat its failure path. |
| Discount | Apply the configured sandbox promotion code before payment. Change and remove it after Elements loads and verify that a new Checkout Session is mounted with the updated total each time. |
| Reload | Reload before confirmation. The local form safely restarts and does not display an unverified success state. |
| Decline | Use card `4000 0000 0000 9995` and verify that Stripe's error is shown without advancing to success. |

Finally, verify in Stripe and Crater that the completed Checkout Session, webhook event, subscription projection, and license state all reference the same customer and checkout configuration.
# Guest checkout isolation

The login choice is always displayed, including for signed-in self-hosted buyers. Guest creation never replaces the account session. Each purchase gets a random `guestCheckout` URL identifier and its own encrypted HttpOnly browser-session cookie. The identifier is not a credential. The existing `PAYLOAD_SECRET` seals the cookie; it must be configured and consistent across application instances.

Guest checkout access has an absolute 24-hour deadline, even if the browser restores session cookies. Requests select the purchase explicitly, so account pages and other tabs retain their own identity. Missing or expired guest credentials never fall back to account credentials. Guest form drafts use sessionStorage, and contain no credentials.

On Crater's verified `READY` response, the cookie loses its profile claim and checkout permissions. For at most another 30 minutes (bounded by the original deadline), it permits only the purchase confirmation and download of the returned license. Reloading does not extend this deadline. A `FAILED` checkout clears the guest cookie; expired cookies are cleared on the next request. No guest is automatically linked to the signed-in account, and the guest confirmation does not link to that account's license dashboard. Profile claiming/account linking remains a separate explicit flow.

Manual checks: keep an account dashboard open, purchase as a guest in another tab, reload checkout, complete a redirect-based payment, download the license, and verify that the original dashboard still uses the account. Repeat with two guest purchases in separate tabs and with an expired guest cookie.
