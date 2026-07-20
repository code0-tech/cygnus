import type { Media } from "@/payload-types"
import { getMediaUrl } from "./media"

interface ActionTriggerTranslation {
    code: string
    content: string
}

interface ActionDefinitionDataTypeReference {
    id: string
    identifier: string
}

interface ActionDefinitionParameter {
    id: string
    identifier: string
    name: string
    description: string
}

interface ExtractedFlowTypeSetting {
    id: string
    identifier: string
    unique: boolean
    name: string
    description: string
}

export interface ExtractedFlowType {
    kind: "flowType"
    id: string
    identifier: string
    name: string
    description: string
    displayMessage: string
    signature: string
    aliases: string[]
    settings: ExtractedFlowTypeSetting[]
    displayIcon?: string
    editable?: boolean
    version?: string
    runtimeIdentifier?: string
}

export interface ExtractedFunctionDefinition {
    kind: "functionDefinition"
    id: string
    identifier: string
    name: string
    description: string
    displayMessage: string
    signature: string
    aliases: string[]
    parameters: ActionDefinitionParameter[]
    linkedDataTypes: ActionDefinitionDataTypeReference[]
    runtimeIdentifier?: string
    version?: string
    displayIcon?: string
}

export interface ExtractedDefinitionDataType {
    kind: "definitionDataType"
    id: string
    identifier: string
    name: string
    type: string
    version?: string
}

export interface ExtractedConfiguration {
    kind: "configuration"
    id: string
    identifier: string
    name: string
    type: string
    optional?: boolean
    hidden?: boolean
}

export type ExtractedActionDefinitionItem = ExtractedFlowType | ExtractedFunctionDefinition | ExtractedDefinitionDataType | ExtractedConfiguration

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value)

const getString = (value: unknown): string => (typeof value === "string" ? value : "")

const getBoolean = (value: unknown): boolean | undefined => (typeof value === "boolean" ? value : undefined)

const getArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const getNodes = (value: unknown): unknown[] => (isRecord(value) ? getArray(value.nodes) : [])

const getTranslations = (value: unknown): ActionTriggerTranslation[] => {
    const translations: ActionTriggerTranslation[] = []

    for (const translation of getArray(value)) {
        if (!isRecord(translation)) continue

        const content = getString(translation.content)
        if (!content) continue
        translations.push({ code: getString(translation.code), content })
    }

    return translations
}

const getPrimaryTranslation = (value: unknown): string => getTranslations(value)[0]?.content ?? ""

export interface ExtractedActionModuleInfo {
    identifier: string
    title: string
    description: string
    documentation: string
    author: string
    icon?: string
    version: string
}

export function extractActionModuleInfo(json: unknown): ExtractedActionModuleInfo | null {
    if (!isRecord(json)) return null

    return {
        identifier: getString(json.identifier),
        title: getPrimaryTranslation(json.name),
        description: getString(json.documentation),
        documentation: getString(json.documentation),
        author: getString(json.author),
        icon: getString(json.icon) || undefined,
        version: getString(json.version),
    }
}

const getAliases = (value: unknown): string[] => {
    const aliases: string[] = []

    for (const translation of getTranslations(value)) {
        for (const rawAlias of translation.content.split(";")) {
            const alias = rawAlias.trim()
            if (alias) aliases.push(alias)
        }
    }

    return aliases
}

const getSettings = (value: unknown): ExtractedFlowTypeSetting[] => {
    const settings: ExtractedFlowTypeSetting[] = []

    for (const setting of getArray(value)) {
        if (!isRecord(setting)) continue
        settings.push({
            id: getString(setting.id),
            identifier: getString(setting.identifier),
            unique: getBoolean(setting.unique) ?? false,
            name: getPrimaryTranslation(setting.names) || getPrimaryTranslation(setting.name),
            description: getPrimaryTranslation(setting.descriptions) || getPrimaryTranslation(setting.description),
        })
    }

    return settings
}

const getParameters = (value: unknown): ActionDefinitionParameter[] => {
    const parameters: ActionDefinitionParameter[] = []

    const parameterItems = getNodes(value).length ? getNodes(value) : getArray(value)

    for (const parameter of parameterItems) {
        if (!isRecord(parameter)) continue
        parameters.push({
            id: getString(parameter.id) || getString(parameter.runtimeName),
            identifier: getString(parameter.identifier) || getString(parameter.runtimeName) || getString(parameter.runtimeDefinitionName),
            name: getPrimaryTranslation(parameter.names) || getPrimaryTranslation(parameter.name),
            description: getPrimaryTranslation(parameter.descriptions) || getPrimaryTranslation(parameter.description),
        })
    }

    return parameters
}

const getLinkedDataTypes = (value: unknown): ActionDefinitionDataTypeReference[] => {
    const dataTypes: ActionDefinitionDataTypeReference[] = []

    for (const dataType of getNodes(value)) {
        if (!isRecord(dataType)) continue

        const id = getString(dataType.id)
        const identifier = getString(dataType.identifier)
        if (id && identifier) dataTypes.push({ id, identifier })
    }

    return dataTypes
}

export function extractFlowTypesFromJson(json: unknown): ExtractedFlowType[] {
    const flowTypes: ExtractedFlowType[] = []

    const flowTypeItems = isRecord(json) ? getArray(json.flowTypes) : getArray(json)

    for (const flowType of flowTypeItems) {
        if (!isRecord(flowType)) continue

        const id = getString(flowType.id) || getString(flowType.identifier)
        const identifier = getString(flowType.identifier) || id
        if (!id || !identifier) continue

        flowTypes.push({
            kind: "flowType" as const,
            id,
            identifier,
            name: getPrimaryTranslation(flowType.names) || getPrimaryTranslation(flowType.name),
            description: getPrimaryTranslation(flowType.descriptions) || getPrimaryTranslation(flowType.description),
            displayMessage: getPrimaryTranslation(flowType.displayMessages) || getPrimaryTranslation(flowType.displayMessage),
            signature: getString(flowType.signature),
            aliases: getAliases(flowType.aliases),
            settings: getSettings(flowType.flowTypeSettings),
            displayIcon: getString(flowType.displayIcon) || undefined,
            editable: getBoolean(flowType.editable),
            version: getString(flowType.version) || undefined,
            runtimeIdentifier: getString(flowType.runtimeIdentifier) || undefined,
        })
    }

    return flowTypes
}

export function extractFunctionDefinitionsFromJson(json: unknown): ExtractedFunctionDefinition[] {
    const functionDefinitions: ExtractedFunctionDefinition[] = []

    const functionDefinitionItems = isRecord(json) ? getArray(json.functionDefinitions) : getArray(json)

    for (const functionDefinition of functionDefinitionItems) {
        if (!isRecord(functionDefinition)) continue

        const id = getString(functionDefinition.id) || getString(functionDefinition.runtimeName) || getString(functionDefinition.runtimeDefinitionName)
        const identifier = getString(functionDefinition.identifier) || getString(functionDefinition.runtimeName) || getString(functionDefinition.runtimeDefinitionName) || id
        if (!id || !identifier) continue

        functionDefinitions.push({
            kind: "functionDefinition" as const,
            id,
            identifier,
            name: getPrimaryTranslation(functionDefinition.names) || getPrimaryTranslation(functionDefinition.name),
            description: getPrimaryTranslation(functionDefinition.descriptions) || getPrimaryTranslation(functionDefinition.description),
            displayMessage: getPrimaryTranslation(functionDefinition.displayMessages) || getPrimaryTranslation(functionDefinition.displayMessage),
            signature: getString(functionDefinition.signature),
            aliases: getAliases(functionDefinition.aliases),
            parameters: getParameters(functionDefinition.parameterDefinitions),
            linkedDataTypes: getLinkedDataTypes(functionDefinition.linkedDataTypes),
            runtimeIdentifier:
                (isRecord(functionDefinition.runtimeFunctionDefinition) ? getString(functionDefinition.runtimeFunctionDefinition.identifier) : "") ||
                getString(functionDefinition.runtimeDefinitionName) ||
                undefined,
            version: getString(functionDefinition.version) || undefined,
            displayIcon: getString(functionDefinition.displayIcon) || undefined,
        })
    }

    return functionDefinitions
}

export function extractDefinitionDataTypesFromJson(json: unknown): ExtractedDefinitionDataType[] {
    const definitionDataTypes: ExtractedDefinitionDataType[] = []
    const definitionDataTypeItems = isRecord(json) ? getArray(json.definitionDataTypes) : getArray(json)

    for (const definitionDataType of definitionDataTypeItems) {
        if (!isRecord(definitionDataType)) continue

        const id = getString(definitionDataType.id) || getString(definitionDataType.identifier)
        const identifier = getString(definitionDataType.identifier) || id
        if (!id || !identifier) continue

        definitionDataTypes.push({
            kind: "definitionDataType",
            id,
            identifier,
            name: getPrimaryTranslation(definitionDataType.names) || getPrimaryTranslation(definitionDataType.name),
            type: getString(definitionDataType.type),
            version: getString(definitionDataType.version) || undefined,
        })
    }

    return definitionDataTypes
}

export function extractConfigurationsFromJson(json: unknown): ExtractedConfiguration[] {
    const configurations: ExtractedConfiguration[] = []
    const configurationItems = isRecord(json) ? getArray(json.configurations) : getArray(json)

    for (const configuration of configurationItems) {
        if (!isRecord(configuration)) continue

        const id = getString(configuration.id) || getString(configuration.identifier)
        const identifier = getString(configuration.identifier) || id
        if (!id || !identifier) continue

        configurations.push({
            kind: "configuration",
            id,
            identifier,
            name: getPrimaryTranslation(configuration.names) || getPrimaryTranslation(configuration.name),
            type: getString(configuration.type),
            optional: getBoolean(configuration.optional),
            hidden: getBoolean(configuration.hidden),
        })
    }

    return configurations
}

export async function fetchMediaJson(media: Media | undefined): Promise<unknown> {
    const url = getMediaUrl(media?.url).trim()
    if (!url) return []

    const requestUrl =
        typeof window === "undefined" && url.startsWith("/")
            ? new URL(url, process.env.NEXT_PUBLIC_APP_URL?.trim() || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://codezero.build")).toString()
            : url
    const response = await fetch(requestUrl, { next: { revalidate: 300 } })
    if (!response.ok) throw new Error(`Could not load media JSON from ${url}`)

    return response.json()
}
