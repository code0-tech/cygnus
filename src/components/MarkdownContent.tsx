export function MarkdownContent({ content }: { content: string }) {
    return (
        <div
            className={[
                "[&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:mb-8",
                "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-4",
                "[&_h3]:text-xl [&_h3]:my-2",
                "[&_p]:text-white/75 [&_p]:mb-4",
                "[&_li]:text-white/75 [&_li]:mb-2",
                "[&_a]:text-indigo-400 [&_a]:hover:underline",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    )
}
