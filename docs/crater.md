# Crater - Summary

## Overview

Crater is the project's billing service. It provides a GraphQL API and connects the customer, user and session, Stripe checkout, discount and tax, subscription, invoice, and license domains.

The source documentation consists of:

- the [GraphQL schema documentation](docs/graphql/index.md)
- the [database ERD](docs/erd/database-erd.pdf)

## Domain model

### Core relationships

The ERD describes the following relationships:

- A `Customer` has an address and is associated with custom checkout configurations, invoices, subscriptions, and users.
- `Customer` and `User` are connected through `CustomerUser`.
- A `User` has `UserSession` records.
- An `Invoice` consists of `InvoiceItem` entries and points at the `Subscription` it was issued for.
- A `Subscription` forms the basis of a `License`.
- `ProcessedWebhookEvent` separately records incoming Stripe webhook events and uses a unique Stripe event ID to prevent duplicate processing.

### Customer and address

`Customer` represents a billing customer. The data model contains:

- customer type
- lifecycle status, `draft` or `active`
- name, email, and optional phone number
- Stripe customer ID
- Stripe tax ID
- the checkout identity of the checkout that created it: `checkout_key` and `checkout_user_id`

The GraphQL API additionally returns a global ID, the `status`, and creation and update timestamps.

`checkout_user_id` records which user's checkout created the customer and is not the membership; membership stays in `CustomerUser`. Its foreign key uses `ON DELETE SET NULL`, so deleting a user never takes a customer -- and with it its subscriptions, invoices, and licenses -- down with it.

`CustomerAddress` and `CustomerAddressInput` contain:

- `line1` and `line2`
- `city`
- `state`
- `postalCode`
- `country` as a country code

`taxIdType` and `taxIdValue` are optional, including for business customers, because Stripe Checkout can collect a tax ID through its `TaxIdElement`. When one of them is supplied, the other is required as well; a half-filled pair returns `INVALID_CUSTOMER`. A tax ID supplied up front is registered on the Stripe Customer immediately, and one collected during checkout is synced back from the completed session.

Name, email, phone, and address are all optional. A customer can be created with nothing but a `customerType`, because the client collects contact and billing details during checkout through Stripe's `ContactDetailsElement` and `BillingAddressElement` and Crater syncs them back from the completed session. A supplied email must still be well formed. `email` and `name` are therefore nullable in both the database and the GraphQL `Customer` type.

### The customer lifecycle

Stripe Elements needs a Checkout Session, and a Checkout Session needs a Stripe Customer, before the user has entered a single billing field. A customer created for that reason must not become a permanent one when the user then enters nothing or abandons the checkout. `Customer.status` therefore distinguishes two states:

| Status   | Meaning                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `draft`  | Provisional: exists only to carry a running checkout. Hidden from every customer list, dropdown, counter, and the license dashboard. |
| `active` | A checkout for this customer completed. This is the only state a customer is ever shown in.                                          |

The rules around the transition:

- The migration adds the column with the default `1`, which is `active`, so every customer that existed before this change is active. A customer created outside a checkout draft is active immediately, exactly as before.
- A customer moves from `draft` to `active` only through a verified `checkout.session.completed` webhook. Nothing else calls `Customer#activate!`.
- Entering or syncing name, email, phone, address, or tax ID never activates a customer.
- `invoice.paid` and the other events never perform the first activation. Paid access still begins at `invoice.paid`; activation and entitlement are separate things.
- An already active customer stays active. A redelivered webhook changes nothing.
- There is no way back: nothing ever moves a customer from `active` to `draft`.

#### Idempotent draft creation

A draft is identified by the triple of authenticated user, `customerType`, and `checkoutKey`. At most one draft can exist per triple, which is what makes repeated requests, page reloads, and React retries safe:

- `Customers::CreateService` looks the triple up before creating anything and returns the existing customer when it finds one. It looks it up through `user.checkout_customers`, so a checkout key guessed or copied from somebody else never resolves their customer.
- The unique index `index_customers_on_checkout_identity` over `(checkout_user_id, customer_type, checkout_key)` makes this a database guarantee rather than a check-then-act race. Two parallel requests with the same checkout key can only ever produce one draft; the request the database rejects re-reads and returns the winner. Customers created outside a checkout leave both columns `NULL`, and `NULL`s never collide in a unique index.
- The Stripe Customer for a draft is created with the deterministic idempotency key `customer-draft-<user id>-<customer type>-<checkout key>`, so the losing request of a race receives the very same Stripe Customer instead of leaving an orphan behind. Only a Stripe Customer that is genuinely orphaned is deleted again.
- The lookup also matches a customer that has already been activated, so a late retry of a finished checkout returns that customer instead of drafting a second one.
- A draft is linked to its user through `CustomerUser` exactly like any other customer, so `CustomerPolicy` grants `read_customer` on it unchanged. Policies are not relaxed anywhere for drafts.

#### The checkout key

`checkoutKey` is a random, non-sensitive id of one client-side checkout attempt. It is **not** an authentication token and grants nothing on its own: it only scopes a draft within the customers of the already authenticated user. Crater validates it as 16 to 128 characters of `A-Z`, `a-z`, `0-9`, `-`, or `_`; anything else is rejected with `INVALID_CUSTOMER`. A `char_length(checkout_key) <= 128` check constraint backs the upper bound in the database.

The client generates it once per checkout attempt and reuses it across reloads:

```ts
// One key per checkout attempt, stable across reloads and React retries.
function checkoutKey(): string {
    const stored = sessionStorage.getItem("crater.checkoutKey")
    if (stored) return stored

    const bytes = crypto.getRandomValues(new Uint8Array(24))
    const key = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

    sessionStorage.setItem("crater.checkoutKey", key)
    return key
}
```

`sessionStorage` is the right store: the key must survive a reload of the checkout page but must not leak into a later, unrelated checkout. The client clears it (`sessionStorage.removeItem('crater.checkoutKey')`) once the checkout succeeded or the user deliberately starts over, so the next attempt drafts its own customer. Starting a genuinely new checkout with an old key would otherwise reuse the previous customer.

#### Abandoned drafts

`Customers::CleanupDraftsService` removes drafts whose checkout never completed. It is safe to run repeatedly and refuses to delete anything that might still matter:

- Only customers with `status: draft` that are older than `checkout.draft_retention_hours` (default `24`) are considered.
- Each candidate is re-read immediately before deletion, so a checkout that completed between selecting and deleting keeps its now active customer.
- A draft that holds a subscription, an invoice, a license, or a consumed or still usable `CustomCheckoutConfiguration` is skipped regardless of age.
- The Stripe Customer is deleted first and the local row second, so a temporary Stripe failure leaves the pair resolvable for the next run instead of orphaning a Stripe Customer nothing points at.
- A Stripe Customer that another local customer points at, or that Stripe still knows a subscription for, is never deleted.
- A Stripe Customer Stripe has already deleted (`resource_missing`) counts as success, so the local row is cleaned up on the next run.
- Local dependants (`CustomerAddress`, `CustomerUser`) go with the row through their cascading foreign keys.
- Logging is limited to internal ids, Stripe object ids, and counts. Addresses, e-mail addresses, tax ids, and Stripe payloads are never logged.
- It uses the instantiated `StripeClientProvider.client`; no global Stripe API key is configured anywhere.

`Customers::CleanupDraftsJob` runs the service. It is scheduled through GoodJob's cron support in `config/application.rb` and runs hourly at minute 17; the retention, not the schedule, decides what is old enough to remove.

```ruby
config.good_job.enable_cron = true
config.good_job.cron = {
  cleanup_draft_customers: {
    cron: '17 * * * *',
    class: 'Customers::CleanupDraftsJob',
    description: 'Removes checkout draft customers whose checkout was never completed',
  },
}
```

It can also be triggered by hand:

```ruby
Customers::CleanupDraftsJob.perform_later          # through the queue
Customers::CleanupDraftsService.new.execute        # inline, for example from a console
Customers::CleanupDraftsService.new(retention: 1.hour).execute
```

### Users and sessions

`User` contains a global ID, timestamps, an admin flag, and a unique `sagittarius_id` in the data model. Crater deliberately stores only the Sagittarius user ID for this integration; temporary local `email` and `username` fields were removed again. Sessions are returned as a paginated `UserSessionConnection`.

A `UserSession` contains:

- a global session ID
- an `active` status
- the associated user
- timestamps
- a session token, which is only returned when the session is created

Login is now integrated with Sagittarius:

1. An authenticated Sagittarius client obtains a dedicated Crater login token through the Sagittarius `usersCreateCraterToken` mutation.
2. The client passes that value to Crater's anonymous `usersLogin` mutation as `sagittariusToken`.
3. Crater calls Sagittarius's `/graphql` endpoint with `Authorization: Crater-Login <token>` and resolves `currentUser { id }`.
4. Crater finds or creates its local user by the returned Sagittarius ID and creates a fresh `UserSession`.

A blank or rejected token returns `INVALID_SAGITTARIUS_TOKEN`. Connectivity problems, unexpected HTTP responses, or GraphQL errors from Sagittarius return `SAGITTARIUS_UNAVAILABLE`. Failure to persist the local user returns `INVALID_USER`.

Session lists follow the GraphQL connection model with `nodes`, `edges`, cursors, a total count, and `pageInfo`.

### Checkout and Stripe

Crater creates Stripe Checkout Sessions in subscription mode for the current customer. Checkout uses Stripe's embedded Elements/custom UI mode rather than redirecting the customer to a Stripe-hosted Checkout page. A checkout can be based either on a regular internal plan or on an individually negotiated `CustomCheckoutConfiguration`.

The customer a session is created for may be an active customer or a provisional draft, as long as it belongs to the authenticated user through `CustomerUser`. Creating the session neither activates a draft nor creates another customer; see [the customer lifecycle](#the-customer-lifecycle).

A `CheckoutSession` returns:

- the Stripe session ID
- the client secret used by the frontend to initialize Stripe's embedded checkout
- the expiration time as a Unix timestamp

Additional checkout features include:

- previewing the tax Stripe would calculate for a plan
- selecting weekly, monthly, or yearly billing for Pro and Max
- selecting monthly, quarterly, or yearly billing for dynamic custom checkouts
- quantity-based AI Token and Workflow Execution line items for dynamic custom checkouts
- validating Stripe promotion codes
- supporting the `self_hosted` and `cloud` deployment types
- optionally linking a cloud checkout to a Sagittarius namespace ID
- a required, allowlisted return URL for payment methods that temporarily leave the page
- required billing-address collection
- automatic Stripe Tax
- automatic synchronization of the customer's name and address back to Stripe
- attaching the plan, payment period, custom quantities, Crater customer ID, deployment type, customer type, and optional namespace ID to the Stripe subscription metadata

Stripe Price IDs are resolved exclusively on the server from `checkout.prices`. Pro and Max resolve one Price from the plan and payment period. Dynamic custom checkouts additionally use the authenticated customer's type to select B2B or B2C component Prices. This dynamic `plan: custom` flow is separate from `CustomCheckoutConfiguration`.

Monetary amounts are transferred as integers in the smallest currency unit.

`CheckoutTaxQuote` contains the total amount including tax, the currency, and the exclusive tax amount. The quote is non-binding.

`CheckoutDiscount` contains the code and duration, plus either a fixed discount amount with an optional currency or a percentage discount.

### Custom checkout configuration

`CustomCheckoutConfiguration` is an administrator-created checkout override for individually negotiated deals. It contains:

- the associated customer
- a Stripe price ID
- the deployment type
- seats and runtime minutes
- additional features
- an optional expiration time
- the time at which it was consumed
- a calculated `available` status
- a global ID and timestamps

A configuration is no longer available after it has been consumed or has expired. Customer, deployment type, and Stripe price ID are required when creating one.

### Updating the payment method

`customerPaymentMethodSetupCreate` creates a Stripe SetupIntent and returns its client secret, so the frontend can collect a new payment method with Stripe Elements and have it become the customer's default for future invoices. The checkout stays untouched; this is the path for changing the payment method of a customer that already exists.

Crater never handles payment data:

- No card numbers, expiry dates, CVCs, or bank details pass through Crater. There is no payment form of our own, and neither the Sources API, the Tokens API, nor the Cards API is used anywhere. The details go from the browser straight to Stripe.
- The mutation returns the client secret and nothing else. Neither the SetupIntent nor the secret is written to the database, and neither appears in a log line. The secret is a credential and belongs in memory on the client only.
- The resulting payment method exists solely in Stripe. Crater stores a pointer to nothing; the current default is read from Stripe when it is needed.

The SetupIntent is created server-side with the customer's `stripe_customer_id`, `usage: off_session` — the point is charging later invoices without the customer present — and `automatic_payment_methods`, so Stripe offers whatever is enabled in the Dashboard. `payment_method_types` is deliberately never set: adding a payment method is a Dashboard setting, not a deployment.

Its metadata carries the contract both sides of the flow agree on, defined once in `CustomerPaymentMethodSetup::Metadata`:

| Key                  | Value                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `purpose`            | `default_payment_method`, which tells our own SetupIntents from those other flows create |
| `crater_customer_id` | the internal ID of the Crater customer the payment method is for                         |

Access is the existing membership rule and nothing else:

- The request needs an active Crater `UserSession`; like every mutation except `usersLogin`, an anonymous request is answered with HTTP `403 Forbidden` before the resolver runs.
- The customer is loaded through `CustomerPolicy`, so the authenticated user must be linked to it through `CustomerUser`. `GlobalPolicy` additionally grants `use_payment_method_setup` to any authenticated user; being an admin grants nothing extra.
- A customer that does not exist, one belonging to somebody else, a draft, and one without a `stripe_customer_id` are all answered with `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` and an identical message, so the response never reveals which of the four it was. A draft has no billing relationship yet.
- Stripe failures surface as `INVALID_PAYMENT_METHOD_SETUP_SESSION` with a fixed message. Stripe IDs, API keys, personal data, and Stripe responses never appear in an error. Logging is limited to the internal customer ID and the error class.

This flow does not touch Stripe Tax: automatic tax calculation and tax registrations are unchanged.

#### Promoting the payment method

Confirming the SetupIntent in the browser attaches the payment method to the Stripe customer, but it does not make it the default. That happens in the verified `setup_intent.succeeded` webhook, which runs through the same `ProcessedWebhookEvent` ledger as every other event and is therefore processed exactly once per Stripe event ID.

`Webhooks::HandleSetupIntentSucceededService` treats the metadata as a client-visible claim rather than as proof, and checks it before changing anything:

- A SetupIntent whose `purpose` is not `default_payment_method` is not ours. It is ignored and the event is marked processed; other flows create SetupIntents on the same account.
- The named `crater_customer_id` must resolve to a Crater customer, and that customer's `stripe_customer_id` must be the Stripe customer the SetupIntent was created for. A mismatch is refused and logged; the customer the metadata names is never changed on the strength of the metadata alone.
- The SetupIntent must carry a payment method.
- Only then is the payment method written to the Stripe customer's `invoice_settings.default_payment_method`. Nothing about it is stored in Crater.

Anything inconsistent leaves the event unprocessed, so it stays visible in the ledger instead of being silently accepted, and a Stripe redelivery can run it again. A redelivered event that was already processed is ignored, and setting the same default twice is a no-op in Stripe, so duplicates have no side effects either way. Logging is limited to the internal customer ID and the error class; client secrets and payment method data are never logged.

#### The client flow

1. Call `customerPaymentMethodSetupCreate` with the `customerId` and read `session.clientSecret`.
2. Hand the client secret to Stripe Elements.
3. Render the Payment Element.
4. Confirm with `stripe.confirmSetup()`.
5. Pass a `return_url` to `confirmSetup`, so payment methods that authenticate off-site can come back. This URL goes from the browser to Stripe directly and is never sent through Crater, so there is no server-side allowlist for it — restrict it in the frontend.
6. Do not treat the success state as proof that the payment method is the default. `confirmSetup` resolving only means Stripe accepted the setup; the default is set by the `setup_intent.succeeded` webhook, which arrives separately and may lag.
7. Reload the customer data after returning, and read the current state from Stripe rather than from the confirmation result.

```graphql
mutation CustomerPaymentMethodSetupCreate($input: CustomerPaymentMethodSetupCreateInput!) {
    customerPaymentMethodSetupCreate(input: $input) {
        session {
            clientSecret
        }
        clientMutationId
        errors {
            errorCode
            details {
                __typename
                ... on ActiveModelError {
                    attribute
                    type
                }
                ... on MessageError {
                    message
                }
            }
        }
    }
}
```

```ts
const { data } = await client.mutate({
    mutation: CustomerPaymentMethodSetupCreate,
    variables: { input: { customerId } },
})

const clientSecret = data.customerPaymentMethodSetupCreate.session.clientSecret

const elements = stripe.elements({ clientSecret })
elements.create("payment").mount("#payment-element")

// The return URL is a client-side concern; Crater never sees it.
const { error } = await stripe.confirmSetup({
    elements,
    confirmParams: { return_url: "https://app.crater.code0.tech/billing/done" },
})
```

#### Checkout return URLs

The checkout is the only flow whose return URL passes through Crater. `Crater::ReturnUrl` accepts only absolute `http` or `https` URLs whose origin appears in `checkout.allowed_return_origins`; anything relative, scheme-less, or pointing at another origin is rejected before Stripe is called, so no request can make Stripe redirect a user to a host we do not control.

### Subscriptions, invoices, and licenses

`Subscription` stores the deployment type, Stripe status, unique Stripe subscription ID, optional Sagittarius namespace ID, plan, payment period, and optional AI Token and Workflow Execution quantities. The stored quantities are validated against the same `1` to `1000000000` range the checkout enforces.

`Invoice` contains:

- total, net, and tax amounts
- currency and status
- billing period
- a unique Stripe invoice ID
- an optional invoice number and Stripe PDF URL
- an optional Stripe fee
- optional Lexware ID and URL
- the customer it was billed to and the subscription it was issued for

The associated `InvoiceItem` entries contain an amount, description, and quantity.

`Invoice.subscription_id` is a nullable foreign key with an index and `ON DELETE SET NULL`: a customer can hold several subscriptions, so the customer alone does not identify the invoices of one subscription, while Stripe can also issue invoices that belong to no subscription at all. Amounts stay integers in the smallest currency unit everywhere; they are never converted to floats, and the tax is stored exactly as Stripe billed it rather than recalculated.

Crater defines three transactional invoice emails:

- invoice finalized
- invoice paid
- invoice payment failed

They are addressed to the customer's email address. Subjects use the invoice number and fall back to the Stripe invoice ID when no invoice number exists. Both HTML and plain-text variants are present, with previews available through Rails mailer previews.

The Rails mail bodies are currently placeholders, and automatic delivery of these emails is not implemented yet. The invoice lifecycle webhooks themselves are handled: `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted` drive the license lifecycle alongside `checkout.session.completed`.

`License` describes the usage entitlement resulting from a subscription:

- global ID and status
- start and end times
- deployment type
- seats and runtime minutes
- additional features
- an optional Sagittarius namespace ID for cloud licenses
- grace period, options, and restrictions in the data model
- creation and update timestamps

Self-hosted licenses can be exported as strings. Cloud licenses can be linked to a Sagittarius namespace or transferred to another namespace.

### Webhook processing

`ProcessedWebhookEvent` stores:

- a unique Stripe event ID
- event type
- the complete JSON payload
- an optional processing timestamp

This allows Crater to track Stripe webhook processing and handle events idempotently. An event is only marked with `processed_at` after its handler completes successfully.

#### Handled events

Only these event types are requested from Stripe and accepted by the webhook endpoint; anything else is answered with `200 OK` and discarded without a ledger entry.

| Event                           | Handler                                           | Effect                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkout.session.completed`    | `Webhooks::HandleCheckoutSessionCompletedService` | Upserts the subscription projection, syncs contact details, address, and tax ID back to the customer, and activates a draft customer. Grants no access.                  |
| `invoice.paid`                  | `Webhooks::HandleInvoicePaidService`              | Records the invoice locally and appends a `paid` license snapshot. This is the only event that grants paid access.                                                       |
| `invoice.payment_failed`        | `Webhooks::HandleInvoicePaymentFailedService`     | Records the invoice locally and appends a `payment_failed` snapshot that carries the previous `end_date` and grace period forward.                                       |
| `customer.subscription.deleted` | `Webhooks::HandleSubscriptionDeletedService`      | Sets the local Stripe status to `canceled` and appends a `canceled` snapshot.                                                                                            |
| `setup_intent.succeeded`        | `Webhooks::HandleSetupIntentSucceededService`     | Promotes the collected payment method to the Stripe customer's `invoice_settings.default_payment_method`. Stores nothing locally and touches no license or subscription. |

#### From checkout to license

1. `checkout.session.completed` creates or updates the `Subscription`, the customer's contact and billing data, and activates the customer if it was still a draft. No `License` exists yet, so the customer has no paid access.
2. Stripe issues an invoice for the subscription. `invoice.paid` is the point at which access is granted: `Licenses::UpsertService` appends a `paid` license whose `end_date` is the paid service period end plus `grace_period_days`.
3. `invoice.payment_failed` appends a `payment_failed` snapshot. The `end_date` is deliberately not moved, so entitlements remain valid until the already granted period plus grace period lapses. A later successful payment appends a fresh `paid` snapshot and extends the end date again.
4. `customer.subscription.deleted` sets the subscription's Stripe status to `canceled` and appends a `canceled` snapshot.

Licenses are append-only: every transition adds a row that carries the previous snapshot's entitlements forward, so the history is never rewritten.

The subscription an invoice belongs to is read from `parent.subscription_details.subscription`, since the invoice no longer carries a top level `subscription` field. The paid period comes from the line item periods rather than from `invoice.period_end`, which Stripe documents as the window in which items can be added to the invoice and not as the service period.

#### Activating the customer

`checkout.session.completed` is the only activation path, and it resolves the customer before it touches anything:

- The Crater customer is read from the `crater_customer_id` the checkout itself wrote into the Stripe subscription metadata. A session created before that metadata existed still resolves through the Stripe customer id.
- The session's Stripe customer must be that Crater customer's `stripe_customer_id`. A mismatch is refused with `INVALID_CUSTOMER` and logged with internal and Stripe ids only, so a session can never activate or overwrite a customer it does not belong to.
- Syncing name, e-mail, phone, billing address, and tax ID and setting `status` to `active` happen in one database transaction. A customer is never left active with half of its billing data, and never left a draft after its data was stored.
- An already active customer stays active, so a redelivered event is a no-op for the lifecycle.
- If the customer or the subscription processing fails, the service returns an error and the event is not marked as processed, so Stripe's redelivery can run it again.

#### The local invoice projection

Both invoice events keep Crater's own copy of the Stripe invoice up to date through `Invoices::UpsertService`, which is keyed by the unique Stripe invoice ID and therefore idempotent. `Webhooks::BaseInvoiceEventService` maps the payload onto the record and always sets `subscription_id` to the subscription the event names, so a redelivery or a later `invoice.paid` for the same invoice keeps the relation correct. Number, PDF URL, currency, status, total, and tax are taken from the payload as they are; the tax is read from `total_taxes` and from the legacy `tax` field, and is never recomputed. The billing period comes from the line item periods and falls back to the invoice level `period_start` and `period_end` when a payload carries no line periods. A payload that lacks what an `Invoice` requires is skipped rather than stored half-filled.

Recording the invoice deliberately cannot fail the event: paid access is driven by the license snapshot alone, so a bookkeeping problem is logged and the license lifecycle proceeds unchanged. This projection is also the only source the license dashboard reads invoices from, so a dashboard request never queries Stripe.

Stripe does not guarantee webhook delivery order. In particular, `invoice.paid`, `invoice.payment_failed`, or `customer.subscription.deleted` can arrive before `checkout.session.completed` has created the local `Subscription` projection. Crater treats a missing local subscription as a temporary error and retries the license-relevant event with polynomial backoff. Once the subscription exists, the retry continues normally and creates the corresponding license snapshot exactly once for that Stripe event.

#### Idempotency and failures

`ProcessedWebhookEvent` is keyed by the unique Stripe event ID, so a redelivered event is never processed twice. Redelivery of an already processed event is ignored, while redelivery of an existing unprocessed event schedules processing again. A failure inside `Licenses::UpsertService` leaves the event unprocessed.

Retries for a missing subscription are limited. If the subscription is still unavailable after all attempts, the event remains unprocessed so that a later Stripe redelivery can schedule it again. Retry exhaustion is logged with structured identifiers only: the event type, handler service, and Stripe subscription ID. Complete Stripe payloads and sensitive customer data are never logged.

## GraphQL API

### Entry point

All queries start at the root `Query` type. The currently documented query fields are:

| Query                | Argument           | Return type         | Purpose                                                                                                |
| -------------------- | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `currentUser`        | none               | `User`              | Returns the user authenticated by the current Crater session, or `null` when the request is anonymous. |
| `echo`               | `message: String!` | `String!`           | Verifies read access to the API and returns the supplied message.                                      |
| `subscriptionPrices` | none               | `[CheckoutPrice!]!` | Returns active recurring Stripe prices and can be queried anonymously.                                 |

#### License dashboard

`currentUser` is the entry point for the read-only dashboard. It exposes only data the authenticated user is a member of:

- `User.customers` is a `CustomerConnection!` over the **active** customers linked through `CustomerUser`. Customers of other users never appear, and neither do checkout drafts: they are filtered out of the nodes and of `count`, so a running or abandoned checkout never shows up in a dropdown, a counter, or the license dashboard. A draft's licenses are unreachable for the same reason, since they hang off the customer.
- `Customer.licenses` is a `LicenseConnection!` resolved through `customer.subscriptions.licenses`, ordered by `updated_at DESC` and then `id DESC` so equal timestamps still produce a stable order. A customer without licenses returns an empty connection rather than `null`.
- `License.invoices` is an `InvoiceConnection!` over the invoices of the license's subscription. A license without invoices returns an empty connection rather than `null`.

All three connections use the standard cursor pagination arguments (`first`, `after`, `last`, `before`) and expose `count`.

```graphql
query LicenseDashboard {
    currentUser {
        customers(first: 100) {
            count
            nodes {
                id
                customerType
                name
                email
                updatedAt
                licenses(first: 5) {
                    count
                    nodes {
                        id
                        status
                        plan
                        deploymentType
                        namespaceId
                        updatedAt
                    }
                }
            }
        }
    }
}
```

Authorization uses the existing policies. `UserPolicy` grants `read_user` only for the user themselves, `CustomerPolicy` grants `read_customer` to members through `CustomerUser`, and `LicensePolicy` and `InvoicePolicy` derive `read_license` and `read_invoice` from `read_customer`, so membership is defined in exactly one place. As with the other resource policies, being an admin grants no extra read access. An anonymous request returns `currentUser: null`; an invalid or inactive session token is still answered with HTTP `401 Unauthorized` before the query runs.

#### Invoices of a license

`License.invoices` answers "which invoices belong to this license" through the license's subscription, never through the customer: a customer can hold several subscriptions, and the invoices of one must not show up on the licenses of another. Because licenses are append-only snapshots of the same subscription, every snapshot of a subscription resolves the identical invoice history.

```graphql
query LicenseInvoices {
    currentUser {
        customers(first: 100) {
            nodes {
                licenses(first: 100) {
                    nodes {
                        id
                        invoices(first: 100) {
                            count
                            nodes {
                                id
                                invoiceNumber
                                status
                                currency
                                total
                                net
                                tax
                                billingPeriodStart
                                billingPeriodEnd
                                stripePdfUrl
                                createdAt
                                updatedAt
                            }
                        }
                    }
                }
            }
        }
    }
}
```

The `Invoice` type maps onto the stored record: `total`, `net`, and `tax` are the stored `amount_total`, `net_amount`, and `tax_amount` as integers in the smallest currency unit, `billingPeriodStart` and `billingPeriodEnd` are the stored billing period, and `stripePdfUrl` is the stored Stripe PDF link. `invoiceNumber`, `net`, and `stripePdfUrl` are nullable, because Stripe reports them only once the invoice is finalized and its balance transaction is known. Nothing is recalculated on read, and Stripe is not called.

Invoices are ordered by `period_start DESC`, then `created_at DESC`, then `id DESC`, so the newest billing period comes first and equal timestamps still produce a stable order.

Reading invoices requires `read_invoice`, which `InvoicePolicy` derives from `read_customer` on the invoice's customer. A user who is not a member of that customer through `CustomerUser` never sees the invoice, not even when reaching it through a license.

The invoices of a subscription are batched with a GraphQL dataloader source (`Sources::InvoicesBySubscription`), so walking `customers -> licenses -> invoices` in one request costs a constant number of queries no matter how many licenses and snapshots it returns.

`CheckoutPrice` contains:

- Stripe price ID
- currency
- `unitAmount` in the smallest currency unit, which is `null` when the price needs sub-minor-unit precision
- `unitAmountDecimal`, the exact amount in the smallest currency unit as a decimal string
- recurring `interval`, such as `month` or `year`
- `intervalCount`, the number of intervals between billings; a quarterly price is `interval: month` with `intervalCount: 3`
- optional stable `lookupKey`
- expanded Stripe product name

`unitAmountDecimal` is a string on purpose. AI Token prices are far below one cent, and Stripe's Ruby client parses the field into a `BigDecimal`; it is formatted explicitly rather than converted through a `Float`, so no precision is lost. Clients that need to compute totals should use this field rather than `unitAmount`.

The query auto-paginates and returns every active recurring price, not just Stripe's default first page of ten. The result is sorted deterministically by `lookupKey` and then by price ID, with prices that have no lookup key last.

Prices and products are managed in Stripe. The listing query fetches active recurring prices directly instead of mirroring a product catalog locally. Checkout creation still resolves its `plan` argument through the configured `checkout.prices` mapping. Stripe retrieval failures surface as a GraphQL execution error based on `UNABLE_TO_LIST_PRICES`.

#### Lookup keys

`lookupKey` is the stable technical identifier for matching a price. Product names must not be used for that: they are freely editable in Stripe and are currently spelled inconsistently. Every checkout price carries a unique lookup key following this scheme:

```text
pro_weekly                        max_weekly
pro_monthly                       max_monthly
pro_yearly                        max_yearly

ai_token_b2b_monthly              workflow_execution_b2b_monthly
ai_token_b2b_quarterly            workflow_execution_b2b_quarterly
ai_token_b2b_yearly               workflow_execution_b2b_yearly

ai_token_b2c_monthly              workflow_execution_b2c_monthly
ai_token_b2c_quarterly            workflow_execution_b2c_quarterly
ai_token_b2c_yearly               workflow_execution_b2c_yearly
```

The keys are assigned on the Price objects in Stripe; Crater reads them but never writes them.

### HTTP authentication

GraphQL requests are sent to `POST /graphql`. Crater uses header-based session authentication and does not use an authentication cookie:

```http
Authorization: Session <crater-session-token>
Content-Type: application/json
```

Authentication behavior:

- Queries can be executed anonymously; this explicitly includes `subscriptionPrices`.
- `usersLogin` is the only mutation that can be executed anonymously, and it must be the only top-level selection in that GraphQL operation.
- All other mutations, including `checkoutCreateSession`, require an active Crater `UserSession`.
- A protected mutation without an `Authorization` header returns HTTP `403 Forbidden`.
- An unknown authentication scheme or an invalid or inactive session token returns HTTP `401 Unauthorized`.
- The session token is returned by `usersLogin` only when the new `UserSession` is created.
- The Sagittarius login token and the resulting Crater session token are distinct credentials with different header schemes.

### Mutations

Almost all mutations optionally accept `clientMutationId` and return it so the client can correlate the response with its request. Mutation payloads also contain a non-null `errors: [Error!]!` field.

#### Authentication and access

| Mutation     | Key arguments                                                                           | Result                                                           |
| ------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `usersLogin` | `sagittariusToken: String!`, obtained from Sagittarius through `usersCreateCraterToken` | Newly created `UserSession` and its Crater session token         |
| `echo`       | Optional message                                                                        | Returned message; verifies mutation access without changing data |

#### Customers

| Mutation                           | Key arguments                                                                                           | Result                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `customersCreate`                  | `customerType!`, optional `draft`, `checkoutKey`, `reuseExisting`, contact details, address, and tax ID | Created or resolved `Customer`                                                |
| `customersUpdate`                  | `id!`, optional contact details and address                                                             | Updated `Customer`                                                            |
| `customersDelete`                  | `id!`                                                                                                   | Deleted `Customer`                                                            |
| `customerPaymentMethodSetupCreate` | `customerId!`                                                                                           | Stripe SetupIntent `clientSecret` for collecting a new default payment method |

For `customersCreate`, only `customerType` is mandatory in the GraphQL schema. Other fields that are required by the domain are checked through model validations. The full signature of the draft-related arguments is:

```graphql
customersCreate(
  input: {
    customerType: String!      # "personal" or "business"
    draft: Boolean             # defaults to false
    checkoutKey: String        # required with draft: true, rejected without it
    reuseExisting: Boolean     # defaults to true, ignored with draft: true
    # name, email, phone, address, taxIdType, taxIdValue as before
  }
): CustomersCreatePayload
```

Its behaviour:

- Without `draft`, the mutation behaves exactly as before and creates or reuses an active customer.
- `reuseExisting` (default `true`) reuses the authenticated user's first **active** customer. It never returns a draft, so the draft of one checkout is never handed to another.
- `draft: true` requires a valid `checkoutKey` and always drafts; it never reuses an existing active customer.
- `checkoutKey` without `draft: true` is rejected with `INVALID_CUSTOMER`, as is a missing, too short, too long, or non-alphanumeric key with `draft: true`.
- Repeating the request with the same user, `customerType`, and `checkoutKey` returns the same customer and creates neither a second Crater nor a second Stripe customer.
- `Customer.status` is exposed so the client can tell a draft it just prepared from an active customer it selected. Clients that only list customers never need it, because lists contain active customers only.

#### Checkout

| Mutation                             | Key arguments                                                                                 | Result                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `checkoutCalculateTax`               | `plan!`, `paymentPeriod!`, and optional custom quantities                                     | `CheckoutTaxQuote`                                        |
| `checkoutValidateDiscount`           | `code: String!`                                                                               | `CheckoutDiscount`                                        |
| `checkoutCreateSession`              | `customerId!`, `paymentPeriod!`, `returnUrl!`, and either a plan or custom configuration      | Embedded `CheckoutSession` with a frontend `clientSecret` |
| `customCheckoutConfigurationsCreate` | `customerId!`, `deploymentType!`, `stripePriceId!`, optional entitlements and expiration time | `CustomCheckoutConfiguration`                             |

For `checkoutCreateSession`:

- The request must include `Authorization: Session <crater-session-token>`; the mutation is not anonymously accessible.
- The client must select the customer explicitly and pass its global `CustomerID` as the required `customerId` argument. Crater no longer falls back to the authenticated user's first customer, so a client has to create or choose a customer before calling `checkoutCreateSession`. The selected customer does not need an email, name, or address yet.
- The selected customer must be linked to the authenticated user through `CustomerUser`, which is the same membership rule `CustomerPolicy` uses for `read_customer`. A customer that does not exist and one belonging to somebody else are both answered with `INVALID_CHECKOUT_CUSTOMER` and an identical message, so the response never reveals whether an id exists. This applies to a draft of another user as well.
- The selected customer may be a draft or an active customer; the customer type check, the custom configuration checks, and every other validation are identical for both. A repeated `checkoutCreateSession` for the same customer creates a new Stripe session but no additional customer.
- With a `customCheckoutConfigurationId`, the configuration already names its customer. `customerId` must be that customer; a different one is rejected with `INVALID_CHECKOUT_CUSTOMER` rather than silently switching the checkout to another customer.
- For a `plan: custom` checkout the selected customer's type picks the B2B or B2C component prices. If the component is configured for the other customer type only, the request is rejected with `CUSTOMER_TYPE_MISMATCH` instead of a generic selection error.
- The Stripe Checkout Session is created with the selected customer's `stripe_customer_id`, so the contact details, billing address, and tax ID that Stripe collects are synced back to exactly that customer. Its Crater customer ID is stored in the subscription metadata as `crater_customer_id`.
- Crater never sends `customer_email`; the Stripe Customer is referenced by ID, and Stripe rejects both parameters together. An email already on the Stripe Customer is therefore never restated, and a missing one is collected by the client's `ContactDetailsElement`.
- A regular checkout uses `plan`, `paymentPeriod`, and, where applicable, `deploymentType`, `namespaceId`, and `promotionCode`.
- `plan: custom` accepts positive `aiTokens` and `workflowExecutions`; at least one quantity is required and the authenticated customer's stored type selects B2B or B2C Prices.
- Each custom quantity must be a positive integer of at most `1000000000`, which stays inside the signed 32-bit range of the GraphQL `Int` scalar and of the `integer` database columns. Anything outside that range, including zero, negative, decimal, and non-integer values, is rejected with `INVALID_CHECKOUT_SELECTION` before Stripe is called. The same bound applies to `checkoutCalculateTax`. Stripe documents no maximum for a line item's initial `quantity`; its `999999` cap applies to `adjustable_quantity.maximum`, which Crater does not use.
- A custom checkout uses `customCheckoutConfigurationId`; `plan` and `deploymentType` are then ignored.
- `namespaceId` is only relevant to cloud deployments.
- `returnUrl` must have an origin listed in `checkout.allowed_return_origins`.
- Stripe receives `ui_mode: elements`; the frontend initializes the custom checkout UI with the returned `clientSecret`.
- Stripe collects the billing address, updates the customer's address and name, and calculates tax automatically.
- The session enables `tax_id_collection`, so a business customer without a stored tax ID can supply one through Stripe's `TaxIdElement`. The collected tax ID is resolved back to its Stripe `TaxId` object and stored on the Crater customer by the `checkout.session.completed` webhook.
- The resulting Stripe subscription metadata also contains `plan`, `payment_period`, and dynamic custom quantities when applicable.

#### Licenses

| Mutation                | Key arguments                            | Result                                    |
| ----------------------- | ---------------------------------------- | ----------------------------------------- |
| `licensesExport`        | `id: LicenseID!`                         | Exported license string; self-hosted only |
| `licensesLinkNamespace` | `id: LicenseID!`, `namespaceId: String!` | Updated cloud license                     |

## Error handling

A GraphQL error object consists of:

- `errorCode: ErrorCodeEnum!`
- optional `details: [DetailedError!]`

`DetailedError` is a union of:

- `ActiveModelError`, containing the affected attribute and failed validation type
- `MessageError`, containing a human-readable error message

Documented error codes:

| Code                                    | Meaning                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOMER_TYPE_MISMATCH`                | The selected customer's type does not match the selected checkout                                                                     |
| `INVALID_CHECKOUT_CUSTOMER`             | The selected customer does not exist or is not accessible to the current user                                                         |
| `INVALID_CHECKOUT_SESSION`              | The checkout session could not be created                                                                                             |
| `INVALID_CHECKOUT_SELECTION`            | The selected plan, payment period, quantity, or configured Price combination is invalid                                               |
| `INVALID_CUSTOMER`                      | The customer is invalid                                                                                                               |
| `INVALID_CUSTOM_CHECKOUT_CONFIGURATION` | The custom checkout configuration is invalid                                                                                          |
| `INVALID_DISCOUNT_CODE`                 | The discount code is invalid or inactive                                                                                              |
| `INVALID_INVOICE`                       | The invoice is invalid                                                                                                                |
| `INVALID_LICENSE`                       | The license is invalid                                                                                                                |
| `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` | The selected customer does not exist, is not accessible to the current user, or has no billing account to set a payment method up for |
| `INVALID_PAYMENT_METHOD_SETUP_SESSION`  | The payment method setup could not be created                                                                                         |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in                                                                                        |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid                                                                                                           |
| `INVALID_TAX_CALCULATION`               | Stripe rejected the tax calculation                                                                                                   |
| `INVALID_USER`                          | The local user derived from Sagittarius is invalid                                                                                    |
| `MISSING_PERMISSION`                    | The user does not have the required permission                                                                                        |
| `SAGITTARIUS_UNAVAILABLE`               | Sagittarius could not be reached or returned an unexpected response                                                                   |
| `UNABLE_TO_LIST_PRICES`                 | Active recurring Stripe prices could not be retrieved                                                                                 |

## Types and conventions

- `String`: UTF-8 text
- `Int`: signed 32-bit integer
- `Float`: double-precision IEEE 754 floating-point number
- `Boolean`: `true` or `false`
- `Time`: ISO 8601 timestamp, for example `2023-12-15T17:31:00Z`
- `CustomerID`, `UserID`, `UserSessionID`, `LicenseID`, and `CustomCheckoutConfigurationID`: type-specific global IDs
- A `!` after a GraphQL type marks a non-null value.
- Lists use square brackets, for example `[String!]!`.
- Paginated results use cursor pagination with `startCursor`, `endCursor`, `hasNextPage`, and `hasPreviousPage`.

## Typical end-to-end flow

1. The frontend anonymously queries `subscriptionPrices` to display active recurring Stripe products and prices.
2. An authenticated Sagittarius client calls `usersCreateCraterToken` and receives a dedicated Crater login token.
3. The client passes that token to Crater's anonymous `usersLogin` mutation.
4. Crater verifies the token with Sagittarius, maps the returned Sagittarius user ID to a local user, creates a `UserSession`, and returns its token.
5. The client sends the Crater token on subsequent mutations as `Authorization: Session <token>`; no authentication cookie is required.
6. The authenticated user selects one of their active customers, or the frontend generates a `checkoutKey` for this checkout attempt, stores it in `sessionStorage`, and calls `customersCreate(customerType: ..., draft: true, checkoutKey: ...)`. The draft is invisible everywhere else, and repeating the call after a reload or a React retry returns the very same customer.
7. The frontend can preview tax and validate a promotion code.
8. Crater creates an embedded Stripe Checkout Session for a plan or an individually negotiated offer and returns its `clientSecret`. Drafts and active customers are accepted alike.
9. The frontend mounts Stripe's custom checkout UI. Stripe collects billing details and calculates tax automatically. Nothing the user enters here activates the customer.
10. The Stripe subscription receives metadata for the Crater customer ID, deployment type, customer type, and optional namespace ID.
11. The verified `checkout.session.completed` webhook creates or updates Crater's subscription projection, syncs the email, name, phone, address, and tax ID from the session's `customer_details` back to the Crater customer, and activates it in the same transaction. From here on the customer appears in lists and on the dashboard. The webhook does not grant paid access by itself. The frontend drops its stored `checkoutKey` once the checkout returned successfully.
12. The verified `invoice.paid` webhook records the invoice against its subscription and appends the first `paid` license, which is the moment paid access begins. A failed renewal appends a `payment_failed` snapshot without shortening the current entitlement, and `customer.subscription.deleted` cancels the subscription and appends a `canceled` snapshot. Automatic invoice-email delivery remains to be implemented.
13. The dashboard reads the billing history of a license from that local projection through `License.invoices`.
14. Once the relevant subscription and license data exists, a self-hosted license can be exported while a cloud license can be linked to a Sagittarius namespace.
15. To change the payment method of an active customer later, the client calls `customerPaymentMethodSetupCreate`, confirms the returned SetupIntent with Stripe Elements, and reloads the customer data afterwards. The verified `setup_intent.succeeded` webhook is what makes the collected payment method the default, so the confirmation itself is not proof that it already is.

If the user abandons the checkout at any point between steps 6 and 11, the customer simply stays a draft: it never appears anywhere, and `Customers::CleanupDraftsJob` removes it and its Stripe Customer once `checkout.draft_retention_hours` have passed.
