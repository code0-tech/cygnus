import type { Page } from "@/payload-types"

type PageLayoutBlock = NonNullable<Page["layout"]>[number]
type PageBlockType = PageLayoutBlock["blockType"]

export function findPageBlock<TBlockType extends PageBlockType>(
    page: Pick<Page, "layout"> | null | undefined,
    blockType: TBlockType,
): Extract<PageLayoutBlock, { blockType: TBlockType }> | null {
    const block = page?.layout?.find((layoutBlock): layoutBlock is Extract<PageLayoutBlock, { blockType: TBlockType }> => (
        layoutBlock.blockType === blockType
    ))

    return block ?? null
}
