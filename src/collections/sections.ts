import { CollectionConfig } from 'payload'

export const Sections: CollectionConfig = {
    slug: 'sections',
    admin: {
      useAsTitle: 'heading',
    },
    fields: [
        {
            name: 'heading',
            type: 'text',
            required: true,
        },
        {
            name: 'subheading',
            type: 'text',
            required: false,
        },
        {
            name: 'sectionType',
            label: 'Section Type',
            type: 'select',
            required: true,
            options: [
                {
                    label: 'AppFeatureSection',
                    value: 'AppFeatureSection',
                },
                {
                    label: 'BrandSection',
                    value: 'BrandSection',
                },
                {
                    label: 'FaqSection',
                    value: 'FaqSection',
                },
                {
                    label: 'RoadmapSection',
                    value: 'RoadmapSection',
                },
                {
                    label: 'RuntimeFeatureSection',
                    value: 'RuntimeFeatureSection',
                },
                {
                    label: 'UseCaseSection',
                    value: 'UseCaseSection',
                },
            ],
        },
        {
            name: 'link_button',
            label: 'Link Button',
            type: 'group',
            fields: [
                {
                    name: 'label',
                    type: 'text',
                    required: false,
                },
                {
                    name: 'url',
                    type: 'text',
                    required: false,
                },
            ],
        },
    ],
}
