import { IconCube, IconGitBranch, IconLock } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { JSX, useMemo } from "react"

import { NavItem } from "./types"

export const useNavbarItems = () => {
    const t = useTranslations("Navbar")

    return useMemo(() => {
        const items = t.raw("items") as NavItem[]

        const iconMap: Record<string, JSX.Element> = {
            features: <IconCube size={30} />,
            integrations: <IconGitBranch size={30} />,
            security: <IconLock size={30} />
        }

        return items.map(item => ({
            ...item,
            subMenu: item.subMenu?.map(sub => ({
                ...sub,
                icon: iconMap[sub.key] ?? null
            }))
        }))
    }, [t])
}
