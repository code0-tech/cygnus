import assert from "node:assert/strict"
import test, { afterEach, beforeEach, mock } from "node:test"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"
import type { CustomerPaymentMethodSummary } from "../../src/lib/licenses/types"

installDomTestEnvironment()
const { renderHook, waitFor, act, cleanup } = await import("@testing-library/react")
const { useCustomerPaymentMethods } = await import("../../src/hooks/usePaymentMethods")
const card: CustomerPaymentMethodSummary = { id: "pm_card", type: "card", brand: "visa", last4: "4242", expiresMonth: 12, expiresYear: 2030 }
const originalFetch = globalThis.fetch
const originalSetTimeout = window.setTimeout.bind(window)

beforeEach(() => {
    // Only the hook's retry timer is accelerated; Testing Library keeps its normal timers.
    mock.method(window, "setTimeout", (handler: TimerHandler, _delay?: number, ...args: unknown[]) => originalSetTimeout(handler, 1, ...args))
})
afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
    mock.restoreAll()
})

test("waits for methods and display details to become available after checkout", async () => {
    const responses = [[], [{ ...card, type: null, brand: null, last4: null }], [card]]
    let requests = 0
    globalThis.fetch = async () => {
        requests += 1
        return Response.json({ paymentMethods: responses.shift() })
    }
    const { result } = renderHook(() => useCustomerPaymentMethods("customer-1", true, card.id))
    assert.equal(result.current.isLoadingPaymentMethods, true)
    await waitFor(() => assert.equal(result.current.isLoadingPaymentMethods, false))
    assert.equal(requests, 3)
    assert.deepEqual(result.current.paymentMethods, [card])
    assert.equal(result.current.paymentMethodsError, false)
})

test("retries when the subscription's payment method is not in the customer's list yet", async () => {
    let requests = 0
    globalThis.fetch = async () => Response.json({ paymentMethods: ++requests === 1 ? [{ ...card, id: "pm_other" }] : [card] })
    const { result } = renderHook(() => useCustomerPaymentMethods("customer-1", true, card.id))
    await waitFor(() => assert.equal(result.current.isLoadingPaymentMethods, false))
    assert.equal(requests, 2)
    assert.deepEqual(result.current.paymentMethods, [card])
})

test("unavailable summaries stop retrying and can be reloaded manually", async () => {
    let requests = 0
    let available = false
    globalThis.fetch = async () => {
        requests += 1
        return Response.json({ paymentMethods: available ? [card] : [{ ...card, type: null, brand: null }] })
    }
    const { result } = renderHook(() => useCustomerPaymentMethods("customer-1"))
    await waitFor(() => assert.equal(result.current.paymentMethodsError, true))
    assert.equal(result.current.isLoadingPaymentMethods, false)
    assert.equal(requests, 4)
    available = true
    act(() => result.current.refreshPaymentMethods())
    await waitFor(() => assert.equal(result.current.paymentMethodsError, false))
    assert.deepEqual(result.current.paymentMethods, [card])
    assert.equal(requests, 5)
})

test("a customer with no methods eventually shows an empty state", async () => {
    let requests = 0
    globalThis.fetch = async () => {
        requests += 1
        return Response.json({ paymentMethods: [] })
    }
    const { result } = renderHook(() => useCustomerPaymentMethods("customer-1"))
    await waitFor(() => assert.equal(result.current.isLoadingPaymentMethods, false))
    assert.equal(requests, 4)
    assert.deepEqual(result.current.paymentMethods, [])
    assert.equal(result.current.paymentMethodsError, false)
})

test("an expected method that stays missing offers an error instead of a misleading empty state", async () => {
    let requests = 0
    globalThis.fetch = async () => {
        requests += 1
        return Response.json({ paymentMethods: [] })
    }
    const { result } = renderHook(() => useCustomerPaymentMethods("customer-1", true, card.id))
    await waitFor(() => assert.equal(result.current.paymentMethodsError, true))
    assert.equal(result.current.isLoadingPaymentMethods, false)
    assert.equal(requests, 4)
})

test("a response from the previous customer cannot overwrite the current customer's methods", async () => {
    let resolvePrevious!: (response: Response) => void
    globalThis.fetch = async (url) =>
        String(url).includes("customerId=customer-1")
            ? new Promise<Response>((resolve) => {
                  resolvePrevious = resolve
              })
            : Response.json({ paymentMethods: [{ ...card, id: "pm_second" }] })
    const { result, rerender } = renderHook(({ id }) => useCustomerPaymentMethods(id), { initialProps: { id: "customer-1" } })
    rerender({ id: "customer-2" })
    assert.equal(result.current.paymentMethods?.length ?? 0, 0)
    await waitFor(() => assert.equal(result.current.isLoadingPaymentMethods, false))
    await act(async () => resolvePrevious(Response.json({ paymentMethods: [card] })))
    assert.equal(result.current.paymentMethods?.[0].id, "pm_second")
})

test("closing the dialog aborts loading and prevents retries", async () => {
    let resolveResponse!: (response: Response) => void
    let signal: AbortSignal | null | undefined
    let requests = 0
    globalThis.fetch = async (_url, init) => {
        requests += 1
        signal = init?.signal
        return new Promise<Response>((resolve) => {
            resolveResponse = resolve
        })
    }
    const { unmount } = renderHook(() => useCustomerPaymentMethods("customer-1"))
    unmount()
    assert.equal(signal?.aborted, true)
    await act(async () => resolveResponse(Response.json({ paymentMethods: [] })))
    await new Promise((resolve) => originalSetTimeout(resolve, 20))
    assert.equal(requests, 1)
})
