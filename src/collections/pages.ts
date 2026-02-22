import { HeroBlock } from "@/blocks/HeroBlock"
import { BrandBlock } from "@/blocks/BrandBlock"
import { CtaBlock } from "@/blocks/CtaBlock"
import { FaqBlock } from "@/blocks/FaqBlock"
import { UseCaseBlock } from "@/blocks/UseCaseBlock"
import { JobsBlock } from "@/blocks/JobsBlock"
import { MarkdownBlock } from "@/blocks/MarkdownBlock"
import { ContactBlock } from "@/blocks/ContactBlock"
import type { CollectionConfig } from "payload"
import { DeploymentBlock } from "@/blocks/DeploymentBlock"

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
      localized: true,
    },
    {
      name: "slug",
      type: "select",
      required: true,
      unique: true,
      index: true,
      options: [
        { label: "main", value: "main" },
        { label: "jobs", value: "jobs" },
        { label: "features", value: "features" },
        { label: "about-us", value: "about-us" },
        { label: "legal-notice", value: "legal-notice" },
        { label: "privacy", value: "privacy" },
        { label: "terms", value: "terms" },
        { label: "contact", value: "contact" },
      ],
    },
    {
      name: "layout",
      label: "Layout",
      type: "blocks",
      blocks: [HeroBlock, BrandBlock, UseCaseBlock, FaqBlock, CtaBlock, JobsBlock, MarkdownBlock, ContactBlock, DeploymentBlock],
      required: false,
      localized: true,
    },
  ],
}
