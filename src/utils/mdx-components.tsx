import { MDXComponents } from 'mdx/types'

export function useMdxComponents(components: MDXComponents): MDXComponents {
    return {
        h1: (props) => <h1 style={{ color: 'red' }} {...props} />,
        ...components,
    }

}