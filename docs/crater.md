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
- an `active` status, which is derived rather than stored
- an `expiresAt` time
- the associated user
- timestamps
- a session token, which is only returned when the session is created

Login is now integrated with Sagittarius:

1. An authenticated Sagittarius client obtains a dedicated Crater login token through the Sagittarius `usersCreateCraterToken` mutation.
2. The client passes that value to Crater's anonymous `usersLogin` mutation as `sagittariusToken`.
3. Crater calls Sagittarius's `/graphql` endpoint with `Authorization: Crater-Login <token>` and resolves `currentUser { id }`.
4. Crater finds or creates its local user by the returned Sagittarius ID and creates a fresh `UserSession` with a server-set expiry.

A blank or rejected token returns `INVALID_SAGITTARIUS_TOKEN`. Connectivity problems, unexpected HTTP responses, or GraphQL errors from Sagittarius return `SAGITTARIUS_UNAVAILABLE`. Failure to persist the local user returns `INVALID_USER`.

Session lists follow the GraphQL connection model with `nodes`, `edges`, cursors, a total count, and `pageInfo`.

#### The session lifecycle

A session is usable while it is **neither revoked nor expired**. There is no stored `active` flag: a flag cannot express an expiry that passes on its own, and would drift out of sync with it. `UserSession#active?` and the `UserSession.active` scope both derive the answer from two columns:

| Column       | Meaning                                                                                |
| ------------ | -------------------------------------------------------------------------------------- |
| `expires_at` | Not null. Set by the server when the session is created; a client cannot influence it. |
| `revoked_at` | Set by `usersLogout`. Null while the session has not been revoked.                     |

`session.lifetime_hours` (default `168`, seven days) is the absolute lifetime a new session receives. There is no refresh, no sliding window, and no rotation, so this value is the only bound on how long a stolen token remains useful; seven days keeps re-authentication through Sagittarius infrequent without leaving a token valid for months. Shortening it takes effect for newly created sessions only.

Authentication resolves a token through `UserSession.active.find_by(token: ...)`, so **a revoked, an expired, and an entirely unknown token all resolve to nothing** and produce the identical HTTP `401 Unauthorized`. Nothing in the response distinguishes them, so no request can probe whether a session exists.

Tokens are stored with deterministic Active Record encryption (`TokenAttr`), never as plain text, which is what allows the lookup above without keeping the raw value in the database. The token is returned exactly once, by `usersLogin`, and appears in no other response, no error detail, and no log line.

#### Logging out

`usersLogout` revokes the session the request is authenticated with:

- It takes **no arguments** beyond `clientMutationId`. The session is read from the `Authorization` header, so there is no identifier a caller could supply and therefore no way to revoke somebody else's session -- or another one of their own.
- The payload carries **no session object, no session ID, and no token**, only `errors` and `clientMutationId`. An empty `errors` list is the confirmation.
- From the next request on, the same token is rejected exactly like an unknown one. A second logout with it returns `401`.
- Other sessions of the same user stay active; logging out of one device does not log out the others.
- Revoking is idempotent at the model level and never moves an existing `revoked_at`.
- An anonymous request is answered with HTTP `403 Forbidden` before the resolver runs, like every mutation except `usersLogin`. A revoked or expired token is answered with `401`.
- Reaching the resolver without a session authentication returns `MISSING_PERMISSION` in the payload `errors`.

```graphql
mutation UsersLogout($input: UsersLogoutInput!) {
    usersLogout(input: $input) {
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

#### Cleaning up sessions

`Users::CleanupSessionsService` deletes sessions that can no longer authenticate anything:

- A session is removed once it has been **revoked or expired for longer than `session.retention_hours`** (default `720`, thirty days). The retention keeps a short audit trail before the row disappears.
- Because the cutoff always lies in the past, a still usable session -- not revoked, expiring in the future -- can never match, whatever the retention is set to. That holds even for a retention of zero.
- Deletion runs in batches of `session.cleanup_batch_size` (default `1000`), so a large backlog cannot hold one long transaction or lock open.
- Running it repeatedly is safe; it simply finds less to do.
- Logging is limited to the number deleted and the retention. Tokens, users, and session IDs are never logged.

`Users::CleanupSessionsJob` runs the service through GoodJob's cron support in `config/application.rb`, hourly at minute 42:

```ruby
cleanup_user_sessions: {
  cron: '42 * * * *',
  class: 'Users::CleanupSessionsJob',
  description: 'Removes revoked and expired user sessions once the retention has passed',
}
```

It can also be triggered by hand:

```ruby
Users::CleanupSessionsJob.perform_later                        # through the queue
Users::CleanupSessionsService.new.execute                      # inline, for example from a console
Users::CleanupSessionsService.new(retention: 7.days, batch_size: 500).execute
```

### Checkout and Stripe

Crater creates Stripe Checkout Sessions in subscription mode for the current customer. Checkout uses Stripe's embedded Elements/custom UI mode rather than redirecting the customer to a Stripe-hosted Checkout page. A checkout can be based either on a regular internal plan or on an individually negotiated `CustomCheckoutConfiguration`.

The customer a session is created for may be an active customer or a provisional draft, as long as it belongs to the authenticated user through `CustomerUser`. Creating the session neither activates a draft nor creates another customer; see [the customer lifecycle](#the-customer-lifecycle).

A `CheckoutSession` returns:

- the Stripe session ID
- the client secret used by the frontend to initialize Stripe's embedded checkout
- the expiration time as a Unix timestamp

Additional checkout features include:

- previewing the tax Stripe would calculate for a plan
- selecting the billing period of the customer's type: monthly, quarterly, or yearly for business customers, weekly, monthly, or yearly for personal ones
- the same period rule for Pro, Max, and dynamic custom checkouts alike
- quantity-based AI Token and Workflow Execution line items for dynamic custom checkouts
- validating Stripe promotion codes
- supporting the `self_hosted` and `cloud` deployment types
- optionally linking a cloud checkout to a Sagittarius namespace ID
- a required, allowlisted return URL for payment methods that temporarily leave the page
- required billing-address collection
- automatic Stripe Tax
- automatic synchronization of the customer's name and address back to Stripe
- attaching the plan, payment period, custom quantities, Crater customer ID, deployment type, customer type, and optional namespace ID to the Stripe subscription metadata

Stripe Price IDs are resolved exclusively on the server from `checkout.prices`. Every plan is priced per customer type: Pro, Max, and each dynamic custom component resolve their Price from the plan or component, the customer's type, and the payment period. The customer type is always the stored `customerType` of the selected customer, never something the client sends, so a B2C client cannot check out at a B2B price. This dynamic `plan: custom` flow is separate from `CustomCheckoutConfiguration`, which names its own Price.

#### The payment periods of a customer type

Which periods exist is a property of the **customer type**, not of the plan. It is the same split everywhere -- for Pro, for Max, and for the custom components:

| Customer type    | Payment periods                  |
| ---------------- | -------------------------------- |
| `business` (B2B) | `monthly`, `quarterly`, `yearly` |
| `personal` (B2C) | `weekly`, `monthly`, `yearly`    |

`CheckoutPaymentPeriod` still offers all four values, because both sets together need them. A period the selected customer's type is not billed in -- weekly for a business customer, quarterly for a personal one -- is rejected with `INVALID_CHECKOUT_SELECTION` before any Price is looked up, in `checkoutCreateSession` and in `checkoutCalculateTax` alike. `Subscription` validates the stored period against its customer's type with the same rule, so a projection can never hold a combination the checkout would refuse.

**This section applies unchanged to changes of an existing subscription.** `subscriptionsUpdate` and `subscriptionsPreviewUpdate` resolve their target Price through the very same rules: the customer type is the stored `customerType` of the subscription's customer and never something the client sends, that type decides which periods exist at all, and a period outside the set is refused before Stripe is called. A subscription can therefore never be moved into a plan, period, or Price combination a fresh checkout would have rejected. The same rule also guards the pending half of a scheduled change, so a `pendingUpdate` is always a selection the checkout would accept.

A plan or component that is configured for the other customer type only is rejected with `CUSTOMER_TYPE_MISMATCH` rather than falling back to that type's Price; one configured for neither type is a plain `INVALID_CHECKOUT_SELECTION`.

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

### The checkout completion status

`checkoutCompletionStatus(sessionId: String!)` answers the one question a client has after sending a user into the checkout: did this produce access yet? It exists so that no client -- Cygnus included -- has to guess that from a Stripe redirect, a timestamp, or a customer id it happens to hold.

**A completed Stripe session is not access.** `session.status = complete` only means the user finished the form and Stripe accepted the subscription. Paid access still begins exclusively where it always did: at the verified `invoice.paid` webhook, which appends the `paid` license snapshot. The query never grants, advances, or anticipates that -- it only reports whether it has happened.

#### The states

| State                 | Meaning                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHECKOUT_PENDING`    | The Stripe session is `open`; the user has not finished the checkout.                                                                                                                                                                                                  |
| `PAYMENT_PENDING`     | The session is `complete` but `payment_status` is `unpaid`.                                                                                                                                                                                                            |
| `FULFILLMENT_PENDING` | Stripe considers the session settled (`paid` or `no_payment_required`), but Crater has no `paid` license for its subscription yet. **This is not access.** It is also the state while the `checkout.session.completed` or `invoice.paid` webhooks are still in flight. |
| `READY`               | A `paid` license exists for exactly the subscription this session created. `licenseId` names it.                                                                                                                                                                       |
| `FAILED`              | The session `expired` without completing and can no longer lead to access.                                                                                                                                                                                             |

`no_payment_required` is deliberately not treated as paid. A hundred-percent discount still has to produce an `invoice.paid` and a `paid` license before the answer becomes `READY`.

#### What the client may contribute

Only the Stripe Checkout Session ID. There is no `customerId` argument, no timestamp, and no state the client could influence:

- `customerId` in the response is what Crater resolved server-side, never what the caller claimed.
- `licenseId` is set in `READY` only, and is `null` in every other state.
- No Stripe customer, subscription, or invoice IDs are returned.
- GraphQL responses carry `Cache-Control: no-store`, so no proxy or browser holds a stale answer.

#### What is verified before an answer is given

The query needs an active `UserSession`; an anonymous request is refused. Beyond that, every one of these must hold, and any single failure produces one identical `INVALID_CHECKOUT_STATUS_SESSION` error:

- The ID looks like a Stripe Checkout Session ID. A malformed one is refused without calling Stripe at all.
- The session exists, and `mode` is `subscription`.
- `status` is `open`, `complete`, or `expired`.
- The session names a Stripe customer.
- A `complete` session names a subscription, and `session.customer` equals `subscription.customer`.
- `subscription.metadata.crater_customer_id` is present, numeric, and names an existing Crater customer.
- That customer's `stripe_customer_id` is the session's Stripe customer.
- That customer is linked to the authenticated user through `CustomerUser`, checked with the same `CustomerPolicy` used everywhere else. Being an admin grants nothing extra.
- The remaining metadata Crater wrote is internally consistent and agrees with what Crater knows: `customer_type` matches the resolved customer, `deployment_type` is a known one, a `namespace_id` only appears for cloud, `plan` and `payment_period` appear together and the period is one the resolved customer's type is billed in, custom quantities appear only for the custom plan, and a negotiated `CustomCheckoutConfiguration` carries no plan at all. Where the local `Subscription` already exists, its deployment type, plan, and payment period must equal the metadata's.

Because a session that does not exist, one belonging to somebody else, and one that contradicts itself are answered identically, the response never reveals which of the three it was.

#### How `READY` is bound to exactly one subscription

The local subscription is resolved solely through the Stripe subscription ID of the session, against the unique `index_subscriptions_on_stripe_subscription_id`, and must belong to the resolved customer. `READY` requires a `paid` license of **that** subscription:

- A paid license of another subscription, even of the same customer, never produces `READY`.
- A paid license of another customer never produces `READY`.
- No timestamp heuristic and no "any recent license" lookup is involved.
- A missing local subscription or a missing license is `FULFILLMENT_PENDING`, which is the normal state while webhooks are still in flight.

Licenses stay append-only, and the query writes nothing. Polling it repeatedly is free of side effects and adds no shadow state: it reads the same `Subscription` and `License` projection the dashboard reads. No new metadata key and no migration were needed -- `crater_customer_id` already identifies Crater's own sessions, and the unique index on `stripe_subscription_id` already provides the exact binding.

Stripe outages are distinguished from domain errors: an unreachable Stripe surfaces as `CHECKOUT_STATUS_UNAVAILABLE`, which a client may retry, while everything above is `INVALID_CHECKOUT_STATUS_SESSION`, which it must not. Both are GraphQL execution errors carrying the code in `extensions.errorCode`. Logging is limited to the Stripe session ID and the error class.

#### The client flow

```graphql
query CheckoutCompletionStatus($sessionId: String!) {
    checkoutCompletionStatus(sessionId: $sessionId) {
        state
        customerId
        licenseId
    }
}
```

Poll while the state is `CHECKOUT_PENDING`, `PAYMENT_PENDING`, or `FULFILLMENT_PENDING`; stop on `READY` and on `FAILED`. Treat only `READY` as access, and use its `licenseId` to load the license. `FULFILLMENT_PENDING` is expected for a short while after a successful checkout and is not an error.

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

`Subscription` stores the deployment type, Stripe status, unique Stripe subscription ID, optional Sagittarius namespace ID, plan, payment period, and optional AI Token and Workflow Execution quantities. The stored quantities are validated against the same `1` to `1000000000` range the checkout enforces, and the stored payment period against the periods its customer's type is billed in.

It also projects the lifecycle Stripe reports: the current billing period (`current_period_start`, `current_period_end`), `cancel_at` and `canceled_at` for a cancellation, and the pending half of a scheduled change (`stripe_schedule_id` plus `pending_plan`, `pending_payment_period`, `pending_ai_tokens`, `pending_workflow_executions`, and `pending_effective_at`). The pending fields are validated exactly like the current ones, so a scheduled change can never describe a selection the checkout would refuse. Without an effective time there is no scheduled change and every pending field has to be empty.

A subscription that came out of a negotiated `CustomCheckoutConfiguration` carries that configuration's own Stripe Price and therefore no plan, payment period, or quantities. A missing plan is what identifies it, and it is the reason such a subscription is excluded from `subscriptionsUpdate`.

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

The Rails mail bodies are currently placeholders, and automatic delivery of these emails is not implemented yet. The invoice lifecycle webhooks themselves are handled: `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted` drive the license lifecycle alongside `checkout.session.completed`, while `customer.subscription.updated` keeps the subscription projection current without touching a license.

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

### Managing an existing subscription

A logged-in user can change and end the subscriptions of their own customers without going through a new checkout: switch between `pro`, `max`, and `custom` in either direction, raise or lower the `custom` quantities without changing the plan, move to another payment period their customer type is billed in, cancel, and take a cancellation back.

Every one of these goes through `Subscriptions::ChangePlanner`, which turns "these fields should change" into "this is the exact selection, these are the Stripe items, and this is when it applies". The preview and the execution run the same planner, which is what makes the previewed effective moment the one the update then produces.

Fields that are not supplied keep their current value. Changing only the interval therefore never resets the quantities the user bought, and changing only a quantity never moves the plan.

#### When a change takes effect

This is the rule, and it is the same one in `subscriptionsPreviewUpdate` and `subscriptionsUpdate`:

| Change                                                         | When                      | Stripe                                                              |
| -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Upgrade: same payment period, higher recurring total           | Immediately               | `subscriptions.update` with `proration_behavior: create_prorations` |
| Downgrade: same payment period, equal or lower recurring total | End of the current period | Subscription schedule, second phase, `proration_behavior: none`     |
| Any change of the payment period                               | End of the current period | Subscription schedule, second phase, `proration_behavior: none`     |

An upgrade is immediate so the user gets what they are being charged for straight away. A downgrade waits and produces no credit, because refunding the unused remainder would create balances that neither the bookkeeping nor the append-only licence chain can represent. An interval change always waits: switching from yearly to monthly halfway through a paid year would credit the rest of that year.

A total that stays exactly the same counts as a downgrade on purpose. Nothing is owed, so there is no reason to charge or prorate mid-period.

Totals are only ever compared within one payment period, so the two amounts describe the same span of time. A Price that Stripe reports no usable amount for is treated as "not more expensive", which defers the change instead of charging a proration Crater could not have previewed.

#### Scheduled changes

A change that only applies at the end of the period becomes a Stripe subscription schedule with two phases: the phase that is running now, kept exactly as Stripe reports it, and the new selection starting when the current one ends. `end_behavior: release` hands the subscription back afterwards, so Crater is not left managing it through a schedule forever.

The subscription metadata rides on the future phase, so Stripe's copy of the selection flips at the same moment its items do. This matters because `checkoutCompletionStatus` compares that metadata against the local projection and demands equality of deployment type, plan, and period; writing the new plan into the metadata while the subscription is still billing the old one would break the status of a later checkout session.

The schedule is mirrored locally in the `pending_*` columns and exposed as `Subscription.pendingUpdate`, so the UI can say "Max applies from 1 October" instead of showing an unchanged subscription. Requesting another change replaces the schedule rather than queueing behind it: the old one is released first, which is also required because a subscription driven by a schedule cannot have its items updated directly. Cancelling releases it as well.

#### Consistency and safety

- The row is locked for the whole exchange with Stripe, so two concurrent requests for the same subscription cannot both reach it.
- Every Stripe write carries an idempotency key derived from the subscription and the exact target selection, so a retried request reuses Stripe's stored answer instead of prorating a second time, while a genuinely different request is still a new one.
- An update that asks for the selection the subscription already has is a successful no-op: no Stripe call, no proration.
- A subscription that is no longer active (`canceled`, `incomplete_expired`) and one from a `CustomCheckoutConfiguration` are refused with `INVALID_SUBSCRIPTION`. Cancelling a negotiated subscription is still allowed, because no plan catalogue is involved.

#### What a change does to licences

Nothing directly. Licences stay append-only, and a plan change rewrites no existing snapshot.

**A change never writes a licence, not even an immediate upgrade.** The entitlements of the new plan reach the user through the next `invoice.paid` snapshot, which is the only event that grants paid access. This keeps a single writer for the licence chain: a plan the user was upgraded to but has not been invoiced for yet does not silently become an entitlement, and there is no snapshot that would have to be revoked if the proration invoice then fails.

On a cancellation `end_date` is deliberately not moved. The already paid period plus its `grace_period_days` simply lapses, and the `canceled` snapshot still arrives the usual way through `customer.subscription.deleted`. `immediately: true` is no different: the period the user already paid for stays licensed.

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
| `customer.subscription.updated` | `Webhooks::HandleSubscriptionUpdatedService`      | Syncs the projection: plan, period, quantities, status, `cancel_at`, and the billing period bounds. Grants no access and writes no licence.                              |
| `customer.subscription.deleted` | `Webhooks::HandleSubscriptionDeletedService`      | Sets the local Stripe status to `canceled` and appends a `canceled` snapshot.                                                                                            |
| `setup_intent.succeeded`        | `Webhooks::HandleSetupIntentSucceededService`     | Promotes the collected payment method to the Stripe customer's `invoice_settings.default_payment_method`. Stores nothing locally and touches no license or subscription. |

#### From checkout to license

1. `checkout.session.completed` creates or updates the `Subscription`, the customer's contact and billing data, and activates the customer if it was still a draft. No `License` exists yet, so the customer has no paid access.
2. Stripe issues an invoice for the subscription. `invoice.paid` is the point at which access is granted: `Licenses::UpsertService` appends a `paid` license whose `end_date` is the paid service period end plus `grace_period_days`.
3. `invoice.payment_failed` appends a `payment_failed` snapshot. The `end_date` is deliberately not moved, so entitlements remain valid until the already granted period plus grace period lapses. A later successful payment appends a fresh `paid` snapshot and extends the end date again.
4. `customer.subscription.deleted` sets the subscription's Stripe status to `canceled` and appends a `canceled` snapshot.

Licenses are append-only: every transition adds a row that carries the previous snapshot's entitlements forward, so the history is never rewritten.

A plan change is not a step in this chain. `customer.subscription.updated` -- and `subscriptionsUpdate` itself -- writes no snapshot at all, not even for an immediately effective upgrade; the new entitlements arrive with the next `invoice.paid`. Step 2 therefore stays the single place that grants paid access. See [what a change does to licences](#what-a-change-does-to-licences).

The subscription an invoice belongs to is read from `parent.subscription_details.subscription`, since the invoice no longer carries a top level `subscription` field. The paid period comes from the line item periods rather than from `invoice.period_end`, which Stripe documents as the window in which items can be added to the invoice and not as the service period.

#### Activating the customer

`checkout.session.completed` is the only activation path, and it resolves the customer before it touches anything:

- The Crater customer is read from the `crater_customer_id` the checkout itself wrote into the Stripe subscription metadata. A session created before that metadata existed still resolves through the Stripe customer id.
- The session's Stripe customer must be that Crater customer's `stripe_customer_id`. A mismatch is refused with `INVALID_CUSTOMER` and logged with internal and Stripe ids only, so a session can never activate or overwrite a customer it does not belong to.
- Syncing name, e-mail, phone, billing address, and tax ID and setting `status` to `active` happen in one database transaction. A customer is never left active with half of its billing data, and never left a draft after its data was stored.
- An already active customer stays active, so a redelivered event is a no-op for the lifecycle.
- If the customer or the subscription processing fails, the service returns an error and the event is not marked as processed, so Stripe's redelivery can run it again.

#### Keeping the subscription projection current

`customer.subscription.updated` is the event that reports every plan, quantity, and interval change, as well as a cancellation being set or taken back. Without it the projection would only ever be correct until the first change, and `checkoutCompletionStatus` would start refusing sessions whose metadata had moved on. It covers changes Crater itself made through `subscriptionsUpdate` and changes somebody made in the Stripe dashboard alike.

- The selection is read from the Stripe **metadata**, not from the line items. The metadata is what Crater writes on every change and what `checkoutCompletionStatus` compares the projection against, so the two cannot drift apart. A payload carrying no `plan` key at all -- a negotiated custom checkout configuration, or a subscription from before that metadata existed -- leaves the stored selection untouched instead of erasing it.
- `cancel_at` and `canceled_at` are always written, including as `null`, because a resumed subscription has to lose the cancellation the projection still shows. Status and period bounds are only written when the payload carries them, so a partial payload never blanks out what Crater already knows.
- The billing period is read from the subscription items, where Stripe now reports it, and falls back to the subscription level for older payloads.
- When the reported selection is the one the projection was waiting for, the scheduled change has arrived: the `pending_*` columns and the schedule pointer are cleared. A selection that is _not_ the pending one leaves the pending update in place.
- A payload the projection would refuse -- a period the customer's type is not billed in, for instance -- returns an error, so the event stays unprocessed and Stripe's redelivery can run it again.
- Like the licence-relevant events it can arrive before `checkout.session.completed` created the projection. A missing local subscription is treated as temporary and retried with the same polynomial backoff.

#### The local invoice projection

Both invoice events keep Crater's own copy of the Stripe invoice up to date through `Invoices::UpsertService`, which is keyed by the unique Stripe invoice ID and therefore idempotent. `Webhooks::BaseInvoiceEventService` maps the payload onto the record and always sets `subscription_id` to the subscription the event names, so a redelivery or a later `invoice.paid` for the same invoice keeps the relation correct. Number, PDF URL, currency, status, total, and tax are taken from the payload as they are; the tax is read from `total_taxes` and from the legacy `tax` field, and is never recomputed. The billing period comes from the line item periods and falls back to the invoice level `period_start` and `period_end` when a payload carries no line periods. A payload that lacks what an `Invoice` requires is skipped rather than stored half-filled.

Recording the invoice deliberately cannot fail the event: paid access is driven by the license snapshot alone, so a bookkeeping problem is logged and the license lifecycle proceeds unchanged. This projection is also the only source the license dashboard reads invoices from, so a dashboard request never queries Stripe.

Stripe does not guarantee webhook delivery order. In particular, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, or `customer.subscription.deleted` can arrive before `checkout.session.completed` has created the local `Subscription` projection. Crater treats a missing local subscription as a temporary error and retries the license-relevant event with polynomial backoff. Once the subscription exists, the retry continues normally and creates the corresponding license snapshot exactly once for that Stripe event.

#### Idempotency and failures

`ProcessedWebhookEvent` is keyed by the unique Stripe event ID, so a redelivered event is never processed twice. Redelivery of an already processed event is ignored, while redelivery of an existing unprocessed event schedules processing again. A failure inside `Licenses::UpsertService` leaves the event unprocessed.

Retries for a missing subscription are limited. If the subscription is still unavailable after all attempts, the event remains unprocessed so that a later Stripe redelivery can schedule it again. Retry exhaustion is logged with structured identifiers only: the event type, handler service, and Stripe subscription ID. Complete Stripe payloads and sensitive customer data are never logged.

## GraphQL API

### Entry point

All queries start at the root `Query` type. The currently documented query fields are:

| Query                      | Argument             | Return type                 | Purpose                                                                                                         |
| -------------------------- | -------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `currentUser`              | none                 | `User`                      | Returns the user authenticated by the current Crater session, or `null` when the request is anonymous.          |
| `echo`                     | `message: String!`   | `String!`                   | Verifies read access to the API and returns the supplied message.                                               |
| `subscriptionPrices`       | none                 | `[CheckoutPrice!]!`         | Returns active recurring Stripe prices and can be queried anonymously.                                          |
| `checkoutCompletionStatus` | `sessionId: String!` | `CheckoutCompletionStatus!` | Reports how far one Stripe Checkout Session has progressed towards licensed access. Requires an active session. |

#### License dashboard

`currentUser` is the entry point for the read-only dashboard. It exposes only data the authenticated user is a member of:

- `User.customers` is a `CustomerConnection!` over the **active** customers linked through `CustomerUser`. Customers of other users never appear, and neither do checkout drafts: they are filtered out of the nodes and of `count`, so a running or abandoned checkout never shows up in a dropdown, a counter, or the license dashboard. A draft's licenses are unreachable for the same reason, since they hang off the customer.
- `Customer.licenses` is a `LicenseConnection!` resolved through `customer.subscriptions.licenses`, ordered by `updated_at DESC` and then `id DESC` so equal timestamps still produce a stable order. A customer without licenses returns an empty connection rather than `null`.
- `License.invoices` is an `InvoiceConnection!` over the invoices of the license's subscription. A license without invoices returns an empty connection rather than `null`.
- `Customer.subscriptions` is a `SubscriptionConnection!` over the customer's subscriptions, ordered by `updated_at DESC` and then `id DESC` like the licenses. It is what the subscription mutations address, and a customer without subscriptions returns an empty connection rather than `null`.
- `License.subscription` is the way back from a licence to the subscription it is a snapshot of, so a dashboard that lists licences can offer the change and cancel actions without a second round trip.

All connections use the standard cursor pagination arguments (`first`, `after`, `last`, `before`) and expose `count`.

#### The Subscription type

`License` alone cannot carry this: licences are append-only snapshots, several of them belong to the same subscription, and none of them can express "cancelled as of 30 September" or "moving to Max on 1 October". `Subscription` is the addressable thing the mutations take and the state the UI renders.

| Field                                    | Type                        | Meaning                                                                            |
| ---------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `id`                                     | `SubscriptionID!`           | Global ID, the argument every subscription mutation takes                          |
| `status`                                 | `String!`                   | The Stripe status, such as `active`, `past_due`, or `canceled`                     |
| `plan`                                   | `String`                    | `pro`, `max`, or `custom`; `null` for a negotiated custom checkout configuration   |
| `paymentPeriod`                          | `CheckoutPaymentPeriod`     | The period it is billed in; `null` for a negotiated configuration                  |
| `deploymentType`                         | `String!`                   | `self_hosted` or `cloud`                                                           |
| `namespaceId`                            | `String`                    | Linked Sagittarius namespace, cloud only                                           |
| `aiTokens`, `workflowExecutions`         | `Int`                       | Quantities of the custom plan                                                      |
| `currentPeriodStart`, `currentPeriodEnd` | `Time`                      | The billing period Stripe reports                                                  |
| `cancelAt`                               | `Time`                      | When access ends because it was cancelled; `null` while no cancellation is pending |
| `canceledAt`                             | `Time`                      | When the cancellation was requested                                                |
| `pendingUpdate`                          | `SubscriptionPendingUpdate` | The change that applies at the end of the period; `null` while none is scheduled   |
| `createdAt`, `updatedAt`                 | `Time!`                     | Timestamps                                                                         |

`SubscriptionPendingUpdate` carries `plan!`, `paymentPeriod!`, `aiTokens`, `workflowExecutions`, and `effectiveAt!`. It is Crater's projection of the Stripe subscription schedule, not a second source of truth: without it the UI could not tell the user what applies from when after a downgrade, and the subscription would simply look unchanged.

Reading requires `read_subscription`, which `SubscriptionPolicy` derives from `read_customer` on the subscription's customer, so membership stays defined in one place.

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

Authorization uses the existing policies. `UserPolicy` grants `read_user` only for the user themselves, `CustomerPolicy` grants `read_customer` to members through `CustomerUser`, and `LicensePolicy`, `InvoicePolicy`, and `SubscriptionPolicy` derive `read_license`, `read_invoice`, `read_subscription`, and `update_subscription` from `read_customer`, so membership is defined in exactly one place. As with the other resource policies, being an admin grants no extra read access. An anonymous request returns `currentUser: null`; an invalid or inactive session token is still answered with HTTP `401 Unauthorized` before the query runs.

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

Prices and products are managed in Stripe. The listing query fetches active recurring prices directly instead of mirroring a product catalog locally. Checkout creation still resolves its `plan` argument through the configured `checkout.prices` mapping, which is keyed by plan, customer type, and payment period. Stripe retrieval failures surface as a GraphQL execution error based on `UNABLE_TO_LIST_PRICES`.

#### Lookup keys

`lookupKey` is the stable technical identifier for matching a price. Product names must not be used for that: they are freely editable in Stripe and are currently spelled inconsistently. Every checkout price carries a unique lookup key following this scheme:

```text
pro_b2b_monthly                   max_b2b_monthly
pro_b2b_quarterly                 max_b2b_quarterly
pro_b2b_yearly                    max_b2b_yearly

pro_b2c_weekly                    max_b2c_weekly
pro_b2c_monthly                   max_b2c_monthly
pro_b2c_yearly                    max_b2c_yearly

ai_token_b2b_monthly              workflow_execution_b2b_monthly
ai_token_b2b_quarterly            workflow_execution_b2b_quarterly
ai_token_b2b_yearly               workflow_execution_b2b_yearly

ai_token_b2c_weekly               workflow_execution_b2c_weekly
ai_token_b2c_monthly              workflow_execution_b2c_monthly
ai_token_b2c_yearly               workflow_execution_b2c_yearly
```

Every key is `<plan or component>_<b2b|b2c>_<period>`, and the periods are exactly the ones that customer type is billed in: no `pro_b2b_weekly` and no `ai_token_b2c_quarterly` exists.

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
- An unknown authentication scheme returns HTTP `401 Unauthorized`, as does any token that does not resolve to a usable session. Revoked, expired, and entirely unknown tokens are answered identically, so the response never reveals whether a session exists.
- Every session carries a server-set `expiresAt`; see [the session lifecycle](#the-session-lifecycle).
- The session token is returned by `usersLogin` only when the new `UserSession` is created. `usersLogout` revokes it and returns neither the token nor the session ID.
- The Sagittarius login token and the resulting Crater session token are distinct credentials with different header schemes.

### Mutations

Almost all mutations optionally accept `clientMutationId` and return it so the client can correlate the response with its request. Mutation payloads also contain a non-null `errors: [Error!]!` field.

#### Authentication and access

| Mutation      | Key arguments                                                                           | Result                                                                                          |
| ------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `usersLogin`  | `sagittariusToken: String!`, obtained from Sagittarius through `usersCreateCraterToken` | Newly created `UserSession` and its Crater session token                                        |
| `usersLogout` | none                                                                                    | Revokes the session of the `Authorization` header; returns only `errors` and `clientMutationId` |
| `echo`        | Optional message                                                                        | Returned message; verifies mutation access without changing data                                |

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
- The selected customer's type picks the B2B or B2C Prices, for `plan: pro` and `plan: max` as well as for the `plan: custom` components, and decides which payment periods exist at all. `paymentPeriod` outside that set -- `WEEKLY` for a business customer, `QUARTERLY` for a personal one -- is rejected with `INVALID_CHECKOUT_SELECTION` before Stripe is called. If the Price itself is configured for the other customer type only, the request is rejected with `CUSTOMER_TYPE_MISMATCH` instead of a generic selection error.
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

#### Subscriptions

| Mutation                     | Key arguments                                                                             | Result                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `subscriptionsPreviewUpdate` | `id: SubscriptionID!`, optional `plan`, `paymentPeriod`, `aiTokens`, `workflowExecutions` | `SubscriptionUpdatePreview` with the proration, the resulting invoice, and the effective moment |
| `subscriptionsUpdate`        | the same arguments                                                                        | Updated `Subscription`                                                                          |
| `subscriptionsCancel`        | `id: SubscriptionID!`, optional `immediately: Boolean` (default `false`)                  | Updated `Subscription` with `cancelAt` set                                                      |
| `subscriptionsResume`        | `id: SubscriptionID!`                                                                     | `Subscription` with the cancellation taken back                                                 |

All four require an active session; an anonymous request is refused with HTTP `403` before the mutation runs.

For `subscriptionsUpdate` and `subscriptionsPreviewUpdate`:

- At least one of `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions` has to be supplied; all four missing is `INVALID_CHECKOUT_SELECTION`.
- Arguments that are not supplied keep their current value. An interval change does not reset the quantities, and a quantity change does not move the plan.
- Quantities only exist for `plan: custom`. Moving `custom -> pro`/`max` removes the quantity line items and sets the stored quantities to `null`; moving `pro`/`max` -> `custom` requires quantities to come with it, otherwise `INVALID_CHECKOUT_SELECTION`. A quantity supplied for a standard plan is refused the same way.
- Each quantity is a positive integer of at most `1000000000`, the same bound the checkout enforces. Zero, negative, and non-integer values are refused before Stripe is called.
- The customer type is the stored `customerType` of the subscription's customer and decides which periods exist; see [the payment periods of a customer type](#the-payment-periods-of-a-customer-type). A Price configured for the other type only is `CUSTOMER_TYPE_MISMATCH`.
- A subscription from a `CustomCheckoutConfiguration` and one that is no longer active are `INVALID_SUBSCRIPTION`. Cancelling a negotiated subscription is still allowed.
- An update that changes nothing succeeds without calling Stripe.
- A subscription that does not exist and one belonging to somebody else are answered with the same `INVALID_SUBSCRIPTION` error and the same message, so the response never reveals which of the two it was -- the rule `checkoutCreateSession` already follows for `INVALID_CHECKOUT_CUSTOMER`.

`subscriptionsPreviewUpdate` is the counterpart of `checkoutCalculateTax` for a subscription that already exists, and it is not optional: an upgrade is charged immediately with a proration, so the client has to be able to name the amount before the user clicks. It reads only -- it retrieves the subscription, asks Stripe to preview an invoice, and returns. `SubscriptionUpdatePreview` contains the resolved `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions`, plus `effectiveAt`, `immediate`, `prorationAmount`, `total`, and `currency`. Amounts are integers in the smallest currency unit and the preview is non-binding. Because it runs the same planner as `subscriptionsUpdate`, the `effectiveAt` it reports is the moment the update then actually establishes.

`subscriptionsCancel` defaults to `cancel_at_period_end`, so the user keeps the period they already paid for and `cancelAt` says when access ends. `subscriptionsResume` takes that back until it has happened; a subscription Stripe has already ended cannot be resumed and is `INVALID_SUBSCRIPTION`. Resuming a subscription with nothing to take back succeeds without calling Stripe, so a double click cannot produce an error.

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

| Code                                    | Meaning                                                                                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOMER_TYPE_MISMATCH`                | The selected customer's type does not match the selected checkout                                                                                                                      |
| `INVALID_CHECKOUT_CUSTOMER`             | The selected customer does not exist or is not accessible to the current user                                                                                                          |
| `INVALID_CHECKOUT_SESSION`              | The checkout session could not be created                                                                                                                                              |
| `INVALID_CHECKOUT_SELECTION`            | The selected plan, payment period, quantity, or configured Price combination is invalid, in a checkout and in a change to an existing subscription alike                               |
| `INVALID_CUSTOMER`                      | The customer is invalid                                                                                                                                                                |
| `INVALID_CUSTOM_CHECKOUT_CONFIGURATION` | The custom checkout configuration is invalid                                                                                                                                           |
| `INVALID_DISCOUNT_CODE`                 | The discount code is invalid or inactive                                                                                                                                               |
| `INVALID_INVOICE`                       | The invoice is invalid                                                                                                                                                                 |
| `INVALID_LICENSE`                       | The license is invalid                                                                                                                                                                 |
| `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` | The selected customer does not exist, is not accessible to the current user, or has no billing account to set a payment method up for                                                  |
| `INVALID_PAYMENT_METHOD_SETUP_SESSION`  | The payment method setup could not be created                                                                                                                                          |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in                                                                                                                                         |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid, does not exist, is not accessible to the current user, is no longer active, or comes from a custom checkout configuration and therefore cannot be changed |
| `INVALID_TAX_CALCULATION`               | Stripe rejected the tax calculation                                                                                                                                                    |
| `INVALID_USER`                          | The local user derived from Sagittarius is invalid                                                                                                                                     |
| `MISSING_PERMISSION`                    | The user does not have the required permission                                                                                                                                         |
| `SAGITTARIUS_UNAVAILABLE`               | Sagittarius could not be reached or returned an unexpected response                                                                                                                    |
| `UNABLE_TO_LIST_PRICES`                 | Active recurring Stripe prices could not be retrieved                                                                                                                                  |

## Types and conventions

- `String`: UTF-8 text
- `Int`: signed 32-bit integer
- `Float`: double-precision IEEE 754 floating-point number
- `Boolean`: `true` or `false`
- `Time`: ISO 8601 timestamp, for example `2023-12-15T17:31:00Z`
- `CustomerID`, `UserID`, `UserSessionID`, `LicenseID`, `SubscriptionID`, and `CustomCheckoutConfigurationID`: type-specific global IDs
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
16. To change the subscription later, the client reads it through `Customer.subscriptions` or `License.subscription`, calls `subscriptionsPreviewUpdate` to show the amount and the effective moment, and then `subscriptionsUpdate`. An upgrade applies at once and is prorated; a downgrade or an interval change is reported back as `pendingUpdate` and applies at the end of the period. `subscriptionsCancel` ends the subscription at the end of the paid period, and `subscriptionsResume` takes that back. The verified `customer.subscription.updated` webhook is what makes the projection reflect the change, and the new entitlements arrive with the next `invoice.paid`.

If the user abandons the checkout at any point between steps 6 and 11, the customer simply stays a draft: it never appears anywhere, and `Customers::CleanupDraftsJob` removes it and its Stripe Customer once `checkout.draft_retention_hours` have passed.
