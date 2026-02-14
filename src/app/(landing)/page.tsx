import { DEFAULT_LOCALE } from "@/utils/i18n"
import { redirect } from "next/navigation"

export default function Page() {
    redirect(`/${DEFAULT_LOCALE}`)
}
