import { Window } from "happy-dom"

export function installDomTestEnvironment(url = "https://example.com/en/checkout") {
    const domWindow = new Window({ url })
    const globals = {
        window: domWindow,
        document: domWindow.document,
        navigator: domWindow.navigator,
        Node: domWindow.Node,
        Element: domWindow.Element,
        HTMLElement: domWindow.HTMLElement,
        HTMLInputElement: domWindow.HTMLInputElement,
        Event: domWindow.Event,
        MouseEvent: domWindow.MouseEvent,
        KeyboardEvent: domWindow.KeyboardEvent,
        MutationObserver: domWindow.MutationObserver,
        getComputedStyle: domWindow.getComputedStyle.bind(domWindow),
        requestAnimationFrame: domWindow.requestAnimationFrame.bind(domWindow),
        cancelAnimationFrame: domWindow.cancelAnimationFrame.bind(domWindow),
        IS_REACT_ACT_ENVIRONMENT: true,
    }

    for (const [name, value] of Object.entries(globals)) {
        Object.defineProperty(globalThis, name, {
            configurable: true,
            value,
            writable: true,
        })
    }

    return domWindow
}
