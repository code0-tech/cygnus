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
}

export const fadeInUp = {
    initial: {opacity: 0, filter: "blur(10px)", y: -30},
    animate: {opacity: 1, filter: "blur(0px)", y: 0},
    transition: {duration: 0.65}
}
