import createMDX from '@next/mdx'
import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    experimental: {
        mdxRs: { mdxType: 'gfm' }
    }
}

const withMDX = createMDX({})

export default withPayload(withMDX(nextConfig))
