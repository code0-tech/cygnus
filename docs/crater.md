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
- name, email, and optional phone number
- Stripe customer ID
- Stripe tax ID

The GraphQL API additionally returns a global ID and creation and update timestamps.

`CustomerAddress` and `CustomerAddressInput` contain:

- `line1` and `line2`
- `city`
- `state`
- `postalCode`
- `country` as a country code

`taxIdType` and `taxIdValue` are optional, including for business customers, because Stripe Checkout can collect a tax ID through its `TaxIdElement`. When one of them is supplied, the other is required as well; a half-filled pair returns `INVALID_CUSTOMER`. A tax ID supplied up front is registered on the Stripe Customer immediately, and one collected during checkout is synced back from the completed session.

`customersCreate` requires nothing but `customerType`. `name`, `email`, `address`, `phone`, and the tax ID pair are all optional, because the client collects contact and billing details during checkout through Stripe's `ContactDetailsElement` and `BillingAddressElement` and Crater syncs them back from the completed session. A supplied email must still be well formed.

The columns themselves stay nullable, and `email` and `name` are still nullable in the GraphQL `Customer` type. Stripe Checkout collects contact and billing details of its own through `ContactDetailsElement` and `BillingAddressElement`, and Crater syncs those back from the completed session -- a sync that fills fields in, never blanks them out.

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

Crater creates Stripe Checkout Sessions in subscription mode for the current customer. Checkout uses Stripe's embedded Elements/custom UI mode rather than redirecting the customer to a Stripe-hosted Checkout page. A checkout uses the Pro, Max, or dynamic Custom plan.

The customer a session is created for has to belong to the authenticated user through `CustomerUser`. `customerId` is optional: left out, the checkout runs for the user's own customer -- the oldest one, so repeating the request resolves the same customer -- and a user without any customer is refused with `INVALID_CHECKOUT_CUSTOMER`. Creating the session never creates a customer; `customersCreate` is the only thing that does.

A `CheckoutSession` returns:

- the Stripe session ID
- the client secret used by the frontend to initialize Stripe's embedded checkout
- the expiration time as a Unix timestamp

Additional checkout features include:

- selecting the billing period of the customer's type: monthly, quarterly, or yearly, the same for business and personal customers
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

Stripe Price IDs are resolved exclusively on the server from `checkout.prices`. Every plan is priced per customer type: Pro, Max, and each dynamic custom component resolve their Price from the plan or component, the customer's type, and the payment period. The customer type is always the stored `customerType` of the selected customer, never something the client sends, so a B2C client cannot check out at a B2B price.

#### The payment periods of a customer type

Which periods exist is a property of the **customer type**, not of the plan. It is the same split everywhere -- for Pro, for Max, and for the custom components:

| Customer type    | Payment periods                  |
| ---------------- | -------------------------------- |
| `business` (B2B) | `monthly`, `quarterly`, `yearly` |
| `personal` (B2C) | `monthly`, `quarterly`, `yearly` |

`CheckoutPaymentPeriod` offers exactly these three values, and both customer types are billed in the same set. A payment period outside that set is rejected with `INVALID_CHECKOUT_SELECTION` before any Price is looked up, in `checkoutCreateSession`. `Subscription` validates the stored period against its customer's type with the same rule, so a projection can never hold a combination the checkout would refuse.

**This section applies unchanged to changes of an existing subscription.** `subscriptionsUpdate` and `subscriptionsPreviewUpdate` resolve their target Price through the very same rules: the customer type is the stored `customerType` of the subscription's customer and never something the client sends, that type decides which periods exist at all, and a period outside the set is refused before Stripe is called. A subscription can therefore never be moved into a plan, period, or Price combination a fresh checkout would have rejected. The same rule also guards the pending half of a scheduled change, so a `pendingUpdate` is always a selection the checkout would accept.

A plan or component that is configured for the other customer type only is rejected with `CUSTOMER_TYPE_MISMATCH` rather than falling back to that type's Price; one configured for neither type is a plain `INVALID_CHECKOUT_SELECTION`.

Monetary amounts are transferred as integers in the smallest currency unit.

`CheckoutDiscount` contains the code and duration, plus either a fixed discount amount with an optional currency or a percentage discount. `durationInMonths` accompanies a `repeating` duration, and `maxRedemptions`/`timesRedeemed` report the coupon's redemption usage.

#### Discounts in a checkout

A discount is validated by Crater and applied by the client, and the two steps are deliberately separate.

- `checkoutValidateDiscount` resolves a code against Stripe and answers with the `CheckoutDiscount` behind it, or with `INVALID_DISCOUNT_CODE`. It is a read; it touches no session and changes nothing. The client uses it to name the discount -- "10% off" -- while the user is still typing.
- Applying it happens in the browser. Every Checkout Session Crater creates carries `allow_promotion_codes: true`, so the client calls Stripe's `checkout.applyPromotionCode()` on the session it already holds, and `checkout.removePromotionCode()` to take it back. Stripe recalculates the totals in place.

That is why `checkoutCreateSession` has no `promotionCode` argument. A discount entered, removed, and entered again is the same session throughout -- the user does not lose the address, tax ID, or payment details already filled in, and Crater does not create a Stripe session per attempt. Crater consequently never sends `discounts` when creating a session; Stripe rejects `discounts` and `allow_promotion_codes` together, and the client-side flow is the one that survives a change of mind.

`checkoutValidateDiscount` stays available and unchanged. Validating a code is not the same as applying it: a code the client shows as valid is still applied through Stripe, and a code that Stripe refuses at that point leaves the session untouched.

### Custom checkout configuration

`CustomCheckoutConfiguration` records from earlier releases are retained for historical compatibility. New configurations cannot be created or supplied to checkout through GraphQL. See [the current checkout API](docs/checkout-api.md) for required enums, the `NamespaceID` scalar, and configurable customer-specific quantity limits. Legacy records contain:

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
- `configuration` and `pricing` are read back from what Crater verified, never from what the client sent; see [the pricing overview](#the-pricing-overview).
- No Stripe customer, subscription, invoice, or payment method IDs are returned.
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

#### The pricing overview

A success page has to say what the user just bought and what it cost, and it must not arrive at those figures itself. `pricing` and `configuration` are the authoritative answer, so no client re-derives a total from a price list, a discount percentage, and a tax rate.

`pricing` is Stripe's own arithmetic, copied verbatim from the verified session:

| Field      | Source on the Checkout Session  |
| ---------- | ------------------------------- |
| `currency` | `currency`                      |
| `subtotal` | `amount_subtotal`               |
| `discount` | `total_details.amount_discount` |
| `tax`      | `total_details.amount_tax`      |
| `total`    | `amount_total`                  |

Every amount is an integer in the smallest currency unit, the same convention the rest of the API uses. Crater computes none of them and reconciles none of them against each other: it never checks that `subtotal - discount + tax` is `total`, because Stripe's number is the number that was charged. The discount and Stripe Tax are therefore already inside `total`, and a hundred-percent discount is `total: 0` -- a real zero, never `null` and never a dropped block. `discount` and `tax` are `0` when Stripe reports none, so a client can add them to a receipt unconditionally.

`configuration` is the checkout selection Crater wrote into the subscription metadata when it created the session, read back after the verification above has re-checked it. It is never taken from client arguments:

| Field                            | Meaning                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `customerType`                   | `BUSINESS` or `PERSONAL`, from the resolved Crater customer      |
| `deploymentType`                 | `SELF_HOSTED` or `CLOUD`                                         |
| `plan`                           | `PRO`, `MAX`, `CUSTOM`, or `null` for a negotiated configuration |
| `paymentPeriod`                  | The billed period, or `null` for a negotiated configuration      |
| `aiTokens`, `workflowExecutions` | Quantities, set only for `plan: custom`                          |

The metadata is used rather than the `Subscription` projection because it is already there in `FULFILLMENT_PENDING`, where no projection exists yet, and the two agree wherever both exist -- `local_subscription_matches?` refuses the session otherwise. A client polling from `FULFILLMENT_PENDING` to `READY` therefore sees the figures stand still while only the state moves, and the overview does not appear halfway through.

Both blocks are nullable and follow one rule: **they are set exactly when the session is `complete`**, which is `PAYMENT_PENDING`, `FULFILLMENT_PENDING`, and `READY`. They are `null` in `CHECKOUT_PENDING` and `FAILED`, where the amounts are not final and no verified selection exists. A session that carries no `currency`, `amount_subtotal`, or `amount_total` reports `pricing: null` rather than a guess.

Nothing here is stored. There is no pricing column, no new projection, and no second copy of a total that could drift from Stripe's; the block is assembled per request from the session that was already fetched, in the same single `retrieve` call. Adding the fields breaks no existing client, because a query that does not select them is answered exactly as before.

#### The client flow

```graphql
query CheckoutCompletionStatus($sessionId: String!) {
    checkoutCompletionStatus(sessionId: $sessionId) {
        state
        customerId
        licenseId
        configuration {
            customerType
            deploymentType
            plan
            paymentPeriod
            aiTokens
            workflowExecutions
        }
        pricing {
            currency
            subtotal
            discount
            tax
            total
        }
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
- A customer that does not exist, one belonging to somebody else, and one without a `stripe_customer_id` are all answered with `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` and an identical message, so the response never reveals which of the three it was.
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

#### Listing and removing stored payment methods

`customerPaymentMethodSetupCreate` and the webhook above cover adding a payment method and promoting it to the default. Reading and removing them need no SetupIntent, because they act on payment methods Stripe has already collected and attached, and neither is a root operation of its own: both hang off the customer.

`Customer.paymentMethods` is the list. It carries the Stripe PaymentMethod IDs stored on the customer, not only the current default, and nothing else -- brands, last four digits, and expiry dates are read where they are displayed, through `customerPaymentMethod(paymentMethodId)` for any id of the list and through `subscriptionPaymentMethod(subscriptionId)` for the current default of one subscription. Crater stores none of the list: it comes from `payment_methods.list` on every request. A customer with no Stripe customer has an empty list rather than an error. A Stripe outage is `PAYMENT_METHOD_UNAVAILABLE`, deliberately never an empty list, because the list is what a client sends back to `customersUpdate`.

`customerPaymentMethod` describes one of them. It takes an id out of `Customer.paymentMethods` and answers with the same non-sensitive display details as `subscriptionPaymentMethod`, so a client never has to show a raw `pm_...` id:

```graphql
query {
    customerPaymentMethod(paymentMethodId: "pm_...") {
        type
        brand
        last4
        expiresMonth
        expiresYear
    }
}
```

`customersUpdate` removes them. Its optional `paymentMethods` argument names what the customer **keeps**: every stored payment method absent from the list is detached in Stripe, an id the customer does not have is nothing to act on, and omitting the argument entirely leaves all of them alone. Nothing is ever attached this way; collecting a payment method stays with the SetupIntent flow.

A removal is refused with `PAYMENT_METHOD_IN_USE` while the payment method is charged for anything:

- it is the customer's `invoice_settings.default_payment_method`, or
- it is the `default_payment_method` of one of the customer's non-terminal subscriptions (any status other than `canceled` or `incomplete_expired`, the same set `Subscription::TERMINAL_STRIPE_STATUSES` names elsewhere).

Both checks read straight from Stripe rather than Crater's local `Subscription` projection, so they hold even where the projection has not caught up yet. The customer-level default is checked first, because it costs one Stripe call and answers the common case without a second one. Freeing a payment method for removal means moving the conflicting default elsewhere first, either with a fresh `customerPaymentMethodSetupCreate` or with the `paymentMethodId` argument of `subscriptionsUpdate` below.

The reconciliation runs **before** the customer's own fields are written, so a refused removal leaves the whole `customersUpdate` unapplied instead of renaming the customer and then failing.

Access is the same `CustomerPolicy` membership rule as the rest of this section: reading the list needs `read_customer`, changing it needs `update_customer`. A payment method id that does not exist and one belonging to a different Stripe customer are answered identically with `INVALID_PAYMENT_METHOD`, the same anti-enumeration idiom `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` already follows for the customer itself: the id is always resolved server-side through `payment_methods.retrieve` and compared against the customer's `stripe_customer_id`, never trusted from the request.

#### The payment method of a subscription

`Subscription.paymentMethodId` is what the subscription is billed with. It carries the Stripe PaymentMethod ID and nothing else; the display details behind that id -- type, brand, last four digits, expiry -- are read with the `subscriptionPaymentMethod(subscriptionId)` query. Both read Stripe on every request, because Crater stores no payment method data and has no `default_payment_method` column. The id is `null` while the subscription has no default of its own, and a Stripe outage is `PAYMENT_METHOD_UNAVAILABLE` rather than a `null` that would read as "none set".

`subscriptionsUpdate` changes it. Its optional `paymentMethodId` argument points the subscription at one of the customer's **already-stored** payment methods, so no SetupIntent, no client secret, and no round trip through Stripe Elements are involved. Collecting a new payment method stays with `customerPaymentMethodSetupCreate`, which attaches it to the customer; from there any subscription can be pointed at it.

- `paymentMethodId` is resolved server-side through `payment_methods.retrieve` and must belong to the subscription's own customer; a payment method that does not exist and one belonging to a different customer are both `INVALID_PAYMENT_METHOD` with an identical message.
- Access is `update_subscription`, the same ability the rest of `subscriptionsUpdate` requires; a subscription that does not exist, one belonging to somebody else, and a terminal one are all `INVALID_SUBSCRIPTION`.
- It applies **immediately**, independently of when the plan half of the same request takes effect: the next invoice has to be charged to the new payment method whether the plan change is prorated now or scheduled for the end of the period.
- It runs before the plan change, so a payment method Stripe refuses leaves the subscription untouched -- no proration, no schedule.
- Supplying only `paymentMethodId` is a valid request: the plan half is then a no-op and costs no Stripe write of its own.
- Nothing is stored locally, so the change is visible through `Subscription.paymentMethodId` on the next read.

#### Checkout return URLs

The checkout is the only flow whose return URL passes through Crater. `Crater::ReturnUrl` accepts only absolute `http` or `https` URLs whose origin appears in `checkout.allowed_return_origins`; anything relative, scheme-less, or pointing at another origin is rejected before Stripe is called, so no request can make Stripe redirect a user to a host we do not control.

### Subscriptions, invoices, and licenses

`Subscription` stores the deployment type, Stripe status, unique Stripe subscription ID, optional Sagittarius namespace ID, plan, payment period, and optional AI Token and Workflow Execution quantities. The stored quantities are validated against the same customer-specific range (1 to 10,000,000 by default) the checkout enforces, and the stored payment period against the periods its customer's type is billed in.

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

Self-hosted licenses can be exported as a signed license file. Cloud licenses can be linked to a Sagittarius namespace or transferred to another namespace.

#### What a license carries

`restrictions` and `options` are the two free-form hashes the `code0-license` format hands to the installation running on the license. Crater derives both from the subscription and stores them on the snapshot, so they describe what was in force when that snapshot was appended rather than what the subscription looks like now.

| Hash           | Key                  | Value                                                 |
| -------------- | -------------------- | ----------------------------------------------------- |
| `restrictions` | `aiTokens`           | AI Token quantity, only for the custom plan           |
| `restrictions` | `workflowExecutions` | Workflow Execution quantity, only for the custom plan |
| `options`      | `paymentPeriod`      | `monthly`, `quarterly`, or `yearly`                   |
| `options`      | `customerType`       | `personal` or `business`                              |
| `options`      | `plan`               | `PRO`, `MAX`, or `CUSTOM`                             |

The keys are camelCase because the product reads them, not Rails; `Code0::License.load` symbolizes them again on the consuming side. The plan is upper case there and lower case in Crater's own storage and GraphQL.

Only keys that have a value are written. A Pro or Max subscription carries no quantity restriction at all rather than one set to null, so `restricted?(:aiTokens)` answers `false` for it, and a subscription from a negotiated `CustomCheckoutConfiguration` carries neither `plan` nor `paymentPeriod`.

#### The license file

`licensesExport` returns a file produced by the `code0-license` gem, not a hand-rolled payload, so it is the format the product already knows how to read. `Code0::License.load` verifies it against the matching public key and yields the licensee, the validity window, the restrictions, and the options.

- The file is signed with the RSA private key from `license.private_key`. Without that key the export is refused with `INVALID_LICENSE`; Crater never hands out an unsigned file.
- `Code0::License.encryption_key` is process-wide state that `export` only reads, so Crater sets it exactly once at boot in an initializer. A malformed key fails the boot rather than degrading to unsigned output.
- The payload is wrapped in the gem's own boundary, `-----BEGIN CODE0 LICENSE-----` to `-----END CODE0 LICENSE-----`, and can be written to disk exactly as returned.
- `licensee` names the customer id, name, and email, plus the license and subscription ids so an installation can be matched back in a support case. No payment data and no session data goes into the file.
- Only self-hosted licenses can be exported, and only by a member of the license's customer.

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

An upgrade is immediate so the user gets what they are being charged for straight away. A downgrade waits and produces no credit, because refunding the unused remainder would create balances that neither the bookkeeping nor the append-only license chain can represent. An interval change always waits: switching from yearly to monthly halfway through a paid year would credit the rest of that year.

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

#### What a change does to licenses

Nothing directly. Licenses stay append-only, and a plan change rewrites no existing snapshot.

**A change never writes a license, not even an immediate upgrade.** The entitlements of the new plan reach the user through the next `invoice.paid` snapshot, which is the only event that grants paid access. This keeps a single writer for the license chain: a plan the user was upgraded to but has not been invoiced for yet does not silently become an entitlement, and there is no snapshot that would have to be revoked if the proration invoice then fails.

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
| `checkout.session.completed`    | `Webhooks::HandleCheckoutSessionCompletedService` | Upserts the subscription projection and syncs contact details, address, and tax ID back to the customer. Grants no access.                                               |
| `invoice.paid`                  | `Webhooks::HandleInvoicePaidService`              | Records the invoice locally and appends a `paid` license snapshot. This is the only event that grants paid access.                                                       |
| `invoice.payment_failed`        | `Webhooks::HandleInvoicePaymentFailedService`     | Records the invoice locally and appends a `payment_failed` snapshot that carries the previous `end_date` and grace period forward.                                       |
| `customer.subscription.updated` | `Webhooks::HandleSubscriptionUpdatedService`      | Syncs the projection: plan, period, quantities, status, `cancel_at`, and the billing period bounds. Grants no access and writes no license.                              |
| `customer.subscription.deleted` | `Webhooks::HandleSubscriptionDeletedService`      | Sets the local Stripe status to `canceled` and appends a `canceled` snapshot.                                                                                            |
| `setup_intent.succeeded`        | `Webhooks::HandleSetupIntentSucceededService`     | Promotes the collected payment method to the Stripe customer's `invoice_settings.default_payment_method`. Stores nothing locally and touches no license or subscription. |

#### From checkout to license

1. `checkout.session.completed` creates or updates the `Subscription` and the customer's contact and billing data. No `License` exists yet, so the customer has no paid access.
2. Stripe issues an invoice for the subscription. `invoice.paid` is the point at which access is granted: `Licenses::UpsertService` appends a `paid` license whose `end_date` is the paid service period end plus `grace_period_days`.
3. `invoice.payment_failed` appends a `payment_failed` snapshot. The `end_date` is deliberately not moved, so entitlements remain valid until the already granted period plus grace period lapses. A later successful payment appends a fresh `paid` snapshot and extends the end date again.
4. `customer.subscription.deleted` sets the subscription's Stripe status to `canceled` and appends a `canceled` snapshot.

Licenses are append-only: every transition adds a row that carries the previous snapshot's entitlements forward, so the history is never rewritten. Only the newest row of a subscription is in force; the API reflects that and does not hand the raw chain to a dashboard, see [the current snapshot and the history](#the-current-snapshot-and-the-history).

A plan change is not a step in this chain. `customer.subscription.updated` -- and `subscriptionsUpdate` itself -- writes no snapshot at all, not even for an immediately effective upgrade; the new entitlements arrive with the next `invoice.paid`. Step 2 therefore stays the single place that grants paid access. See [what a change does to licenses](#what-a-change-does-to-licenses).

The subscription an invoice belongs to is read from `parent.subscription_details.subscription`, since the invoice no longer carries a top level `subscription` field. The paid period comes from the line item periods rather than from `invoice.period_end`, which Stripe documents as the window in which items can be added to the invoice and not as the service period.

#### Syncing the customer

`checkout.session.completed` carries the details Stripe collected during the checkout, and it resolves the customer before it touches anything:

- The Crater customer is read from the `crater_customer_id` the checkout itself wrote into the Stripe subscription metadata. A session created before that metadata existed still resolves through the Stripe customer id.
- The session's Stripe customer must be that Crater customer's `stripe_customer_id`. A mismatch is refused with `INVALID_CUSTOMER` and logged with internal and Stripe ids only, so a session can never overwrite a customer it does not belong to.
- Syncing name, e-mail, phone, billing address, and tax ID happens in one database transaction, so a customer is never left with half of the collected data.
- The sync fills fields in and never blanks them out, so a redelivered event changes nothing.
- If the customer or the subscription processing fails, the service returns an error and the event is not marked as processed, so Stripe's redelivery can run it again.

#### Keeping the subscription projection current

`customer.subscription.updated` is the event that reports every plan, quantity, and interval change, as well as a cancellation being set or taken back. Without it the projection would only ever be correct until the first change, and `checkoutCompletionStatus` would start refusing sessions whose metadata had moved on. It covers changes Crater itself made through `subscriptionsUpdate` and changes somebody made in the Stripe dashboard alike.

- The selection is read from the Stripe **metadata**, not from the line items. The metadata is what Crater writes on every change and what `checkoutCompletionStatus` compares the projection against, so the two cannot drift apart. A payload carrying no `plan` key at all -- a negotiated custom checkout configuration, or a subscription from before that metadata existed -- leaves the stored selection untouched instead of erasing it.
- `cancel_at` and `canceled_at` are always written, including as `null`, because a resumed subscription has to lose the cancellation the projection still shows. Status and period bounds are only written when the payload carries them, so a partial payload never blanks out what Crater already knows.
- The billing period is read from the subscription items, where Stripe now reports it, and falls back to the subscription level for older payloads.
- When the reported selection is the one the projection was waiting for, the scheduled change has arrived: the `pending_*` columns and the schedule pointer are cleared. A selection that is _not_ the pending one leaves the pending update in place.
- A payload the projection would refuse -- a period the customer's type is not billed in, for instance -- returns an error, so the event stays unprocessed and Stripe's redelivery can run it again.
- Like the license-relevant events it can arrive before `checkout.session.completed` created the projection. A missing local subscription is treated as temporary and retried with the same polynomial backoff.

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

- `User.customers` is a `CustomerConnection!` over the customers linked through `CustomerUser`. Customers of other users never appear.
- `Customer.licenses` is a `LicenseConnection!` over **the snapshot currently in force for each of the customer's subscriptions**, ordered by `updated_at DESC` and then `id DESC` so equal timestamps still produce a stable order. A customer without licenses returns an empty connection rather than `null`. It is one entry per subscription, never the whole append-only chain: see [the current snapshot and the history](#the-current-snapshot-and-the-history).
- `License.invoices` is an `InvoiceConnection!` over the invoices of the license's subscription. A license without invoices returns an empty connection rather than `null`.
- `Customer.subscriptions` is a `SubscriptionConnection!` over the customer's subscriptions, ordered by `updated_at DESC` and then `id DESC` like the licenses. It is what the subscription mutations address, and a customer without subscriptions returns an empty connection rather than `null`.
- `License.subscription` is the way back from a license to the subscription it is a snapshot of, so a dashboard that lists licenses can offer the change and cancel actions without a second round trip.

All connections use the standard cursor pagination arguments (`first`, `after`, `last`, `before`) and expose `count`.

#### The Subscription type

`License` alone cannot carry this: licenses are append-only snapshots, several of them belong to the same subscription, and none of them can express "cancelled as of 30 September" or "moving to Max on 1 October". `Subscription` is the addressable thing the mutations take and the state the UI renders.

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
                subscriptions(first: 5) {
                    count
                    nodes {
                        id
                        status
                        plan
                        pendingUpdate {
                            plan
                            paymentPeriod
                            effectiveAt
                        }
                        licenses(first: 20) {
                            count
                            nodes {
                                id
                                status
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

Authorization uses the existing policies. `UserPolicy` grants `read_user` only for the user themselves, `CustomerPolicy` grants `read_customer` to members through `CustomerUser`, and `LicensePolicy`, `InvoicePolicy`, and `SubscriptionPolicy` derive `read_license`, `read_invoice`, `read_subscription`, and `update_subscription` from `read_customer`, so membership is defined in exactly one place. As with the other resource policies, being an admin grants no extra read access. An anonymous request returns `currentUser: null`; an invalid or inactive session token is still answered with HTTP `401 Unauthorized` before the query runs.

#### The current snapshot and the history

Licenses are append-only: a subscription grows a row on every payment, failed payment, and cancellation. A subscription that has been paid three times therefore has three `License` rows, but the user holds **one** license -- the newest row is the entitlement in force, everything before it is history.

`Customer.licenses` reflects that and returns one license per subscription, the newest. Listing the raw rows would show one subscription as three licenses and count it as three, which is neither what the user bought nor what they should see in a dashboard.

The history is reached through the subscription:

| Field                         | Returns                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `Customer.licenses`           | One license per subscription: the snapshot in force                                    |
| `Subscription.currentLicense` | The same snapshot for one subscription, `null` until the first paid invoice created it |
| `Subscription.licenses`       | Every snapshot of that subscription, newest first -- the history                       |
| `License.subscription`        | The way from a snapshot back to its subscription                                       |

`Subscription.currentLicense` is batched with a dataloader source (`Sources::CurrentLicenseBySubscription`), so listing many subscriptions with their current license costs a constant number of queries.

Because every snapshot of a subscription resolves the same invoice history, `License.invoices` returns the identical result whichever snapshot it is asked on.

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

pro_b2c_monthly                   max_b2c_monthly
pro_b2c_quarterly                 max_b2c_quarterly
pro_b2c_yearly                    max_b2c_yearly

ai_token_b2b_monthly              workflow_execution_b2b_monthly
ai_token_b2b_quarterly            workflow_execution_b2b_quarterly
ai_token_b2b_yearly               workflow_execution_b2b_yearly

ai_token_b2c_monthly              workflow_execution_b2c_monthly
ai_token_b2c_quarterly            workflow_execution_b2c_quarterly
ai_token_b2c_yearly               workflow_execution_b2c_yearly
```

Every key is `<plan or component>_<b2b|b2c>_<period>`, and the periods are exactly the ones that customer type is billed in: monthly, quarterly, and yearly for both B2B and B2C.

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

| Mutation                           | Key arguments                                                  | Result                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `customersCreate`                  | `customerType!`, optional contact details, address, and tax ID | Created `Customer`                                                                                          |
| `customersUpdate`                  | `id!`, optional contact details, address, and `paymentMethods` | Updated `Customer`; stored payment methods the `paymentMethods` list no longer names are detached in Stripe |
| `customersDelete`                  | `id!`                                                          | Deleted `Customer`                                                                                          |
| `customerPaymentMethodSetupCreate` | `customerId!`                                                  | Stripe SetupIntent `clientSecret` for collecting a new default payment method                               |

`customersCreate` needs the customer type; everything else can follow later:

```graphql
customersCreate(
  input: {
    customerType: CustomerType!      # PERSONAL or BUSINESS
    name: String                     # optional
    email: String                    # optional
    address: CustomerAddressInput    # optional
    phone: String                    # optional
    taxIdType: String                # optional, only together with taxIdValue
    taxIdValue: String               # optional, only together with taxIdType
  }
): CustomersCreatePayload
```

Its behaviour:

- Every call creates a customer. Nothing is reused: a user that already has one and asks for another gets a second, distinct customer with its own Stripe Customer, and the existing one keeps its membership.
- `customerType` is the only non-null argument, so a customer can be created with nothing else at all. A malformed email is `INVALID_CUSTOMER`.
- `address` is optional, and so are the inner fields of `CustomerAddressInput`. A missing address and an address object with nothing filled in both persist no `CustomerAddress` and send no address to Stripe. Stripe Checkout collects contact details and the billing address through its `ContactDetailsElement` and `BillingAddressElement`, and the completed session syncs them back.
- There is no checkout-flow argument. The checkout runs for a customer that already exists; see [checkout and Stripe](#checkout-and-stripe).

#### Checkout

| Mutation                   | Key arguments                                                                                           | Result                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `checkoutValidateDiscount` | `code: String!`                                                                                         | `CheckoutDiscount`                                        |
| `checkoutCreateSession`    | `deploymentType!`, `plan!`, `paymentPeriod!`, `returnUrl!`, optional `customerId` and custom quantities | Embedded `CheckoutSession` with a frontend `clientSecret` |

For `checkoutCreateSession`:

- The request must include `Authorization: Session <crater-session-token>`; the mutation is not anonymously accessible.
- `customerId` is optional. A client that lets the user pick between several customers passes the chosen global `CustomerID`; one that does not leaves it out, and Crater resolves the authenticated user's own customer -- the oldest one, so a repeated request resolves the same customer. A user without any customer is refused with `INVALID_CHECKOUT_CUSTOMER`; `customersCreate` has to run first.
- A supplied customer must be linked to the authenticated user through `CustomerUser`, which is the same membership rule `CustomerPolicy` uses for `read_customer`. A customer that does not exist and one belonging to somebody else are both answered with `INVALID_CHECKOUT_CUSTOMER` and an identical message, so the response never reveals whether an id exists. The fallback only ever looks at the user's own customers, so it can never reach somebody else's.
- A repeated `checkoutCreateSession` for the same customer creates a new Stripe session but no additional customer.
- The selected customer's type picks the B2B or B2C Prices, for `plan: pro` and `plan: max` as well as for the `plan: custom` components; both customer types are billed monthly, quarterly, or yearly. A `paymentPeriod` outside that set is rejected with `INVALID_CHECKOUT_SELECTION` before Stripe is called. If the Price itself is configured for the other customer type only, the request is rejected with `CUSTOMER_TYPE_MISMATCH` instead of a generic selection error.
- The Stripe Checkout Session is created with the selected customer's `stripe_customer_id`, so the contact details, billing address, and tax ID that Stripe collects are synced back to exactly that customer. Its Crater customer ID is stored in the subscription metadata as `crater_customer_id`.
- Crater never sends `customer_email`; the Stripe Customer is referenced by ID, and Stripe rejects both parameters together. An email already on the Stripe Customer is therefore never restated, and a missing one is collected by the client's `ContactDetailsElement`.
- A regular checkout uses `plan`, `paymentPeriod`, and, where applicable, `deploymentType` and `namespaceId`. There is no `promotionCode` argument; see [discounts](#discounts-in-a-checkout).
- `plan: custom` accepts positive `aiTokens` and `workflowExecutions`; at least one quantity is required and the authenticated customer's stored type selects B2B or B2C Prices.
- Each custom quantity must be a positive integer within its customer-specific limit (10,000,000 by default), which stays inside the signed 32-bit range of the GraphQL `Int` scalar and of the `integer` database columns. Anything outside that range, including zero, negative, decimal, and non-integer values, is rejected with `INVALID_CHECKOUT_SELECTION` before Stripe is called. Stripe documents no maximum for a line item's initial `quantity`; its `999999` cap applies to `adjustable_quantity.maximum`, which Crater does not use.
- `namespaceId` is only relevant to cloud deployments.
- `returnUrl` must have an origin listed in `checkout.allowed_return_origins`.
- Stripe receives `ui_mode: elements`; the frontend initializes the custom checkout UI with the returned `clientSecret`.
- Every session is created with `allow_promotion_codes: true`, so the client can apply and remove a discount inside the session it already has. Crater sends no `discounts`; see [discounts in a checkout](#discounts-in-a-checkout).
- Stripe collects the billing address, updates the customer's address and name, and calculates tax automatically.
- The session enables `tax_id_collection`, so a business customer without a stored tax ID can supply one through Stripe's `TaxIdElement`. The collected tax ID is resolved back to its Stripe `TaxId` object and stored on the Crater customer by the `checkout.session.completed` webhook.
- The resulting Stripe subscription metadata also contains `plan`, `payment_period`, and dynamic custom quantities when applicable.

#### Subscriptions

| Mutation                     | Key arguments                                                                             | Result                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `subscriptionsPreviewUpdate` | `id: SubscriptionID!`, optional `plan`, `paymentPeriod`, `aiTokens`, `workflowExecutions` | `SubscriptionUpdatePreview` with the proration, the resulting invoice, and the effective moment |
| `subscriptionsUpdate`        | the same arguments plus optional `paymentMethodId`                                        | Updated `Subscription`                                                                          |
| `subscriptionsCancel`        | `id: SubscriptionID!`, optional `immediately: Boolean` (default `false`)                  | Updated `Subscription` with `cancelAt` set                                                      |
| `subscriptionsResume`        | `id: SubscriptionID!`                                                                     | `Subscription` with the cancellation taken back                                                 |

All four require an active session; an anonymous request is refused with HTTP `403` before the mutation runs.

For `subscriptionsUpdate` and `subscriptionsPreviewUpdate`:

- At least one of `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions` has to be supplied; all four missing is `INVALID_CHECKOUT_SELECTION`. For `subscriptionsUpdate` a `paymentMethodId` on its own is enough, and the plan half is then skipped entirely; see [the payment method of a subscription](#the-payment-method-of-a-subscription).
- Arguments that are not supplied keep their current value. An interval change does not reset the quantities, and a quantity change does not move the plan.
- Quantities only exist for `plan: custom`. Moving `custom -> pro`/`max` removes the quantity line items and sets the stored quantities to `null`; moving `pro`/`max` -> `custom` requires quantities to come with it, otherwise `INVALID_CHECKOUT_SELECTION`. A quantity supplied for a standard plan is refused the same way.
- Each quantity is a positive integer within its customer-specific limit (10,000,000 by default), the same bound the checkout enforces. Zero, negative, and non-integer values are refused before Stripe is called.
- The customer type is the stored `customerType` of the subscription's customer and decides which periods exist; see [the payment periods of a customer type](#the-payment-periods-of-a-customer-type). A Price configured for the other type only is `CUSTOMER_TYPE_MISMATCH`.
- A subscription from a `CustomCheckoutConfiguration` and one that is no longer active are `INVALID_SUBSCRIPTION`. Cancelling a negotiated subscription is still allowed.
- An update that changes nothing succeeds without calling Stripe.
- A subscription that does not exist and one belonging to somebody else are answered with the same `INVALID_SUBSCRIPTION` error and the same message, so the response never reveals which of the two it was -- the rule `checkoutCreateSession` already follows for `INVALID_CHECKOUT_CUSTOMER`.

`subscriptionsPreviewUpdate` previews a change to an existing subscription: an upgrade is charged immediately with a proration, so the client has to be able to name the amount before the user clicks. It reads only -- it retrieves the subscription, asks Stripe to preview an invoice, and returns. `SubscriptionUpdatePreview` contains the resolved `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions`, plus `effectiveAt`, `immediate`, `prorationAmount`, `total`, and `currency`. Amounts are integers in the smallest currency unit and the preview is non-binding. Because it runs the same planner as `subscriptionsUpdate`, the `effectiveAt` it reports is the moment the update then actually establishes.

`subscriptionsCancel` defaults to `cancel_at_period_end`, so the user keeps the period they already paid for and `cancelAt` says when access ends. `subscriptionsResume` takes that back until it has happened; a subscription Stripe has already ended cannot be resumed and is `INVALID_SUBSCRIPTION`. Resuming a subscription with nothing to take back succeeds without calling Stripe, so a double click cannot produce an error.

#### Licenses

| Mutation                | Key arguments                                 | Result                                |
| ----------------------- | --------------------------------------------- | ------------------------------------- |
| `licensesExport`        | `id: LicenseID!`                              | Signed license file; self-hosted only |
| `licensesLinkNamespace` | `id: LicenseID!`, `namespaceId: NamespaceID!` | Updated cloud license                 |

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
| `INVALID_DISCOUNT_CODE`                 | The discount code is invalid or inactive                                                                                                                                               |
| `INVALID_INVOICE`                       | The invoice is invalid                                                                                                                                                                 |
| `INVALID_LICENSE`                       | The license is invalid                                                                                                                                                                 |
| `INVALID_PAYMENT_METHOD`                | The selected payment method does not exist or does not belong to this customer                                                                                                         |
| `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` | The selected customer does not exist, is not accessible to the current user, or has no billing account to set a payment method up for                                                  |
| `INVALID_PAYMENT_METHOD_SETUP_SESSION`  | The payment method setup could not be created                                                                                                                                          |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in                                                                                                                                         |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid, does not exist, is not accessible to the current user, is no longer active, or comes from a custom checkout configuration and therefore cannot be changed |
| `INVALID_USER`                          | The local user derived from Sagittarius is invalid                                                                                                                                     |
| `MISSING_PERMISSION`                    | The user does not have the required permission                                                                                                                                         |
| `PAYMENT_METHOD_IN_USE`                 | The payment method is the default for an active subscription and cannot be removed                                                                                                     |
| `SAGITTARIUS_UNAVAILABLE`               | Sagittarius could not be reached or returned an unexpected response                                                                                                                    |
| `UNABLE_TO_LIST_PRICES`                 | Active recurring Stripe prices could not be retrieved                                                                                                                                  |

## Types and conventions

- `String`: UTF-8 text
- `Int`: signed 32-bit integer
- `Float`: double-precision IEEE 754 floating-point number
- `Boolean`: `true` or `false`
- `Time`: ISO 8601 timestamp, for example `2023-12-15T17:31:00Z`
- `CustomerID`, `UserID`, `UserSessionID`, `LicenseID`, `SubscriptionID`: type-specific global IDs
- A `!` after a GraphQL type marks a non-null value.
- Lists use square brackets, for example `[String!]!`.
- Paginated results use cursor pagination with `startCursor`, `endCursor`, `hasNextPage`, and `hasPreviousPage`.

## Typical end-to-end flow

1. The frontend anonymously queries `subscriptionPrices` to display active recurring Stripe products and prices.
2. An authenticated Sagittarius client calls `usersCreateCraterToken` and receives a dedicated Crater login token.
3. The client passes that token to Crater's anonymous `usersLogin` mutation.
4. Crater verifies the token with Sagittarius, maps the returned Sagittarius user ID to a local user, creates a `UserSession`, and returns its token.
5. The client sends the Crater token on subsequent mutations as `Authorization: Session <token>`; no authentication cookie is required.
6. The authenticated user selects one of their customers, or creates one with `customersCreate`, which requires the customer type, name, email, and address.
7. The frontend can validate a promotion code. Tax is calculated within Stripe Checkout.
8. Crater creates an embedded Stripe Checkout Session for the selected plan and returns its `clientSecret`. `customerId` may be left out, in which case the session runs for the user's own customer.
9. The frontend mounts Stripe's custom checkout UI. Stripe collects billing details and calculates tax automatically.
10. The Stripe subscription receives metadata for the Crater customer ID, deployment type, customer type, and optional namespace ID.
11. The verified `checkout.session.completed` webhook creates or updates Crater's subscription projection and syncs the email, name, phone, address, and tax ID from the session's `customer_details` back to the Crater customer. The webhook does not grant paid access by itself.
12. The verified `invoice.paid` webhook records the invoice against its subscription and appends the first `paid` license, which is the moment paid access begins. A failed renewal appends a `payment_failed` snapshot without shortening the current entitlement, and `customer.subscription.deleted` cancels the subscription and appends a `canceled` snapshot. Automatic invoice-email delivery remains to be implemented.
13. The dashboard reads the billing history of a license from that local projection through `License.invoices`.
14. Once the relevant subscription and license data exists, a self-hosted license can be exported while a cloud license can be linked to a Sagittarius namespace.
15. To change the payment method of an active customer later, the client calls `customerPaymentMethodSetupCreate`, confirms the returned SetupIntent with Stripe Elements, and reloads the customer data afterwards. The verified `setup_intent.succeeded` webhook is what makes the collected payment method the default, so the confirmation itself is not proof that it already is.
16. To change the subscription later, the client reads it through `Customer.subscriptions` or `License.subscription`, calls `subscriptionsPreviewUpdate` to show the amount and the effective moment, and then `subscriptionsUpdate`. The same mutation moves the subscription to another stored payment method through `paymentMethodId`. An upgrade applies at once and is prorated; a downgrade or an interval change is reported back as `pendingUpdate` and applies at the end of the period. `subscriptionsCancel` ends the subscription at the end of the paid period, and `subscriptionsResume` takes that back. The verified `customer.subscription.updated` webhook is what makes the projection reflect the change, and the new entitlements arrive with the next `invoice.paid`.

If the user abandons the checkout at any point between steps 6 and 11, the customer stays as it was created; only the Stripe session expires.
