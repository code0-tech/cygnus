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
            localized: true,
        },
        {
            name: 'subheading',
            type: 'text',
            required: false,
            localized: true,
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
                {
                    label: 'DeploymentSection',
                    value: 'DeploymentSection',
                },
                {
                    label: 'CardRowSection',
                    value: 'CardRowSection',
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
                    localized: true,
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
