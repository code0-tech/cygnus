import config from "@/payload.config"
import { importPages, normalizeImportLocale, normalizePageImportDocs } from "@/lib/importPages"
import { getPayload } from "payload"

export async function POST(request: Request) {
  const url = new URL(request.url)
  const locale = normalizeImportLocale(url.searchParams.get("locale") || "en")
  const dryRun = url.searchParams.get("dryRun") === "true"
  const docs = normalizePageImportDocs(await request.json())
  const payload = await getPayload({ config })

  const result = await importPages({
    docs,
    dryRun,
    locale,
    payload,
  })

  return Response.json(result, { status: result.rejected > 0 ? 207 : 200 })
}
