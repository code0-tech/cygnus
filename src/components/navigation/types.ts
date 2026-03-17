import {ReactNode} from "react"

export type NavItem = {
    title: string
    href: string | null
    subMenu?: SubNavItem[]
}

export type SubNavItem = {
    key: string
    title: string
    href: string
    description: string
    icon: ReactNode
    color: string
}

export const fadeInUp = {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    transition: {duration: 0.65}
}
