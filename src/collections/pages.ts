import { ActionBlock } from "@/blocks/ActionBlock"
import { EditionUseCaseBlock } from "@/blocks/EditionUseCaseBlock"
import { BrandBlock } from "../blocks/BrandBlock"
import { ContactBlock } from "../blocks/ContactBlock"
import { CtaBlock } from "../blocks/CtaBlock"
import { DeploymentBlock } from "../blocks/DeploymentBlock"
import { EditionFeaturesBlock } from "../blocks/EditionFeaturesBlock"
import { EditionHeroBlock } from "../blocks/EditionHeroBlock"
import { EditionInstallBlock } from "../blocks/EditionInstallBlock"
import { FaqBlock } from "../blocks/FaqBlock"
import { HeroBlock } from "../blocks/HeroBlock"
import { JobsBlock } from "../blocks/JobsBlock"
import { MarkdownBlock } from "../blocks/MarkdownBlock"
import { UseCaseBlock } from "../blocks/UseCaseBlock"
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
        { label: "actions", value: "actions" },
        { label: "community-edition", value: "community-edition" },
        { label: "enterprise-edition", value: "enterprise-edition" },
        { label: "subscription", value: "subscription" }
      ],
    },
    {
      name: "layout",
      label: "Layout",
      type: "blocks",
      blocks: [HeroBlock, EditionHeroBlock, EditionFeaturesBlock, EditionInstallBlock, EditionUseCaseBlock, BrandBlock, UseCaseBlock, FaqBlock, CtaBlock, JobsBlock, ActionBlock, MarkdownBlock, ContactBlock, DeploymentBlock],
      required: false,
      localized: true,
    },
  ],
}
