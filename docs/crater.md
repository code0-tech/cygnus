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
- An `Invoice` consists of `InvoiceItem` entries.
- A `Subscription` forms the basis of a `License`.
- `ProcessedWebhookEvent` separately records incoming Stripe webhook events and uses a unique Stripe event ID to prevent duplicate processing.

### Customer and address

`Customer` represents a billing customer. The data model contains:

- customer type
- optional name, email, and phone number
- Stripe customer ID
- Stripe tax ID

The GraphQL API additionally returns a global ID and creation and update timestamps.

`CustomerAddress` and `CustomerAddressInput` contain:

- `line1` and `line2`
- `city`
- `state`
- `postalCode`
- `country` as a country code

Business customers can initially be created without a tax ID. When tax ID data is provided, `taxIdType` and `taxIdValue` must be supplied together.

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
- automatic synchronization of the customer's email, name, phone number, address, and tax ID from the completed Stripe Checkout Session
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

### Subscriptions, invoices, and licenses

`Subscription` stores the deployment type, Stripe status, unique Stripe subscription ID, and an optional Sagittarius namespace ID.

`Invoice` contains:

- total, net, and tax amounts
- currency and status
- billing period
- a unique Stripe invoice ID
- an optional invoice number and Stripe PDF URL
- an optional Stripe fee
- optional Lexware ID and URL

The associated `InvoiceItem` entries contain an amount, description, and quantity.

Crater defines three transactional invoice emails:

- invoice finalized
- invoice paid
- invoice payment failed

They are addressed to the customer's email address. Subjects use the invoice number and fall back to the Stripe invoice ID when no invoice number exists. Both HTML and plain-text variants are present, with previews available through Rails mailer previews.

The Rails mail bodies are currently placeholders. Invoice lifecycle webhooks and automatic delivery of these emails are also not implemented yet; the only handled Stripe event remains `checkout.session.completed`.

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

This allows Crater to track Stripe webhook processing and handle events idempotently.

## GraphQL API

### Entry point

All queries start at the root `Query` type. The currently documented query fields are:

| Query                | Argument           | Return type         | Purpose                                                                |
| -------------------- | ------------------ | ------------------- | ---------------------------------------------------------------------- |
| `echo`               | `message: String!` | `String!`           | Verifies read access to the API and returns the supplied message.      |
| `subscriptionPrices` | none               | `[CheckoutPrice!]!` | Returns active recurring Stripe prices and can be queried anonymously. |

`CheckoutPrice` contains:

- Stripe price ID
- currency and unit amount in the smallest currency unit
- recurring interval, such as `month` or `year`
- optional stable `lookupKey`
- expanded Stripe product name

Prices and products are managed in Stripe. The listing query fetches active recurring prices directly instead of mirroring a product catalog locally. Checkout creation still resolves its `plan` argument through the configured `checkout.prices` mapping. Stripe retrieval failures surface as a GraphQL execution error based on `UNABLE_TO_LIST_PRICES`.

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

### Browser session persistence

The checkout exchanges the short-lived Sagittarius token through its server-side `/api/crater/login` route. That route stores the resulting Crater session token in an `HttpOnly`, `SameSite=Lax` cookie scoped to `/api/crater`; it does not expose the Crater token to client-side JavaScript. Browser requests use the cookie automatically, while the server forwards `Authorization: Session <crater-session-token>` to Crater. On reload, `/api/crater/auth/session` validates the persisted session with Crater. Invalid or expired session responses clear the cookie.

### Mutations

Almost all mutations optionally accept `clientMutationId` and return it so the client can correlate the response with its request. Mutation payloads also contain a non-null `errors: [Error!]!` field.

#### Authentication and access

| Mutation     | Key arguments                                                                           | Result                                                           |
| ------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `usersLogin` | `sagittariusToken: String!`, obtained from Sagittarius through `usersCreateCraterToken` | Newly created `UserSession` and its Crater session token         |
| `echo`       | Optional message                                                                        | Returned message; verifies mutation access without changing data |

#### Customers

| Mutation          | Key arguments                                                  | Result             |
| ----------------- | -------------------------------------------------------------- | ------------------ |
| `customersCreate` | `customerType!`, optional contact details, address, and tax ID | Created `Customer` |
| `customersUpdate` | `id!`, optional contact details and address                    | Updated `Customer` |
| `customersDelete` | `id!`                                                          | Deleted `Customer` |

For `customersCreate`, only `customerType` is mandatory in the GraphQL schema. Other fields that are required by the domain are checked through model validations.

#### Checkout

| Mutation                             | Key arguments                                                                                 | Result                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `checkoutCalculateTax`               | `plan!`, `paymentPeriod!`, and optional custom quantities                                      | `CheckoutTaxQuote`                                        |
| `checkoutValidateDiscount`           | `code: String!`                                                                               | `CheckoutDiscount`                                        |
| `checkoutCreateSession`              | `paymentPeriod!`, `returnUrl!`, and either a plan or custom configuration                      | Embedded `CheckoutSession` with a frontend `clientSecret` |
| `customCheckoutConfigurationsCreate` | `customerId!`, `deploymentType!`, `stripePriceId!`, optional entitlements and expiration time | `CustomCheckoutConfiguration`                             |

For `checkoutCreateSession`:

- The request must include `Authorization: Session <crater-session-token>`; the mutation is not anonymously accessible.
- The authenticated user must be associated with a customer. Crater uses that user's first customer; if none exists, the mutation returns `INVALID_CHECKOUT_SESSION`.
- A regular checkout uses `plan`, `paymentPeriod`, and, where applicable, `deploymentType`, `namespaceId`, and `promotionCode`.
- `plan: custom` accepts positive `aiTokens` and `workflowExecutions`; at least one quantity is required and the authenticated customer's stored type selects B2B or B2C Prices.
- Each custom quantity must be a positive integer of at most `10000000`.
- A custom checkout uses `customCheckoutConfigurationId`; `plan` and `deploymentType` are then ignored.
- `namespaceId` is only relevant to cloud deployments.
- `returnUrl` must have an origin listed in `checkout.allowed_return_origins`.
- Stripe receives `ui_mode: elements`; the frontend initializes the custom checkout UI with the returned `clientSecret`.
- Stripe collects the billing address, updates the customer's address and name, and calculates tax automatically.
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

| Code                                    | Meaning                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `INVALID_CHECKOUT_SELECTION`            | The selected plan, payment period, quantity, or Price is invalid    |
| `INVALID_CHECKOUT_SESSION`              | The checkout session could not be created                           |
| `INVALID_CUSTOMER`                      | The customer is invalid                                             |
| `INVALID_CUSTOM_CHECKOUT_CONFIGURATION` | The custom checkout configuration is invalid                        |
| `INVALID_DISCOUNT_CODE`                 | The discount code is invalid or inactive                            |
| `INVALID_INVOICE`                       | The invoice is invalid                                              |
| `INVALID_LICENSE`                       | The license is invalid                                              |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in                      |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid                                         |
| `INVALID_TAX_CALCULATION`               | Stripe rejected the tax calculation                                 |
| `INVALID_USER`                          | The local user derived from Sagittarius is invalid                  |
| `MISSING_PERMISSION`                    | The user does not have the required permission                      |
| `SAGITTARIUS_UNAVAILABLE`               | Sagittarius could not be reached or returned an unexpected response |
| `UNABLE_TO_LIST_PRICES`                 | Active recurring Stripe prices could not be retrieved               |

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
6. The authenticated user must have an associated customer. It can initially be created with only its customer type; Stripe Elements subsequently collects contact and billing details.
7. The frontend can preview tax and validate a promotion code.
8. Crater creates an embedded Stripe Checkout Session for a plan or an individually negotiated offer and returns its `clientSecret`.
9. The frontend mounts Stripe's custom checkout UI. Contact details and the billing address are collected together before payment, and Stripe calculates tax automatically.
10. The Stripe subscription receives metadata for the Crater customer ID, deployment type, customer type, and optional namespace ID.
11. The verified `checkout.session.completed` webhook creates or updates Crater's subscription projection, but does not grant paid access by itself.
12. Invoice lifecycle webhook processing, paid-access activation, and automatic invoice-email delivery remain to be implemented.
13. Once the relevant subscription and license data exists, a self-hosted license can be exported while a cloud license can be linked to a Sagittarius namespace.
