import {RefObject, useEffect, useRef} from "react"

type EventHandler = (e: MouseEvent | TouchEvent) => void;

function useOutsideClick<T extends HTMLElement = HTMLElement>(callback: EventHandler): RefObject<T | null> {
    const ref = useRef<T>(null)

    useEffect(() => {
        const handle = (e: MouseEvent | TouchEvent) => {
            const el = ref.current
            if (!el || el.contains(e.target as Node)) return
            callback(e)
        }

        document.addEventListener("mousedown", handle)
        document.addEventListener("touchstart", handle)

        return () => {
            document.removeEventListener("mousedown", handle)
            document.removeEventListener("touchstart", handle)
        }
    }, [callback])

    return ref
}

export {useOutsideClick}