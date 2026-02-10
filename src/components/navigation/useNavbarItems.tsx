import { IconCube, IconGitBranch, IconLock } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { JSX, useMemo } from "react"
import { NavItem } from "./types"

interface ExtendedSubNavItem {
    icon: JSX.Element
    color: string
}

export const useNavbarItems = () => {
    const t = useTranslations("Navbar")

    return useMemo(() => {
        const items = t.raw("items") as NavItem[]

        const iconMap: Record<string, ExtendedSubNavItem> = {
            features: { icon: <IconCube size={30} />, color: "pink" },
            integrations: { icon: <IconGitBranch size={30} />, color: "yellow" },
            security: { icon: <IconLock size={30} />, color: "aqua" }
        }

        return items.map(item => ({
            ...item,
            subMenu: item.subMenu?.map(sub => ({
                ...sub,
                icon: iconMap[sub.key].icon ?? null,
                color: iconMap[sub.key].color ?? "brand"
            }))
        }))
    }, [t])
}
