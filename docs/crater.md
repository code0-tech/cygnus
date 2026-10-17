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

When creating a business customer, `taxIdType` and `taxIdValue` are also expected.

### Users and sessions

`User` contains a global ID, timestamps, and an admin flag in the data model. Its sessions are returned as a paginated `UserSessionConnection`.

A `UserSession` contains:

- a global session ID
- an `active` status
- the associated user
- timestamps
- a session token, which is only returned when the session is created

Login uses a token issued by Sagittarius. Session lists follow the GraphQL connection model with `nodes`, `edges`, cursors, a total count, and `pageInfo`.

### Checkout and Stripe

Crater creates Stripe Checkout Sessions in subscription mode for the current customer. A checkout can be based either on a regular internal plan or on an individually negotiated `CustomCheckoutConfiguration`.

A `CheckoutSession` returns:

- the Stripe session ID
- the redirect URL for the frontend
- the expiration time as a Unix timestamp

Additional checkout features include:

- previewing the tax Stripe would calculate for a plan
- validating Stripe promotion codes
- supporting the `self_hosted` and `cloud` deployment types
- optionally linking a cloud checkout to a Sagittarius namespace ID
- configurable success and cancellation URLs

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

All queries start at the root `Query` type. The currently documented query field is:

| Query  | Argument           | Return type | Purpose                                                           |
| ------ | ------------------ | ----------- | ----------------------------------------------------------------- |
| `echo` | `message: String!` | `String!`   | Verifies read access to the API and returns the supplied message. |

### Mutations

Almost all mutations optionally accept `clientMutationId` and return it so the client can correlate the response with its request. Mutation payloads also contain a non-null `errors: [Error!]!` field.

#### Authentication and access

| Mutation     | Key arguments               | Result                                                           |
| ------------ | --------------------------- | ---------------------------------------------------------------- |
| `usersLogin` | `sagittariusToken: String!` | Created `UserSession`                                            |
| `echo`       | Optional message            | Returned message; verifies mutation access without changing data |

#### Customers

| Mutation          | Key arguments                                                  | Result             |
| ----------------- | -------------------------------------------------------------- | ------------------ |
| `customersCreate` | `customerType!`, optional contact details, address, and tax ID | Created `Customer` |
| `customersUpdate` | `id!`, optional contact details and address                    | Updated `Customer` |
| `customersDelete` | `id!`                                                          | Deleted `Customer` |

For `customersCreate`, only `customerType` is mandatory in the GraphQL schema. Other fields that are required by the domain are checked through model validations.

#### Checkout

| Mutation                             | Key arguments                                                                                 | Result                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `checkoutCalculateTax`               | `plan: String!`                                                                               | `CheckoutTaxQuote`            |
| `checkoutValidateDiscount`           | `code: String!`                                                                               | `CheckoutDiscount`            |
| `checkoutCreateSession`              | `successUrl!`, `cancelUrl!`, and either a regular plan or custom configuration                | `CheckoutSession`             |
| `customCheckoutConfigurationsCreate` | `customerId!`, `deploymentType!`, `stripePriceId!`, optional entitlements and expiration time | `CustomCheckoutConfiguration` |

For `checkoutCreateSession`:

- A regular checkout uses `plan` and, where applicable, `deploymentType`, `namespaceId`, and `promotionCode`.
- A custom checkout uses `customCheckoutConfigurationId`; `plan` and `deploymentType` are then ignored.
- `namespaceId` is only relevant to cloud deployments.

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

| Code                                    | Meaning                                        |
| --------------------------------------- | ---------------------------------------------- |
| `INVALID_CHECKOUT_SESSION`              | The checkout session could not be created      |
| `INVALID_CUSTOMER`                      | The customer is invalid                        |
| `INVALID_CUSTOM_CHECKOUT_CONFIGURATION` | The custom checkout configuration is invalid   |
| `INVALID_DISCOUNT_CODE`                 | The discount code is invalid or inactive       |
| `INVALID_INVOICE`                       | The invoice is invalid                         |
| `INVALID_LICENSE`                       | The license is invalid                         |
| `INVALID_SAGITTARIUS_TOKEN`             | The Sagittarius token cannot be used to log in |
| `INVALID_SUBSCRIPTION`                  | The subscription is invalid                    |
| `INVALID_TAX_CALCULATION`               | Stripe rejected the tax calculation            |
| `MISSING_PERMISSION`                    | The user does not have the required permission |

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

1. A user logs in with a Sagittarius token and receives a session.
2. A customer is created or updated with contact, address, and, where applicable, tax details.
3. The frontend can preview tax and validate a promotion code.
4. Crater creates a Stripe Checkout Session for a plan or an individually negotiated offer.
5. Stripe events are processed as webhooks and protected against duplicate processing.
6. The subscription, invoice, and license are created or updated as a result.
7. A self-hosted license is exported, while a cloud license is linked to a Sagittarius namespace.
