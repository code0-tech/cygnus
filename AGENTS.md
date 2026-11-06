# Project Instructions

These instructions apply to the entire repository.

## Billing and Payment Service

Crater is the billing service used by this project. Before changing any code
related to billing, customers, authentication sessions, checkout, discounts,
taxes, subscriptions, invoices, or licenses, read `docs/crater.md` completely.
Treat that document as the primary project-level summary of the Crater API and
domain model.

If more detail is required, consult the source documentation referenced by
`docs/crater.md`, especially the GraphQL schema documentation and database ERD.
Do not infer undocumented fields, mutation arguments, authentication headers,
or response shapes.

## Crater Integration Rules

- Access Crater through its GraphQL API using the Apollo client in
  `src/lib/apolloClient.ts`.
- Keep Crater requests on the server unless a task explicitly requires
  client-side access and exposing that access is known to be safe.
- Keep API URLs, tokens, session credentials, Stripe secrets, and other
  sensitive values in environment variables. Never hard-code or commit them.
- Use the Crater user session produced by `usersLogin` where an authenticated
  operation requires it. A Sagittarius token is an input to login, not a
  substitute for assumptions about Crater session authentication.
- Use the exact GraphQL types, argument names, nullability, and response fields
  documented by Crater.
- Handle both transport-level GraphQL errors and the non-null `errors` field
  returned by mutation payloads.
- Preserve and surface documented Crater error codes where useful. Do not
  reduce all domain failures to a generic checkout error.
- Send monetary amounts as integers in the smallest currency unit. Do not use
  floating-point values for amounts transferred to Crater.
- Treat checkout tax quotes as non-binding previews.
- For `checkoutCreateSession`, use either a regular plan checkout or a custom
  checkout configuration as documented. Do not combine their semantics.
- Only send `namespaceId` for cloud deployments.
- Use the checkout redirect URL returned by Crater. Do not recreate Crater's
  Stripe Checkout Session directly in this application unless the architecture
  is explicitly changed.
- Do not duplicate subscription, invoice, license, or Stripe webhook state that
  is owned by Crater without a documented application requirement.
- Avoid sharing cached customer or payment data between requests. Use
  `no-cache` for sensitive or request-specific Apollo operations when
  appropriate.

## Implementation and Verification

- Keep GraphQL operations close to the relevant billing integration code and
  give operations descriptive names.
- Add explicit TypeScript types for operation variables and relevant response
  data unless generated GraphQL types are available.
- Validate required environment variables and return safe errors that do not
  expose credentials or sensitive payment information.
- After changing TypeScript code, run `npm run typecheck`.
- Add or update focused tests when changing billing calculations, request
  mapping, error handling, or checkout behavior.
- Do not modify generated Payload files or migrations unless the requested
  change requires a schema or database change.
