import { MDXComponents } from 'mdx/types'

const components = {
    h1: ({ children }) => (
        <h1 className={"text-4xl font-semibold mb-8"}>{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className={"text-2xl font-semibold my-4"}>{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className={"text-xl my-2"}>{children}</h3>
    ),
    p: ({ children }) => (
        <p className={"text-white/75 mb-4"}>{children}</p>
    ),
    li: ({ children }) => (
        <li className={"text-white/75 mb-2"}>{children}</li>
    ),
    a: ({ children, href }) => (
        <a className={"text-indigo-400 hover:underline"} href={href}>{children}</a>
    ),
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
    return components
}