import type { ErrorsContent } from "@/lib/cms"

export function NamespaceSelectionError({ error, errors }: { error?: string | null; errors: ErrorsContent }) {
    if (!error) return null
    return (
        <p role="alert" className="my-4 rounded-lg border border-error/30 p-4 text-sm text-error">
            {error === "occupied" ? errors.namespaceInUse : errors.licenseUpdate}
        </p>
    )
}
