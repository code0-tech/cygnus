export function hasHighlightedText(text?: string | null) {
    return Boolean(text && /\*\*.*?\*\*/.test(text))
}

export function FormattedText({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\*\*.*?\*\*)/g).flatMap((part, partIndex) => {
                const highlighted = part.startsWith("**") && part.endsWith("**") && part.length > 4
                const value = highlighted ? part.slice(2, -2) : part

                return value.split(/(\\n|\r\n|\n|\r)/g).map((linePart, lineIndex) => {
                    const key = `${partIndex}-${lineIndex}`

                    if (/^(\\n|\r\n|\n|\r)$/.test(linePart)) {
                        return <br key={key} />
                    }

                    if (!highlighted) return linePart

                    return (
                        <span className="text-white" key={key}>
                            {linePart}
                        </span>
                    )
                })
            })}
        </>
    )
}
