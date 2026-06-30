import type { Media } from "@/payload-types"
import { getMediaUrl } from "./media"

interface ActionTriggerTranslation {
    code: string
    content: string
}

interface ActionTriggerDataType {
    id: string
    identifier: string
}

interface ActionTriggerParameter {
    id: string
    identifier: string
    name: string
    description: string
}

interface ExtractedTriggerSetting {
    id: string
    identifier: string
    unique: boolean
    name: string
    description: string
}

export interface ExtractedTrigger {
    kind: "trigger"
    id: string
    identifier: string
    name: string
    description: string
    displayMessage: string
    signature: string
    aliases: string[]
    settings: ExtractedTriggerSetting[]
    displayIcon?: string
    editable?: boolean
    version?: string
}

export interface ExtractedFunctionDef {
    kind: "functionDef"
    id: string
    identifier: string
    name: string
    description: string
    displayMessage: string
    signature: string
    aliases: string[]
    parameters: ActionTriggerParameter[]
    linkedDataTypes: ActionTriggerDataType[]
    runtimeIdentifier?: string
}

export type ExtractedActionTriggerItem = ExtractedTrigger | ExtractedFunctionDef

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

const getSettings = (value: unknown): ExtractedTriggerSetting[] => {
    const settings: ExtractedTriggerSetting[] = []

    for (const setting of getArray(value)) {
        if (!isRecord(setting)) continue
        settings.push({
            id: getString(setting.id),
            identifier: getString(setting.identifier),
            unique: getBoolean(setting.unique) ?? false,
            name: getPrimaryTranslation(setting.names),
            description: getPrimaryTranslation(setting.descriptions),
        })
    }

    return settings
}

const getParameters = (value: unknown): ActionTriggerParameter[] => {
    const parameters: ActionTriggerParameter[] = []

    for (const parameter of getNodes(value)) {
        if (!isRecord(parameter)) continue
        parameters.push({
            id: getString(parameter.id),
            identifier: getString(parameter.identifier),
            name: getPrimaryTranslation(parameter.names),
            description: getPrimaryTranslation(parameter.descriptions),
        })
    }

    return parameters
}

const getLinkedDataTypes = (value: unknown): ActionTriggerDataType[] => {
    const dataTypes: ActionTriggerDataType[] = []

    for (const dataType of getNodes(value)) {
        if (!isRecord(dataType)) continue

        const id = getString(dataType.id)
        const identifier = getString(dataType.identifier)
        if (id && identifier) dataTypes.push({ id, identifier })
    }

    return dataTypes
}

export function extractTriggersFromJson(json: unknown): ExtractedTrigger[] {
    const triggers: ExtractedTrigger[] = []

    for (const trigger of getArray(json)) {
        if (!isRecord(trigger)) continue

        const id = getString(trigger.id)
        const identifier = getString(trigger.identifier)
        if (!id || !identifier) continue

        triggers.push({
            kind: "trigger" as const,
            id,
            identifier,
            name: getPrimaryTranslation(trigger.names),
            description: getPrimaryTranslation(trigger.descriptions),
            displayMessage: getPrimaryTranslation(trigger.displayMessages),
            signature: getString(trigger.signature),
            aliases: getAliases(trigger.aliases),
            settings: getSettings(trigger.flowTypeSettings),
            displayIcon: getString(trigger.displayIcon) || undefined,
            editable: getBoolean(trigger.editable),
            version: getString(trigger.version) || undefined,
        })
    }

    return triggers
}

export function extractFunctionDefsFromJson(json: unknown): ExtractedFunctionDef[] {
    const functionDefs: ExtractedFunctionDef[] = []

    for (const functionDef of getArray(json)) {
        if (!isRecord(functionDef)) continue

        const id = getString(functionDef.id)
        const identifier = getString(functionDef.identifier)
        if (!id || !identifier) continue

        functionDefs.push({
            kind: "functionDef" as const,
            id,
            identifier,
            name: getPrimaryTranslation(functionDef.names),
            description: getPrimaryTranslation(functionDef.descriptions),
            displayMessage: getPrimaryTranslation(functionDef.displayMessages),
            signature: getString(functionDef.signature),
            aliases: getAliases(functionDef.aliases),
            parameters: getParameters(functionDef.parameterDefinitions),
            linkedDataTypes: getLinkedDataTypes(functionDef.linkedDataTypes),
            runtimeIdentifier: isRecord(functionDef.runtimeFunctionDefinition) ? getString(functionDef.runtimeFunctionDefinition.identifier) || undefined : undefined,
        })
    }

    return functionDefs
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
