import type { Block } from "payload"

export const JobsBlock: Block = {
  slug: "jobs",
  labels: {
    singular: "Jobs",
    plural: "Jobs Blocks",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Join Our Team",
    },
    {
      name: "searchPlaceholder",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Search jobs",
    },
    {
      name: "allLocationsLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "All locations",
    },
    {
      name: "allJobTypesLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "All job types",
    },
    {
      name: "allCategoriesLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "All categories",
    },
    {
      name: "noJobsFoundLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "No jobs found for your filter.",
    },
  ],
}
