import type { Block } from "payload"

export const BlogBlock: Block = {
    slug: "blog",
    labels: {
        singular: "Blog",
        plural: "Blog Blocks",
    },
    fields: [
        {
            name: "viewOtherBlogsLabel",
            label: "View other blogs label",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "View other blog posts",
        },
        {
            name: "noPostsLabel",
            label: "No posts label",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "No blog posts available.",
        },
        {
            name: "loadMoreLabel",
            label: "Load more label",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Load more",
        },
        {
            name: "loadingLabel",
            label: "Loading label",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Loading...",
        },
    ],
}
