import type { HTMLConvertersFunctionAsync } from "@payloadcms/richtext-lexical/html-async"

const encodeAttribute = (value: string) => encodeURIComponent(value)

export const customLexicalHTMLConverters: HTMLConvertersFunctionAsync = ({ defaultConverters }) => ({
    ...defaultConverters,
    blocks: {
        ...defaultConverters.blocks,
        graph: ({ node }: { node: { fields: { blockName?: unknown; source?: unknown } } }) => {
            const source = typeof node.fields.source === "string" ? node.fields.source : ""
            const title = typeof node.fields.blockName === "string" ? node.fields.blockName : ""
            return `<div data-lexical-custom-block="graph" data-source="${encodeAttribute(source)}" data-title="${encodeAttribute(title)}"></div>`
        },
        trigger: ({ node }: { node: { fields: { blockName?: unknown; source?: unknown } } }) => {
            const source = typeof node.fields.source === "string" ? node.fields.source : ""
            const title = typeof node.fields.blockName === "string" ? node.fields.blockName : ""
            return `<div data-lexical-custom-block="trigger" data-source="${encodeAttribute(source)}" data-title="${encodeAttribute(title)}"></div>`
        },
    },
})
