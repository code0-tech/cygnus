# Crater - Summary

## Overview

Crater is the project's billing service. It provides a GraphQL API and connects the customer, user and session, Stripe checkout, discount and tax, subscription, invoice, and license domains.

The source documentation consists of:

- the [GraphQL schema documentation](docs/graphql/index.md)
- the [database ERD](docs/erd/database-erd.pdf)

## The schema

The current branch retains the incremental migrations beginning with `20260508194307_initial_migration.rb`; it does not contain the consolidated September migration baseline previously described here. `db/structure.sql` is the current schema dump.

The latest migrations remove `licenses.seats`, `licenses.runtime_minutes`, and `licenses.status`, and introduce a separate `payment_methods` table for cached display details. The subscription keeps `cancel_at`, `stripe_schedule_id`, and the `pending_*` columns. `custom_checkout_configurations` and the invoice Lexware columns still exist in the database; their presence does not make them public GraphQL fields.

## Domain model

### Core relationships

The ERD describes the following relationships:

- A `Customer` has an address and is associated with invoices, subscriptions, and users.
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
- a separate association of cached Stripe payment method display details

The GraphQL API additionally returns a global ID and creation and update timestamps.

`CustomerAddress`, `CustomerAddressCreateInput`, and `CustomerAddressUpdateInput` contain:

- `line1` and `line2`
- `city`
- `state`
- `postalCode`
- `country` as a country code

`taxIdType` and `taxIdValue` are optional, including for business customers, because Stripe Checkout can collect a tax ID through its `TaxIdElement`. When one of them is supplied, the other is required as well; a half-filled pair returns `INVALID_CUSTOMER`. A tax ID supplied up front is registered on the Stripe Customer immediately, and one collected during checkout is synced back from the completed session.

`customersCreate` requires `customerType`, `name`, `email`, and `address`. Every field of `CustomerAddressCreateInput`, including `line2` and `state`, is required by the GraphQL schema. `phone` and the tax ID pair are optional. `customersUpdate` uses `CustomerAddressUpdateInput`, whose fields are all optional, so an update can change a single address field. Address changes persist through the autosaved customer association.

The columns themselves stay nullable, and `email` and `name` are still nullable in the GraphQL `Customer` type. Stripe Checkout collects contact and billing details of its own through `ContactDetailsElement` and `BillingAddressElement`, and Crater syncs those back from the completed session -- a sync that fills fields in, never blanks them out.

### Users and sessions

`User` exposes a global ID, timestamps, customer and session connections. An admin flag and unique `sagittarius_id` remain in the model; they are not fields on the current GraphQL User type. Sessions are returned as a paginated `UserSessionConnection`.

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

#### Guest users

Clients can start with an email address before the user has a complete Sagittarius profile. `usersCreateGuestUser` can be called without a Crater session, as the only top-level selection in its GraphQL operation.

1. Call `usersCreateGuestUser(input: { email })`. Crater creates the guest in Sagittarius using its server-side service credential, finds or creates the local user by `sagittarius_id`, and creates a Crater session.
2. Keep the returned `claimToken` for completing the profile. Use `userSession.token` with `Authorization: Session <token>` for protected Crater operations. These are separate credentials: the claim token is not a Crater session token.
3. Complete the guest profile through Sagittarius using the claim token. Crater no longer exposes a `usersCompleteGuestProfile` mutation; profile completion is outside its API.

Guest creation does not create a Customer. The returned Crater session can be used for the separate customer and checkout mutations.

```graphql
mutation CreateGuest($email: String!) {
    usersCreateGuestUser(input: { email: $email }) {
        claimToken
        userSession {
            token
            expiresAt
            user {
                id
            }
        }
        errors {
            errorCode
        }
    }
}
```

Guest creation returns `INVALID_EMAIL` for a blank email, `GUEST_USER_CREATION_FAILED` when Sagittarius rejects the request or cannot complete it, and `INVALID_USER` if the local user cannot be persisted. The Sagittarius client requests both message and ActiveModel validation details. Service authorization uses a signed `Crater <jwt>` with `sagittarius.jwt_secret` and a configurable lifetime; `Crater::Jwt.decode` rejects expired tokens and tokens without a usable `exp` claim.

#### The session lifecycle

A session is usable while it is **neither revoked nor expired**. There is no stored `active` flag: a flag cannot express an expiry that passes on its own, and would drift out of sync with it. `UserSession#active?` and the `UserSession.active` scope both derive the answer from two columns:

| Column       | Meaning                                                                                |
| ------------ | -------------------------------------------------------------------------------------- |
| `expires_at` | Not null. Set by the server when the session is created; a client cannot influence it. |
| `revoked_at` | Set by `usersLogout`. Null while the session has not been revoked.                     |

`session.lifetime_hours` (default `168`, seven days) is the absolute lifetime a new session receives. There is no refresh, no sliding window, and no rotation, so this value is the only bound on how long a stolen token remains useful; seven days keeps re-authentication through Sagittarius infrequent without leaving a token valid for months. Shortening it takes effect for newly created sessions only.

Authentication resolves a token through `UserSession.active.find_by(token: ...)`, so **a revoked, an expired, and an entirely unknown token all resolve to nothing** and produce the identical HTTP `401 Unauthorized`. Nothing in the response distinguishes them, so no request can probe whether a session exists.

Tokens are stored with deterministic Active Record encryption (`TokenAttr`), never as plain text, which allows the lookup above without keeping the raw value in the database. The token is returned when login or guest creation creates a session; subsequent reads expose no token.

#### Logging out

`usersLogout` revokes the authenticated session or another session owned by the same user:

- Its optional `id: UserSessionID` selects a session to revoke, for example to sign another device out. Without `id`, it uses the session from the `Authorization` header. `UserSessionPolicy` grants `revoke_session` only to that session's owner. A nonexistent session and another user's session both return `MISSING_PERMISSION` with the same message.
- The payload carries **no session object, no session ID, and no token**, only `errors` and `clientMutationId`. An empty `errors` list is the confirmation.
- From the next request on, the same token is rejected exactly like an unknown one. A second logout with it returns `401`.
- Other sessions of the same user stay active; logging out of one device does not log out the others.
- Revoking is idempotent at the model level and never moves an existing `revoked_at`.
- An anonymous request is answered with HTTP `403 Forbidden` before the resolver runs. A revoked or expired authentication token is answered with `401`.
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

`Users::CleanupSessionsJob` runs hourly at minute 42 by default. `config/initializers/good_job.rb` reads the jobs from `Crater::Configuration.config[:cron_jobs]`; `cron_jobs` in `config/crater.yml` can override the defaults:

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

The required `customerId` identifies a customer belonging to the authenticated user through `CustomerUser`. There is no automatic customer selection. Creating the session never creates a customer; `customersCreate` must run first if no suitable customer exists.

A `CheckoutSession` returns:

- the Stripe session ID
- the client secret used by the frontend to initialize Stripe's embedded checkout
- the expiration time as a Unix timestamp

Additional checkout features include:

- selecting the billing period of the customer's type: monthly, quarterly, or yearly, the same for business and personal customers
- the same period rule for Pro, Max, and dynamic custom checkouts alike
- quantity-based AI Token and Workflow Execution line items for dynamic custom checkouts
- enabling promotion codes to be applied and removed through Stripe's frontend Checkout SDK
- supporting the `self_hosted` and `cloud` deployment types
- optionally linking a cloud checkout to a Sagittarius namespace ID
- a required, allowlisted return URL for payment methods that temporarily leave the page
- required billing-address collection
- automatic Stripe Tax
- automatic synchronization of the customer's name and address back to Stripe
- attaching the plan, payment period, resolved quantities, Crater customer ID, deployment type, customer type, optional namespace ID, and optional `referral` to the Stripe subscription metadata

Stripe Price IDs are resolved exclusively on the server from `checkout.prices`. Since commit `9ab1a2c`, Pro, Max, and each Custom component resolve their Price by deployment type (`cloud` or `self_hosted`), plan or component, customer type, and payment period. Cloud and self-hosted deployments have separate price catalogs. The customer type is always the stored `customerType` of the selected customer, never something the client sends.

Standard-plan prices are configured at `checkout.prices.<deployment>.<pro|max>.<b2b|b2c>.<period>`. Custom prices use `checkout.prices.<deployment>.custom.<component>_<b2b|b2c>.<period>`, where the component is `ai_token` or `workflow_execution`. For example:

```yaml
checkout:
    prices:
        cloud:
            pro:
                b2b:
                    monthly: price_cloud_pro_business_monthly
            custom:
                ai_token_b2b:
                    monthly: price_cloud_ai_tokens_business_monthly
        self_hosted:
            pro:
                b2b:
                    monthly: price_selfhosted_pro_business_monthly
```

The example values above are placeholders for Stripe Price IDs. Environment overrides use deployment-prefixed names such as `STRIPE_PRICE_CLOUD_PRO_B2B_MONTHLY`, `STRIPE_PRICE_SELF_HOSTED_PRO_B2B_MONTHLY`, and `STRIPE_PRICE_CLOUD_AI_TOKEN_B2B_MONTHLY`. These names are derived from the catalog; the former names without a deployment prefix are no longer read. Existing flat price configuration must be moved under the deployment keys.

Subscription updates and previews use the same resolver with the subscription's stored deployment type. They cannot switch deployment through an update argument, and the resolver never falls back to another deployment's prices. An unsupported deployment is rejected with `INVALID_CHECKOUT_SELECTION`; a customer-type mismatch is checked within the selected deployment's catalog.

#### The payment periods of a customer type

Which periods exist is a property of the **customer type**, not of the plan. It is the same split everywhere -- for Pro, for Max, and for the custom components:

| Customer type    | Payment periods                  |
| ---------------- | -------------------------------- |
| `business` (B2B) | `monthly`, `quarterly`, `yearly` |
| `personal` (B2C) | `monthly`, `quarterly`, `yearly` |

`CheckoutPaymentPeriod` offers exactly these three values, and both customer types are billed in the same set. A payment period outside that set is rejected with `INVALID_CHECKOUT_SELECTION` before any Price is looked up, in `checkoutCreateSession`. `Subscription` validates the stored period against its customer's type with the same rule, so a projection can never hold a combination the checkout would refuse.

**This section applies unchanged to changes of an existing subscription.** `subscriptionsUpdate` and `subscriptionsPreviewUpdate` resolve their target Price through the very same rules: the customer type is the stored `customerType` of the subscription's customer and never something the client sends, that type decides which periods exist at all, and a period outside the set is refused before Stripe is called. A subscription can therefore never be moved into a plan, period, or Price combination a fresh checkout would have rejected.

A plan or component that is configured for the other customer type only is rejected with `CUSTOMER_TYPE_MISMATCH` rather than falling back to that type's Price; one configured for neither type is a plain `INVALID_CHECKOUT_SELECTION`.

#### Custom quantity limits

Custom quantities are selected from fixed packages configured under `checkout.quantity_steps`, per customer type. `Customer.checkoutLimits` exposes the ascending `aiTokens` and `workflowExecutions` arrays as `[Int!]!`; their final entries are the maxima. There is no root `checkoutLimits` query.

| Customer type | AI Token packages                                   | Workflow Execution packages               |
| ------------- | --------------------------------------------------- | ----------------------------------------- |
| `business`    | 10,000,000; 100,000,000; 500,000,000; 1,000,000,000 | 100,000; 1,000,000; 5,000,000; 10,000,000 |
| `personal`    | 1,000,000; 10,000,000; 50,000,000; 100,000,000      | 10,000; 100,000; 500,000; 1,000,000       |

A custom checkout requires both quantities, each exactly matching an entry in its customer's configured array. Arbitrary intermediate values are refused with `INVALID_CHECKOUT_SELECTION`. These rules also apply to subscription change planning; the model checks stored non-null quantities against the same package lists. Configuration arrays must be non-empty, ascending arrays of positive signed 32-bit integers.

Standard plans carry fixed quantities from `checkout.plan_quantities`: Pro defaults to 10,000,000 AI Tokens and 100,000 Workflow Executions; Max defaults to 100,000,000 and 1,000,000. Checkout metadata, subscription projections, and license restrictions carry these quantities too. A supplied standard-plan quantity must equal the configured entitlement; the checkout still has one plan line item with Stripe quantity `1`.

Monetary amounts are transferred as integers in the smallest currency unit.

#### Discounts in a checkout

A discount is applied and validated through Stripe's frontend Checkout SDK. Every Checkout Session Crater creates carries `allow_promotion_codes: true`, so the client calls `checkout.applyPromotionCode(code)` on its existing session and `checkout.removePromotionCode()` to remove it. The client handles Stripe's error result or reads the updated session and totals on success.

That is why `checkoutCreateSession` has no `promotionCode` argument. A discount entered, removed, and entered again is the same session throughout -- the user does not lose the address, tax ID, or payment details already filled in, and Crater does not create a Stripe session per attempt. Crater consequently never sends `discounts` when creating a session; Stripe rejects `discounts` and `allow_promotion_codes` together, and the client-side flow is the one that survives a change of mind.

Crater no longer exposes `checkoutValidateDiscount`, `CheckoutDiscount`, or `INVALID_DISCOUNT_CODE`. The frontend uses the result of applying the code to the actual Stripe session.

### The checkout completion status

`checkoutCompletionStatus(sessionId: String!)` answers the one question a client has after sending a user into the checkout: did this produce access yet? It exists so that no client -- Cygnus included -- has to guess that from a Stripe redirect, a timestamp, or a customer id it happens to hold.

**A completed Stripe session is not access.** `session.status = complete` means Stripe accepted the checkout. Access begins with a license appended by the verified `invoice.paid` webhook. The query reports this projection without creating or extending access.

#### The states

| State                 | Meaning                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `CHECKOUT_PENDING`    | The Stripe session is `open`; the user has not finished the checkout.                                                             |
| `PAYMENT_PENDING`     | The session is `complete` but `payment_status` is `unpaid`.                                                                       |
| `FULFILLMENT_PENDING` | Stripe considers the session settled (`paid` or `no_payment_required`), but its local subscription or license does not exist yet. |
| `READY`               | A license exists for exactly the subscription this session created. `licenseId` names the newest snapshot.                        |
| `FAILED`              | The session `expired` without completing and can no longer lead to access.                                                        |

`no_payment_required` can be settled, but the query still requires a license created by `invoice.paid` before returning `READY`, even for a hundred-percent discount.

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
- The remaining metadata Crater wrote is internally consistent: customer type, deployment type, and period are known, and a namespace only appears for cloud. Plan and period appear together. Standard plans require both quantity metadata values; the completion reader accepts custom metadata with at least one quantity, although fresh custom checkout creation requires both. A negotiated subscription carries neither plan, period, nor quantities. Where a local subscription exists, its deployment type, plan, and payment period must match the metadata.

Because a session that does not exist, one belonging to somebody else, and one that contradicts itself are answered identically, the response never reveals which of the three it was.

#### How `READY` is bound to exactly one subscription

The local subscription is resolved solely through the Stripe subscription ID of the session, against the unique `index_subscriptions_on_stripe_subscription_id`, and must belong to the resolved customer. `READY` requires a license of **that** subscription; license rows are created only by paid invoices and have no status field:

- A license of another subscription, even of the same customer, never produces `READY`.
- A license of another customer never produces `READY`.
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

| Field                            | Meaning                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `customerType`                   | `BUSINESS` or `PERSONAL`, from the resolved Crater customer         |
| `deploymentType`                 | `SELF_HOSTED` or `CLOUD`                                            |
| `plan`                           | `PRO`, `MAX`, `CUSTOM`, or `null` for a negotiated subscription     |
| `paymentPeriod`                  | The billed period, or `null` for a negotiated subscription          |
| `aiTokens`, `workflowExecutions` | Quantities for Pro, Max, and Custom; null for negotiated selections |

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
- The payment method itself exists solely in Stripe. Crater records its ID on the customer and nothing else; card and bank details, and which of them is the current default, are read from Stripe where they are needed.

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
- Only then is the payment method written to the Stripe customer's `invoice_settings.default_payment_method`, and its ID recorded on the Crater customer. Nothing else about it is stored.

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

`customerPaymentMethodSetupCreate` and the webhook above cover adding a payment method and promoting it to the default. Reading and removing existing methods need no SetupIntent: list IDs on the customer, read a summary with the root `paymentMethod` query, and remove methods through `customersUpdate`.

`Customer.paymentMethods` returns the Stripe PaymentMethod IDs attached to the customer, including methods other than the default. It reads Stripe on every request and auto-paginates beyond the first 100 entries. A customer without a Stripe customer ID returns an empty list; a Stripe outage produces `PAYMENT_METHOD_UNAVAILABLE`.

Display details are read with `paymentMethod(paymentMethodId: String!)`, returning `PaymentMethodSummary` with `type`, `brand`, `last4`, `expiresMonth`, and `expiresYear`. The separate `PaymentMethod` model caches these fields and the owning customer by unique Stripe ID. Cache hits require customer membership and make no Stripe call; misses retrieve the method, verify its customer, and cache the summary. `setup_intent.succeeded`, checkout completion, and subscription payment method updates also populate this cache. A detach performed through Crater removes the cached row. There are no `payment_method.attached` or `payment_method.detached` handlers in this branch.

`customersUpdate` removes them. Its optional `paymentMethods` argument names what the customer **keeps**: every attached payment method absent from the list is detached in Stripe and removed from the cache. An id the customer does not have is nothing to act on, and omitting the argument leaves the methods alone. Collecting a payment method stays with the SetupIntent flow.

The removal diff is taken against a fresh, auto-paginated Stripe read, so it acts on currently attached methods rather than cached display data.

A removal is refused with `PAYMENT_METHOD_IN_USE` while the payment method is charged for anything:

- it is the customer's `invoice_settings.default_payment_method`, or
- it is the `default_payment_method` of one of the customer's non-terminal subscriptions (any status other than `canceled` or `incomplete_expired`, the same set `Subscription::TERMINAL_STRIPE_STATUSES` names elsewhere).

Both checks read straight from Stripe rather than Crater's local `Subscription` projection, so they hold even where the projection has not caught up yet. The customer-level default is checked first, because it costs one Stripe call and answers the common case without a second one. Freeing a payment method for removal means moving the conflicting default elsewhere first, either with a fresh `customerPaymentMethodSetupCreate` or with the `paymentMethodId` argument of `subscriptionsUpdate` below.

The reconciliation runs **before** the customer's own fields are written, so a refused removal leaves the whole `customersUpdate` unapplied instead of renaming the customer and then failing.

Access is the same `CustomerPolicy` membership rule as the rest of this section: reading the list needs `read_customer`, changing it needs `update_customer`. A payment method id that does not exist and one belonging to a different Stripe customer are answered identically with `INVALID_PAYMENT_METHOD`, the same anti-enumeration idiom `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` already follows for the customer itself: the id is always resolved server-side through `payment_methods.retrieve` and compared against the customer's `stripe_customer_id`, never trusted from the request.

#### The payment method of a subscription

`Subscription.paymentMethodId` reads the subscription's own default payment method ID from Stripe on every request. It is `null` if none is set, and a Stripe outage is `PAYMENT_METHOD_UNAVAILABLE`. Display details behind the ID come from `paymentMethod(paymentMethodId:)` and its local cache. The old `subscriptionPaymentMethod` query is removed.

`subscriptionsUpdate` changes it. Its optional `paymentMethodId` argument points the subscription at one of the customer's **already-stored** payment methods, so no SetupIntent, no client secret, and no round trip through Stripe Elements are involved. Collecting a new payment method stays with `customerPaymentMethodSetupCreate`, which attaches it to the customer; from there any subscription can be pointed at it.

- Ownership and display details are resolved from a cache entry belonging to the subscription's customer first. On a miss, `payment_methods.retrieve` verifies ownership and populates the cache. A nonexistent payment method and one belonging to another customer both return `INVALID_PAYMENT_METHOD`. The actual subscription default is always updated through Stripe.
- Access is `update_subscription`, the same ability the rest of `subscriptionsUpdate` requires; a subscription that does not exist, one belonging to somebody else, and a terminal one are all `INVALID_SUBSCRIPTION`.
- It applies **immediately**, independently of when the plan half of the same request takes effect: the next invoice has to be charged to the new payment method whether the plan change is prorated now or scheduled for the end of the period.
- It runs before the plan change, so a payment method Stripe refuses leaves the subscription untouched -- no proration, no schedule.
- Supplying only `paymentMethodId` is a valid request: the plan half is then a no-op and costs no Stripe write of its own.
- The subscription's default is not stored locally, so the change is visible through `Subscription.paymentMethodId` on the next read. The display summary is cached separately on the customer.

#### Checkout return URLs

The checkout is the only flow whose return URL passes through Crater. `Crater::ReturnUrl` accepts only absolute `http` or `https` URLs whose origin appears in `checkout.allowed_return_origins`; anything relative, scheme-less, or pointing at another origin is rejected before Stripe is called, so no request can make Stripe redirect a user to a host we do not control.

### Subscriptions, invoices, and licenses

`Subscription` stores deployment type, Stripe status, unique Stripe subscription ID, optional Sagittarius namespace ID, plan, payment period, and AI Token and Workflow Execution quantities. Standard-plan quantities match `checkout.plan_quantities`; non-null custom quantities match the customer's `checkout.quantity_steps`. The payment period is validated against the customer's available periods.

It also projects the current billing period (`current_period_start`, `current_period_end`), `cancel_at`, `canceled_at`, and the Stripe schedule ID. The API exposes the cancellation date as `cancelAt`.

Scheduled changes are mirrored in `pending_plan`, `pending_payment_period`, `pending_ai_tokens`, `pending_workflow_executions`, and `pending_effective_at`, exposed as `Subscription.pendingUpdate`. This lets the dashboard display the future selection without a Stripe read.

A negotiated subscription is billed on its own Stripe Price and therefore carries no plan, payment period, or quantities. A missing plan is what identifies it, and it is the reason such a subscription is excluded from `subscriptionsUpdate`.

`Invoice` contains:

- total, net, and tax amounts
- currency and status
- billing period in the database; it is not exposed on the GraphQL Invoice type
- a unique Stripe invoice ID
- an optional invoice number and Stripe PDF URL
- an optional Stripe fee
- the customer it was billed to and the subscription it was issued for

The associated `InvoiceItem` entries contain an amount, description, and quantity.

`Invoice.subscription_id` is a nullable foreign key with an index and `ON DELETE SET NULL`: a customer can hold several subscriptions, so the customer alone does not identify the invoices of one subscription, while Stripe can also issue invoices that belong to no subscription at all. Amounts stay integers in the smallest currency unit everywhere; they are never converted to floats, and the tax is stored exactly as Stripe billed it rather than recalculated.

Crater defines three transactional invoice emails:

- invoice finalized
- invoice paid
- invoice payment failed

They are addressed to the customer's email address. Subjects use the invoice number and fall back to the Stripe invoice ID when no invoice number exists. Both HTML and plain-text variants are present, with previews available through Rails mailer previews.

The mailer uses complete HTML documents generated by react-email, without a wrapping Rails layout, plus plain-text variants. `invoice.paid` and `invoice.payment_failed` enqueue their respective emails only when recording a previously unseen Stripe invoice (`previously_new_record?`); updating that invoice later does not enqueue another lifecycle email. `finalized` remains a mailer action, with no `invoice.finalized` handler. The payment-method label uses the latest cached summary, and the payment retry link uses the invoice PDF URL because a hosted payment URL is not stored separately.

`License` describes the usage entitlement resulting from a subscription:

- global ID
- start and end times
- deployment type
- AI Token and Workflow Execution entitlements
- additional features
- an optional Sagittarius namespace ID for cloud licenses
- grace period, options, and restrictions in the data model
- creation and update timestamps

Licenses have no status column or GraphQL status field. A row is appended only for `invoice.paid`; payment failures and cancellations produce no license snapshot. `Invoice.status` is the `InvoiceStatus` enum, and `Subscription.status` is the `SubscriptionStatus` enum over the stored Stripe status.

Self-hosted licenses can be exported as a signed license file. `subscriptionsLinkNamespace` links or transfers a cloud subscription to a Sagittarius namespace. It takes a `SubscriptionID`, returns a `Subscription`, and checks that the namespace is not used by another non-terminal subscription. This implements Crater's local link only; Sagittarius proof verification and the remote upsert are not implemented.

#### What a license carries

`restrictions` and `options` are the two free-form hashes the `code0-license` format hands to the installation running on the license. Crater derives both from the subscription and stores them on the snapshot, so they describe what was in force when that snapshot was appended rather than what the subscription looks like now.

| Hash           | Key                   | Value                                                   |
| -------------- | --------------------- | ------------------------------------------------------- |
| `restrictions` | `ai_tokens`           | AI Token entitlement for Pro, Max, and Custom           |
| `restrictions` | `workflow_executions` | Workflow Execution entitlement for Pro, Max, and Custom |
| `options`      | `payment_period`      | `monthly`, `quarterly`, or `yearly`                     |
| `options`      | `customer_type`       | `personal` or `business`                                |
| `options`      | `plan`                | `PRO`, `MAX`, or `CUSTOM`                               |

The keys are snake_case strings, written by `Entitlements` through `stringify_keys`; `Code0::License.load` symbolizes them again on the consuming side. The **plan alone is upper case** -- `PLAN_NAMES` maps Crater's lower-case checkout key onto the spelling the product reads -- while the payment period and the customer type stay the lower-case checkout keys.

Only keys that have a value are written. Pro and Max include their configured quantity restrictions; negotiated subscriptions carry no quantity restriction, plan, or payment period.

`restrictions` and `options` are stored JSON hashes used by the signed export; the current GraphQL `License` exposes neither hash. Its flat `aiTokens`, `workflowExecutions`, `plan`, and `paymentPeriod` fields delegate to the owning subscription and therefore show its current selection. Exporting an older snapshot uses its stored hashes and reproduces its historical entitlements.

#### The license file

`licensesExport` returns a file produced by `code0-license` 0.4, which includes `grace_period_days` as a separate field alongside the licensee, validity window, restrictions, and options. Each paid snapshot uses the invoice's billing period for `start_date` and `end_date`; grace is not added to `end_date`, so the consuming installation can apply it once. The default grace period is fourteen days and is carried forward from the previous snapshot.

- The file is signed with the RSA private key loaded from `license.private_key_path`. Without that key the export is refused with `INVALID_LICENSE`; Crater never hands out an unsigned file.
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

Crater keeps the schedule ID and pending selection locally. `pendingUpdate` contains `plan`, `paymentPeriod`, `aiTokens`, `workflowExecutions`, and `effectiveAt`. Requesting another change releases the old schedule and replaces its pending selection. Cancelling releases it too; an immediate update clears pending fields. A subscription update webhook clears them when the reported current selection matches the pending one.

#### Consistency and safety

- The row is locked for the whole exchange with Stripe, so two concurrent requests for the same subscription cannot both reach it.
- Every Stripe write carries an idempotency key derived from the subscription and the exact target selection, so a retried request reuses Stripe's stored answer instead of prorating a second time, while a genuinely different request is still a new one.
- An update that asks for the selection the subscription already has is a successful no-op: no Stripe call, no proration.
- A subscription that is no longer active (`canceled`, `incomplete_expired`) and one carrying no checkout plan are refused with `INVALID_SUBSCRIPTION`. Cancelling a negotiated subscription is still allowed, because no plan catalogue is involved.

#### What a change does to licenses

Nothing directly. Licenses stay append-only, and a plan change rewrites no existing snapshot.

**A change never writes a license, not even an immediate upgrade.** The entitlements of the new plan reach the user through the next `invoice.paid` snapshot, which is the only event that grants paid access. This keeps a single writer for the license chain: a plan the user was upgraded to but has not been invoiced for yet does not silently become an entitlement, and there is no snapshot that would have to be revoked if the proration invoice then fails.

On cancellation, existing license dates stay unchanged and no canceled snapshot is created. `immediately: true` cancels the Stripe subscription immediately only if the local subscription was created within the last fourteen days; outside that window it becomes a period-end cancellation. The code applies this age check to both customer types and makes no separate refund call or consumer-waiver check.

### Webhook processing

`ProcessedWebhookEvent` stores:

- a unique Stripe event ID
- event type
- the complete JSON payload
- an optional processing timestamp

This allows Crater to track Stripe webhook processing and handle events idempotently. An event is only marked with `processed_at` after its handler completes successfully.

#### Handled events

Only these event types are requested from Stripe and accepted by the webhook endpoint; anything else is answered with `200 OK` and discarded without a ledger entry.

| Event                           | Handler                                           | Effect                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | `Webhooks::HandleCheckoutSessionCompletedService` | Upserts the subscription projection and syncs contact details, address, and tax ID back to the customer. Grants no access.                                                       |
| `invoice.paid`                  | `Webhooks::HandleInvoicePaidService`              | Records the invoice and appends a license for its billing period; enqueues the paid email on first invoice creation. Grants paid access.                                         |
| `invoice.payment_failed`        | `Webhooks::HandleInvoicePaymentFailedService`     | Records the invoice and enqueues the failure email on first invoice creation. Creates no license; prior entitlement stays unchanged.                                             |
| `customer.subscription.updated` | `Webhooks::HandleSubscriptionUpdatedService`      | Syncs selection, status, cancellation dates, and period bounds; clears a pending change when reached. Creates no license.                                                        |
| `customer.subscription.deleted` | `Webhooks::HandleSubscriptionDeletedService`      | Sets local Stripe status to `canceled`; changes no license dates and appends no license.                                                                                         |
| `setup_intent.succeeded`        | `Webhooks::HandleSetupIntentSucceededService`     | Promotes the collected payment method to the Stripe customer's `invoice_settings.default_payment_method` and records its id on the customer. Touches no license or subscription. |
| `payment_method.attached`       | `Webhooks::HandlePaymentMethodAttachedService`    | Records the payment method on the Crater customer it was attached to. An event for a Stripe customer Crater does not know is accepted and ignored.                               |
| `payment_method.detached`       | `Webhooks::HandlePaymentMethodDetachedService`    | Drops the payment method from the customer that held it, resolved through the stored ids because Stripe has already cleared the payload's customer.                              |

#### From checkout to license

1. `checkout.session.completed` creates or updates the `Subscription` and the customer's contact and billing data. No `License` exists yet, so the customer has no paid access.
2. `invoice.paid` grants access by appending a license whose start and end match the paid invoice's service period, with grace carried separately.
3. `invoice.payment_failed` records the failure without appending or changing a license. Existing entitlement can run through its period plus grace. A later paid invoice appends a new license for its own period.
4. `customer.subscription.deleted` marks the subscription canceled without appending a license. Pending changes are cleared by the cancellation mutation or when an update webhook reaches the pending selection, rather than by the deletion handler itself.

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

- The selection is read from the Stripe **metadata**, not from the line items. The metadata is what Crater writes on every change and what `checkoutCompletionStatus` compares the projection against, so the two cannot drift apart. A payload carrying no `plan` key at all -- a negotiated subscription, or one from before that metadata existed -- leaves the stored selection untouched instead of erasing it.
- `cancel_at` and `canceled_at` are always written, including as `null`, because resuming must remove the cancellation. Status and period bounds are written only when present.
- Period bounds prefer subscription-level values when present; otherwise they span the subscription items.
- The webhook clears the schedule ID and pending fields when the reported selection matches the pending selection. It does not otherwise copy the payload's `schedule` into the local pointer.
- A payload the projection would refuse -- a period the customer's type is not billed in, for instance -- returns an error, so the event stays unprocessed and Stripe's redelivery can run it again.
- Like the license-relevant events it can arrive before `checkout.session.completed` created the projection. A missing local subscription is treated as temporary and retried with the same polynomial backoff.

#### The local invoice projection

Both invoice events keep Crater's own copy of the Stripe invoice up to date through `Invoices::UpsertService`, which is keyed by the unique Stripe invoice ID and therefore idempotent. `Webhooks::BaseInvoiceEventService` maps the payload onto the record and always sets `subscription_id` to the subscription the event names, so a redelivery or a later `invoice.paid` for the same invoice keeps the relation correct. Number, PDF URL, currency, status, total, and tax are taken from the payload as they are; the tax is read from `total_taxes` and from the legacy `tax` field, and is never recomputed. The billing period comes from the line item periods and falls back to the invoice level `period_start` and `period_end` when a payload carries no line periods. A payload that lacks what an `Invoice` requires is skipped rather than stored half-filled.

Recording the invoice deliberately cannot fail the event: paid access is driven by the license snapshot alone, so a bookkeeping problem is logged and the license lifecycle proceeds unchanged. This projection is also the only source the license dashboard reads invoices from, so a dashboard request never queries Stripe.

Stripe does not guarantee webhook delivery order. Invoice and subscription events can arrive before checkout completion creates the local projection. Missing subscriptions are retried with polynomial backoff, up to five attempts. Once the subscription exists, processing continues; only a paid invoice appends a license.

#### Idempotency and failures

`ProcessedWebhookEvent` is keyed by the unique Stripe event ID, so a redelivered event is never processed twice. Redelivery of an already processed event is ignored, while redelivery of an existing unprocessed event schedules processing again. A failure inside `Licenses::UpsertService` leaves the event unprocessed.

Retries for a missing subscription are limited. If the subscription is still unavailable after all attempts, the event remains unprocessed so that a later Stripe redelivery can schedule it again. Retry exhaustion is logged with structured identifiers only: the event type, handler service, and Stripe subscription ID. Complete Stripe payloads and sensitive customer data are never logged.

Application services use `Crater::Database::Transactional` for explicit transactions. Its `rollback_and_return!` propagates nested rollback results to the outer helper. The custom RuboCop rule flags raw `ActiveRecord::Base.transaction` calls outside the helper; row-lock transactions remain part of webhook processing and subscription mutation handling.

## GraphQL API

### Entry point

All queries start at the root `Query` type. The currently documented query fields are:

| Query                      | Argument                   | Return type                 | Purpose                                                                                                         |
| -------------------------- | -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `currentUser`              | none                       | `User`                      | Returns the user authenticated by the current Crater session, or `null` when the request is anonymous.          |
| `echo`                     | `message: String!`         | `String!`                   | Verifies read access to the API and returns the supplied message.                                               |
| `subscriptionPrices`       | none                       | `[CheckoutPrice!]!`         | Returns active recurring Stripe prices and can be queried anonymously.                                          |
| `checkoutCompletionStatus` | `sessionId: String!`       | `CheckoutCompletionStatus!` | Reports how far one Stripe Checkout Session has progressed towards licensed access. Requires an active session. |
| `paymentMethod`            | `paymentMethodId: String!` | `PaymentMethodSummary`      | Reads authorized cached payment method display details, fetching Stripe on a cache miss.                        |

There are no root `license`, `customer`, `subscription`, or `checkoutLimits` lookup fields. Resource reads start from `currentUser` and its customer/subscription connections.

#### License dashboard

`currentUser` is the entry point for the read-only dashboard. It exposes only data the authenticated user is a member of:

- `User.customers` is a `CustomerConnection!` over the customers linked through `CustomerUser`. Customers of other users never appear.
- `Customer.licenses` is removed. Read subscriptions and each subscription's `currentLicense` to obtain the newest snapshot.
- `License.invoices` is an `InvoiceConnection!` over the invoices of the license's subscription. A license without invoices returns an empty connection rather than `null`.
- `Customer.subscriptions` is a `SubscriptionConnection!` over the customer's subscriptions, ordered by `updated_at DESC` and then `id DESC` like the licenses. It is what the subscription mutations address, and a customer without subscriptions returns an empty connection rather than `null`.
- `License.subscription` is the way back from a license to the subscription it is a snapshot of, so a dashboard that lists licenses can offer the change and cancel actions without a second round trip.

All connections use the standard cursor pagination arguments (`first`, `after`, `last`, `before`) and expose `count`.

#### The Subscription type

`License` alone cannot carry this: licenses are append-only snapshots, several of them belong to the same subscription, and none of them can express "cancelled as of 30 September" or "moving to Max on 1 October". `Subscription` is the addressable thing the mutations take and the state the UI renders.

| Field                                    | Type                        | Meaning                                                                              |
| ---------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `id`                                     | `SubscriptionID!`           | Global ID, the argument every subscription mutation takes                            |
| `status`                                 | `SubscriptionStatus!`       | Typed Stripe lifecycle status                                                        |
| `plan`                                   | `CheckoutPlan`              | `PRO`, `MAX`, or `CUSTOM`; `null` for a negotiated subscription                      |
| `paymentPeriod`                          | `CheckoutPaymentPeriod`     | The period it is billed in; `null` for a negotiated subscription                     |
| `deploymentType`                         | `DeploymentType!`           | `SELF_HOSTED` or `CLOUD`                                                             |
| `namespaceId`                            | `NamespaceID`               | Linked Sagittarius namespace, cloud only                                             |
| `aiTokens`, `workflowExecutions`         | `Int`                       | Fixed standard-plan or selected custom quantities; null for negotiated subscriptions |
| `currentPeriodStart`, `currentPeriodEnd` | `Time`                      | The billing period Stripe reports                                                    |
| `cancelAt`                               | `Time`                      | Stripe cancellation date; null while no cancellation is pending                      |
| `paymentMethodId`                        | `String`                    | Subscription default payment method ID, read from Stripe                             |
| `pendingUpdate`                          | `SubscriptionPendingUpdate` | Locally stored future selection and effective time                                   |
| `currentLicense`                         | `License`                   | Newest paid-invoice snapshot, null before the first one                              |
| `licenses`                               | `LicenseConnection!`        | Snapshot history, newest first                                                       |
| `canceledAt`                             | `Time`                      | When the cancellation was requested                                                  |
| `createdAt`, `updatedAt`                 | `Time!`                     | Timestamps                                                                           |

`SubscriptionStatus` exposes `ACTIVE`, `CANCELED`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, `PAST_DUE`, `PAUSED`, `TRIALING`, and `UNPAID`. The underlying `stripe_status` column remains text and validates presence rather than enum membership; a future unknown Stripe status therefore needs an enum update before it can be serialized safely.

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
                checkoutLimits {
                    aiTokens
                    workflowExecutions
                }
                paymentMethods
                subscriptions(first: 5) {
                    count
                    nodes {
                        id
                        status
                        plan
                        cancelAt
                        paymentMethodId
                        pendingUpdate {
                            plan
                            paymentPeriod
                            aiTokens
                            workflowExecutions
                            effectiveAt
                        }
                        currentLicense {
                            id
                            startDate
                            endDate
                            features
                        }
                        licenses(first: 20) {
                            count
                            nodes {
                                id
                                startDate
                                endDate
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

Licenses are append-only: each processed paid-invoice event appends a row. Failed payments and cancellations add no row. The newest row is the current snapshot, with earlier rows available as history. `currentLicense` selects the newest snapshot; its presence alone does not check whether its dates and grace period have elapsed.

The history is reached through the subscription:

| Field                         | Returns                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
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
                subscriptions(first: 100) {
                    nodes {
                        id
                        currentLicense {
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
                                    lineItems {
                                        amount
                                        description
                                        quantity
                                    }
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
}
```

`Invoice.status` is the `InvoiceStatus` enum. `total`, `net`, and `tax` map to stored amounts in the smallest currency unit; `lineItems: [InvoiceItem!]!` exposes amount, description, and quantity. Billing period fields are removed from the GraphQL type but remain in the database for ordering and license processing. `invoiceNumber`, `net`, and `stripePdfUrl` are nullable. Reads use the local projection and make no Stripe call.

Invoices are ordered by `period_start DESC`, then `created_at DESC`, then `id DESC`, so the newest billing period comes first and equal timestamps still produce a stable order.

Reading invoices requires `read_invoice`, which `InvoicePolicy` derives from `read_customer` on the invoice's customer. A user who is not a member of that customer through `CustomerUser` never sees the invoice, not even when reaching it through a license.

Invoices are batched by `Sources::InvoicesBySubscription`, reached through `customers -> subscriptions -> currentLicense -> invoices` or the snapshot history.

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

Prices and products are managed in Stripe. `subscriptionPrices` fetches all active recurring prices, including both deployment catalogs, without a deployment filter or a local product catalog. Checkout creation resolves Price IDs through `checkout.prices`, keyed by deployment, plan/component, customer type, and period. Stripe retrieval failures surface as a GraphQL execution error based on `UNABLE_TO_LIST_PRICES`.

#### Lookup keys

`lookupKey` is the stable technical identifier the frontend can use to match prices from `subscriptionPrices`; product names are freely editable. The configured Stripe sandbox catalog was verified on 2026-10-04: all 48 configured Price IDs are active and use the following naming schemes:

```text
<pro|max>_<cloud|selfhosted>_<business|personal>_<monthly|quarterly|yearly>
custom_<ai_tokens|workflow_executions>_<cloud|selfhosted>_<business|personal>_<monthly|quarterly|yearly>

pro_cloud_business_monthly
max_selfhosted_personal_yearly
custom_ai_tokens_cloud_business_quarterly
custom_workflow_executions_selfhosted_personal_monthly
```

Stripe lookup keys and configuration keys use different spellings:

| Meaning                             | Stripe lookup key            | Crater configuration key        |
| ----------------------------------- | ---------------------------- | ------------------------------- |
| Cloud deployment                    | `cloud`                      | `cloud`                         |
| Self-hosted deployment              | `selfhosted`                 | `self_hosted`                   |
| Business customer                   | `business`                   | `b2b`                           |
| Personal customer                   | `personal`                   | `b2c`                           |
| Custom AI Token component           | `custom_ai_tokens`           | `custom.ai_token_<b2b           | b2c>` |
| Custom Workflow Execution component | `custom_workflow_executions` | `custom.workflow_execution_<b2b | b2c>` |

Each deployment has 24 prices: twelve standard-plan combinations and twelve Custom-component combinations. Both customer types support monthly, quarterly, and yearly periods.

Lookup keys are assigned on Stripe Price objects. Crater reads them but never writes them or derives checkout Price IDs from them. Commit `9ab1a2c` adds deployment-specific ID resolution and environment-variable names; the lookup-key naming is verified Stripe catalog data, not a naming rule enforced by that commit. Frontend price matching must include deployment type and use the Stripe spellings above.

### HTTP authentication

GraphQL requests are sent to `POST /graphql`. Crater uses header-based session authentication and does not use an authentication cookie:

```http
Authorization: Session <crater-session-token>
Content-Type: application/json
```

Authentication behavior:

- Queries can be executed anonymously; this explicitly includes `subscriptionPrices`.
- `usersLogin` and `usersCreateGuestUser` can be executed anonymously. Each must be the only top-level selection in its operation.
- All other mutations, including `checkoutCreateSession`, require an active Crater `UserSession`.
- A protected mutation without an `Authorization` header returns HTTP `403 Forbidden`.
- An unknown authentication scheme returns HTTP `401 Unauthorized`, as does any token that does not resolve to a usable session. Revoked, expired, and entirely unknown tokens are answered identically, so the response never reveals whether a session exists.
- Every session carries a server-set `expiresAt`; see [the session lifecycle](#the-session-lifecycle).
- `usersLogin` and `usersCreateGuestUser` return the token when creating a session. `usersLogout` revokes the current or explicitly selected own session, returning neither token nor session ID.
- The Sagittarius login token and the resulting Crater session token are distinct credentials with different header schemes.

### Mutations

Almost all mutations optionally accept `clientMutationId` and return it so the client can correlate the response with its request. Mutation payloads also contain a non-null `errors: [Error!]!` field.

#### Authentication and access

| Mutation               | Key arguments                                                                           | Result                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `usersLogin`           | `sagittariusToken: String!`, obtained from Sagittarius through `usersCreateCraterToken` | Newly created `UserSession` and its Crater session token                                         |
| `usersCreateGuestUser` | `email: String!`                                                                        | Creates a Sagittarius guest; returns `claimToken` and a new Crater `userSession`                 |
| `usersLogout`          | optional `id: UserSessionID`                                                            | Revokes the current session or another own session; returns only `errors` and `clientMutationId` |
| `echo`                 | Optional message                                                                        | Returned message; verifies mutation access without changing data                                 |

Guest creation uses the usual `input` object and returns `errors`; profile completion is handled by Sagittarius. See [guest users](#guest-users).

#### Customers

| Mutation                           | Key arguments                                                             | Result                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `customersCreate`                  | `customerType!`, `name!`, `email!`, `address!`; optional phone and tax ID | Created `Customer`                                                                                                                          |
| `customersUpdate`                  | `id!`, optional contact details, address, and `paymentMethods`            | Updated `Customer`; attached payment methods the `paymentMethods` list no longer names are detached in Stripe and dropped from the customer |
| `customersDelete`                  | `id!`                                                                     | Deleted `Customer`                                                                                                                          |
| `customerPaymentMethodSetupCreate` | `customerId!`                                                             | Stripe SetupIntent `clientSecret` for collecting a new default payment method                                                               |

`customersCreate` requires the customer type and contact/address details:

```graphql
customersCreate(
  input: {
    customerType: CustomerType!      # PERSONAL or BUSINESS
    name: String!                    # required
    email: String!                   # required
    address: CustomerAddressCreateInput! # every inner field required
    phone: String                    # optional
    taxIdType: String                # optional, only together with taxIdValue
    taxIdValue: String               # optional, only together with taxIdType
  }
): CustomersCreatePayload
```

Its behaviour:

- Every call creates a customer. Nothing is reused: a user that already has one and asks for another gets a second, distinct customer with its own Stripe Customer, and the existing one keeps its membership.
- Customer type, name, email, and address are required. A malformed email or invalid model data returns `INVALID_CUSTOMER`; missing non-null GraphQL inputs fail schema validation.
- `CustomerAddressCreateInput` requires all six address fields. Updates use the separate `CustomerAddressUpdateInput` with optional fields. Stripe Checkout can collect updated contact details and sync them back after completion.
- There is no checkout-flow argument. The checkout runs for a customer that already exists; see [checkout and Stripe](#checkout-and-stripe).

#### Checkout

| Mutation                | Key arguments                                                                                                                 | Result                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `checkoutCreateSession` | `customerId!`, `deploymentType!`, `plan!`, `paymentPeriod!`, `returnUrl!`; optional quantities, `namespaceId`, and `referral` | Embedded `CheckoutSession` with a frontend `clientSecret` |

For `checkoutCreateSession`:

- The request must include `Authorization: Session <crater-session-token>`; the mutation is not anonymously accessible.
- `customerId: CustomerID!` is required and must name a customer linked to the authenticated user. Create a customer first when necessary.
- Membership uses the same rule as `CustomerPolicy.read_customer`. A nonexistent customer and one belonging to another user return identical `INVALID_CHECKOUT_CUSTOMER` responses.
- A repeated `checkoutCreateSession` for the same customer creates a new Stripe session but no additional customer.
- `deploymentType` selects the Cloud or Self-Hosted price catalog, and the customer's stored type selects its B2B or B2C Prices. This applies to Pro, Max, and Custom components. Both customer types support monthly, quarterly, and yearly periods. Invalid periods return `INVALID_CHECKOUT_SELECTION`; a Price available only for the other customer type within the chosen deployment returns `CUSTOMER_TYPE_MISMATCH`.
- The Stripe Checkout Session is created with the selected customer's `stripe_customer_id`, so the contact details, billing address, and tax ID that Stripe collects are synced back to exactly that customer. Its Crater customer ID is stored in the subscription metadata as `crater_customer_id`.
- Crater never sends `customer_email`; the Stripe Customer is referenced by ID, and Stripe rejects both parameters together. An email already on the Stripe Customer is therefore never restated, and a missing one is collected by the client's `ContactDetailsElement`.
- A regular checkout uses `plan`, `paymentPeriod`, and, where applicable, `deploymentType` and `namespaceId`. There is no `promotionCode` argument; see [discounts](#discounts-in-a-checkout).
- `plan: custom` requires both `aiTokens` and `workflowExecutions`, each matching one of the customer's configured packages exposed by `Customer.checkoutLimits`.
- Pro and Max resolve fixed quantities from `checkout.plan_quantities`; optional client quantities must match them exactly. Invalid package choices return `INVALID_CHECKOUT_SELECTION` before Stripe is called. Non-integer or out-of-range GraphQL `Int` inputs fail schema validation.
- `namespaceId` is only relevant to cloud deployments.
- `returnUrl` must have an origin listed in `checkout.allowed_return_origins`.
- Stripe receives `ui_mode: elements`; the frontend initializes the custom checkout UI with the returned `clientSecret`.
- Every session is created with `allow_promotion_codes: true`, so the client can apply and remove a discount inside the session it already has. Crater sends no `discounts`; see [discounts in a checkout](#discounts-in-a-checkout).
- Stripe collects the billing address, updates the customer's address and name, and calculates tax automatically.
- The session enables `tax_id_collection`, so a business customer without a stored tax ID can supply one through Stripe's `TaxIdElement`. The collected tax ID is resolved back to its Stripe `TaxId` object and stored on the Crater customer by the `checkout.session.completed` webhook.
- Subscription metadata contains `plan`, `payment_period`, and both resolved quantities for standard and custom plans. Optional `referral` is stored for Stripe dashboard filtering and analytics. Metadata values longer than 500 bytes are rejected with `INVALID_CHECKOUT_SELECTION`.

#### Subscriptions

| Mutation                     | Key arguments                                                                             | Result                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `subscriptionsPreviewUpdate` | `id: SubscriptionID!`, optional `plan`, `paymentPeriod`, `aiTokens`, `workflowExecutions` | `SubscriptionUpdatePreview` with the proration, the resulting invoice, and the effective moment |
| `subscriptionsUpdate`        | the same arguments plus optional `paymentMethodId`                                        | Updated `Subscription`                                                                          |
| `subscriptionsCancel`        | `id: SubscriptionID!`, optional `immediately: Boolean` (default `false`)                  | Updated subscription with cancellation reflected in `cancelAt`/`status`                         |
| `subscriptionsResume`        | `id: SubscriptionID!`                                                                     | `Subscription` with the cancellation taken back                                                 |
| `subscriptionsLinkNamespace` | `id: SubscriptionID!`, `namespaceId: NamespaceID!`                                        | Updated cloud subscription with its local namespace link                                        |

All five require an active session; anonymous requests are refused with HTTP `403` before the mutation runs.

For `subscriptionsUpdate` and `subscriptionsPreviewUpdate`:

- At least one of `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions` has to be supplied; all four missing is `INVALID_CHECKOUT_SELECTION`. For `subscriptionsUpdate` a `paymentMethodId` on its own is enough, and the plan half is then skipped entirely; see [the payment method of a subscription](#the-payment-method-of-a-subscription).
- Arguments that are not supplied keep their current value. An interval change does not reset the quantities, and a quantity change does not move the plan.
- Moving to Pro or Max replaces custom line items with a single plan line item and resolves the target plan's configured quantities. Explicit standard-plan quantities must match those entitlements. Moving from a standard plan to Custom requires both quantities; staying on Custom preserves unspecified current quantities.
- Each custom quantity must match a package from the customer's `checkoutLimits`; the planner uses the same resolver as fresh checkout creation.
- Price resolution uses the subscription's stored deployment type and its customer's stored `customerType`. A Price configured only for the other customer type within the same deployment is `CUSTOMER_TYPE_MISMATCH`; there is no cross-deployment fallback. See [the payment periods of a customer type](#the-payment-periods-of-a-customer-type).
- A subscription carrying no checkout plan and one that is no longer active are `INVALID_SUBSCRIPTION`. Cancelling a negotiated subscription is still allowed.
- An update that changes nothing succeeds without calling Stripe.
- A subscription that does not exist and one belonging to somebody else are answered with the same `INVALID_SUBSCRIPTION` error and the same message, so the response never reveals which of the two it was -- the rule `checkoutCreateSession` already follows for `INVALID_CHECKOUT_CUSTOMER`.

`subscriptionsPreviewUpdate` previews a change to an existing subscription: an upgrade is charged immediately with a proration, so the client has to be able to name the amount before the user clicks. It reads only -- it retrieves the subscription, asks Stripe to preview an invoice, and returns. `SubscriptionUpdatePreview` contains the resolved `plan`, `paymentPeriod`, `aiTokens`, and `workflowExecutions`, plus `effectiveAt`, `immediate`, `prorationAmount`, `total`, and `currency`. Amounts are integers in the smallest currency unit and the preview is non-binding. Because it runs the same planner as `subscriptionsUpdate`, the `effectiveAt` it reports is the moment the update then actually establishes.

`subscriptionsCancel` defaults to `cancel_at_period_end`, reflected by `cancelAt`. An immediate cancellation request is honored only within fourteen days of the local subscription's creation; later requests become period-end cancellations. Existing licenses remain unchanged. `subscriptionsResume` removes a pending cancellation; terminal subscriptions return `INVALID_SUBSCRIPTION`, and a resume with nothing to undo is a successful no-op.

#### Licenses

| Mutation         | Key arguments    | Result                                |
| ---------------- | ---------------- | ------------------------------------- |
| `licensesExport` | `id: LicenseID!` | Signed license file; self-hosted only |

## Error handling

A GraphQL error object consists of:

- `errorCode: ErrorCodeEnum!`
- optional `details: [DetailedError!]`

`DetailedError` is a union of:

- `ActiveModelError`, containing the affected attribute and failed validation type
- `MessageError`, containing a human-readable error message

Documented error codes:

| Code                                    | Meaning                                                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GUEST_USER_CREATION_FAILED`            | Sagittarius could not create the guest user                                                                                                                          |
| `INVALID_EMAIL`                         | The email passed to guest creation is blank                                                                                                                          |
| `CUSTOMER_TYPE_MISMATCH`                | The selected customer's type does not match the selected checkout                                                                                                    |
| `INVALID_CHECKOUT_CUSTOMER`             | The selected customer does not exist or is not accessible to the current user                                                                                        |
| `INVALID_CHECKOUT_SESSION`              | The checkout session could not be created                                                                                                                            |
| `INVALID_CHECKOUT_STATUS_SESSION`       | The completion-status session is nonexistent, inaccessible, or inconsistent                                                                                          |
| `CHECKOUT_STATUS_UNAVAILABLE`           | Stripe could not provide checkout completion status                                                                                                                  |
| `INVALID_CHECKOUT_SELECTION`            | The selected plan, payment period, quantity, or configured Price combination is invalid, in a checkout and in a change to an existing subscription alike             |
| `INVALID_CUSTOMER`                      | The customer is invalid                                                                                                                                              |
| `INVALID_INVOICE`                       | The invoice is invalid                                                                                                                                               |
| `INVALID_LICENSE`                       | The license is invalid                                                                                                                                               |
| `INVALID_PAYMENT_METHOD`                | The selected payment method does not exist or does not belong to this customer                                                                                       |
| `INVALID_PAYMENT_METHOD_SETUP_CUSTOMER` | The selected customer does not exist, is not accessible to the current user, or has no billing account to set a payment method up for                                |
| `INVALID_PAYMENT_METHOD_SETUP_SESSION`  | The payment method setup could not be created                                                                                                                        |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in                                                                                                                       |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid, does not exist, is not accessible to the current user, is no longer active, or carries no checkout plan and therefore cannot be changed |
| `INVALID_USER`                          | The local user derived from Sagittarius is invalid                                                                                                                   |
| `MISSING_PERMISSION`                    | The user does not have the required permission                                                                                                                       |
| `PAYMENT_METHOD_IN_USE`                 | The payment method is the default for an active subscription and cannot be removed                                                                                   |
| `PAYMENT_METHOD_UNAVAILABLE`            | Stripe could not provide the payment method list, summary, or subscription default                                                                                   |
| `SAGITTARIUS_UNAVAILABLE`               | Sagittarius could not be reached or returned an unexpected response                                                                                                  |
| `UNABLE_TO_LIST_PRICES`                 | Active recurring Stripe prices could not be retrieved                                                                                                                |

## Types and conventions

- `String`: UTF-8 text
- `Int`: signed 32-bit integer
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
7. For a Custom plan, the frontend reads `Customer.checkoutLimits` and selects both quantities from the offered packages. Standard plans have configured fixed quantities.
8. Crater creates an embedded Stripe Checkout Session for the selected plan and required `customerId`, returning its `clientSecret`.
9. The frontend mounts Stripe's custom checkout UI, which collects billing details and calculates tax. Promotion codes are applied and validated through `checkout.applyPromotionCode()` and removed through `checkout.removePromotionCode()`.
10. Subscription metadata includes the Crater customer ID, deployment type, customer type, plan, payment period, resolved quantities, optional namespace ID, and optional referral.
11. The verified `checkout.session.completed` webhook creates or updates Crater's subscription projection and syncs the email, name, phone, address, and tax ID from the session's `customer_details` back to the Crater customer. The webhook does not grant paid access by itself.
12. The verified `invoice.paid` webhook records the invoice and appends a license for its service period, with grace stored separately. Failed payments and cancellations create no license snapshot. Paid/failure emails are queued when the corresponding handler first creates the local invoice record.
13. The dashboard reads the billing history of a license from that local projection through `License.invoices`.
14. A self-hosted license can be exported with `licensesExport`. A cloud subscription can be linked locally through `subscriptionsLinkNamespace`; the remote Sagittarius integration remains incomplete.
15. To change the payment method of an active customer later, the client calls `customerPaymentMethodSetupCreate`, confirms the returned SetupIntent with Stripe Elements, and reloads the customer data afterwards. The verified `setup_intent.succeeded` webhook is what makes the collected payment method the default, so the confirmation itself is not proof that it already is.
16. To change the subscription later, the client reads it through `Customer.subscriptions` or `License.subscription`, calls `subscriptionsPreviewUpdate` to show the amount and the effective moment, and then `subscriptionsUpdate`. The same mutation moves the subscription to another stored payment method through `paymentMethodId`. An upgrade applies at once and is prorated; a downgrade or an interval change becomes a Stripe subscription schedule and applies at the end of the period. `subscriptionsCancel` ends the subscription at the end of the paid period, and `subscriptionsResume` takes that back. The verified `customer.subscription.updated` webhook is what makes the projection reflect the change, and the new entitlements arrive with the next `invoice.paid`.

If the user abandons the checkout at any point between steps 6 and 11, the customer stays as it was created; only the Stripe session expires.

The guest alternative replaces login steps 2–4 with `usersCreateGuestUser(email:)`, using the mutation's `input` wrapper. It returns a Crater session and a separate Sagittarius claim token; profile completion happens through Sagittarius.
