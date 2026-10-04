"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import { Button } from "@code0-tech/pictor"

export function LicenseLoadMoreButton({ loading, labels, onClick }: { loading: boolean; labels: LicenseContent["pagination"]; onClick: () => void }) {
    return (
        <div className="mt-4 flex justify-center">
            <Button type="button" variant="normal" paddingSize="xs" disabled={loading} onClick={onClick}>
                {loading ? <ButtonLoader label={labels.loadingLabel} /> : labels.loadMoreLabel}
            </Button>
        </div>
    )
}
