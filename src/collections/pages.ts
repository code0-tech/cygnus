import { HeroBlock } from "@/blocks/HeroBlock"
import { BrandBlock } from "@/blocks/BrandBlock"
import { CtaBlock } from "@/blocks/CtaBlock"
import { FaqBlock } from "@/blocks/FaqBlock"
import { UseCaseBlock } from "@/blocks/UseCaseBlock"
import type { CollectionConfig } from "payload"

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "layout",
      label: "Layout",
      type: "blocks",
      blocks: [HeroBlock, BrandBlock, UseCaseBlock, FaqBlock, CtaBlock],
      required: false,
    },
  ],
}
