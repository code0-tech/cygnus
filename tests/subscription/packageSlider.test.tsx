import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import React, { useState } from "react"
import { installDomTestEnvironment } from "../checkout/domTestEnvironment"

const dom = installDomTestEnvironment()
const { act, cleanup, fireEvent, render, screen } = await import("@testing-library/react")
const { PackageSlider } = await import("../../src/components/ui/PackageSlider")
const frames = new Map<number, FrameRequestCallback>()
let frameId = 0
window.requestAnimationFrame = (callback) => {
    frames.set(++frameId, callback)
    return frameId
}
window.cancelAnimationFrame = (id) => {
    frames.delete(id)
}
afterEach(() => {
    cleanup()
    frames.clear()
})

function prepareTrack() {
    const track = screen.getByRole("slider")
    let captured = false
    Object.assign(track, {
        setPointerCapture: () => {
            captured = true
        },
        hasPointerCapture: () => captured,
        releasePointerCapture: () => {
            captured = false
        },
        getBoundingClientRect: () => ({ left: 0, right: 300, width: 300 }),
    })
    return track
}
function pointer(track: HTMLElement, type: string, clientX: number) {
    fireEvent(track, new dom.PointerEvent(type, { bubbles: true, clientX, pointerId: 1 }) as unknown as Event)
}
function settleAnimation() {
    let time = performance.now()
    for (let i = 0; i < 200 && frames.size; i += 1) {
        time += 16
        act(() => {
            const callbacks = [...frames.values()]
            frames.clear()
            callbacks.forEach((callback) => callback(time))
        })
    }
    assert.equal(frames.size, 0)
}

test("tracks the pointer continuously and settles on a valid package after release", () => {
    const changes: number[] = []
    const commits: number[] = []
    function Controlled() {
        const [value, setValue] = useState(10)
        return (
            <PackageSlider
                packages={[10, 100, 500, 1000]}
                value={value}
                lines={31}
                onChange={(next) => {
                    changes.push(next)
                    setValue(next)
                }}
                onValueCommit={(next) => commits.push(next)}
            />
        )
    }
    render(<Controlled />)
    const track = prepareTrack()
    pointer(track, "pointerdown", 0)
    pointer(track, "pointermove", 180)
    assert.deepEqual(changes, [500])
    assert.deepEqual(commits, [])
    const bars = track.firstElementChild!.children
    assert.equal((bars[19].firstElementChild as HTMLElement).style.opacity, "0")
    pointer(track, "pointermove", 185)
    assert.deepEqual(changes, [500])
    assert.ok(Number((bars[19].firstElementChild as HTMLElement).style.opacity) > 0)
    const dragOpacity = (bars[19].firstElementChild as HTMLElement).style.opacity
    pointer(track, "pointerup", 185)
    assert.deepEqual(commits, [500])
    assert.equal((bars[19].firstElementChild as HTMLElement).style.opacity, dragOpacity)
    settleAnimation()
    assert.equal((bars[19].firstElementChild as HTMLElement).style.opacity, "1")
    assert.equal((bars[20].firstElementChild as HTMLElement).style.opacity, "1")
    assert.equal((bars[21].firstElementChild as HTMLElement).style.opacity, "0")
})

test("keyboard changes and commits exactly one package at a time", () => {
    const changes: number[] = []
    const commits: number[] = []
    render(<PackageSlider packages={[10, 100, 500]} value={100} onChange={(value) => changes.push(value)} onValueCommit={(value) => commits.push(value)} />)
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" })
    assert.deepEqual(changes, [500])
    assert.deepEqual(commits, [500])
})

test("a single package disables pointer and keyboard changes", () => {
    const changes: number[] = []
    render(<PackageSlider packages={[100]} value={100} onChange={(value) => changes.push(value)} />)
    const track = prepareTrack()
    assert.equal(track.getAttribute("aria-disabled"), "true")
    pointer(track, "pointerdown", 300)
    fireEvent.keyDown(track, { key: "ArrowRight" })
    assert.deepEqual(changes, [])
})
