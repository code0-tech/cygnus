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

interface TranslationLike {
    code?: unknown
    content?: unknown
}

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value)

const getString = (value: unknown): string => (typeof value === "string" ? value : "")

const getBoolean = (value: unknown): boolean | undefined => (typeof value === "boolean" ? value : undefined)

const getArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const getNodes = (value: unknown): unknown[] => (isRecord(value) ? getArray(value.nodes) : [])

const getTranslations = (value: unknown): ActionTriggerTranslation[] =>
    getArray(value)
        .filter(isRecord)
        .map((translation: TranslationLike) => ({
            code: getString(translation.code),
            content: getString(translation.content),
        }))
        .filter((translation) => translation.content.length > 0)

const getPrimaryTranslation = (value: unknown): string => getTranslations(value)[0]?.content ?? ""

const getAliases = (value: unknown): string[] =>
    getTranslations(value)
        .reduce<string[]>((aliases, translation) => aliases.concat(translation.content.split(";")), [])
        .map((alias) => alias.trim())
        .filter(Boolean)

export function extractTriggersFromJson(json: unknown): ExtractedTrigger[] {
    return getArray(json)
        .filter(isRecord)
        .map((trigger) => ({
            kind: "trigger" as const,
            id: getString(trigger.id),
            identifier: getString(trigger.identifier),
            name: getPrimaryTranslation(trigger.names),
            description: getPrimaryTranslation(trigger.descriptions),
            displayMessage: getPrimaryTranslation(trigger.displayMessages),
            signature: getString(trigger.signature),
            aliases: getAliases(trigger.aliases),
            settings: getArray(trigger.flowTypeSettings)
                .filter(isRecord)
                .map((setting) => ({
                    id: getString(setting.id),
                    identifier: getString(setting.identifier),
                    unique: getBoolean(setting.unique) ?? false,
                    name: getPrimaryTranslation(setting.names),
                    description: getPrimaryTranslation(setting.descriptions),
                })),
            displayIcon: getString(trigger.displayIcon) || undefined,
            editable: getBoolean(trigger.editable),
            version: getString(trigger.version) || undefined,
        }))
        .filter((trigger) => trigger.id && trigger.identifier)
}

export function extractFunctionDefsFromJson(json: unknown): ExtractedFunctionDef[] {
    return getArray(json)
        .filter(isRecord)
        .map((functionDef) => ({
            kind: "functionDef" as const,
            id: getString(functionDef.id),
            identifier: getString(functionDef.identifier),
            name: getPrimaryTranslation(functionDef.names),
            description: getPrimaryTranslation(functionDef.descriptions),
            displayMessage: getPrimaryTranslation(functionDef.displayMessages),
            signature: getString(functionDef.signature),
            aliases: getAliases(functionDef.aliases),
            parameters: getNodes(functionDef.parameterDefinitions)
                .filter(isRecord)
                .map((parameter) => ({
                    id: getString(parameter.id),
                    identifier: getString(parameter.identifier),
                    name: getPrimaryTranslation(parameter.names),
                    description: getPrimaryTranslation(parameter.descriptions),
                })),
            linkedDataTypes: getNodes(functionDef.linkedDataTypes)
                .filter(isRecord)
                .map((dataType) => ({
                    id: getString(dataType.id),
                    identifier: getString(dataType.identifier),
                }))
                .filter((dataType) => dataType.id && dataType.identifier),
            runtimeIdentifier: isRecord(functionDef.runtimeFunctionDefinition) ? getString(functionDef.runtimeFunctionDefinition.identifier) || undefined : undefined,
        }))
        .filter((functionDef) => functionDef.id && functionDef.identifier)
}

export async function fetchMediaJson(media: Media | undefined): Promise<unknown> {
    const url = getMediaUrl(media?.url).trim()
    if (!url) return []

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not load media JSON from ${url}`)

    return response.json()
}
