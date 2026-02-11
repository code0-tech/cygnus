import {NextConfig} from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    experimental: {
        mdxRs: { mdxType: 'gfm' }
    }
}

const withMDX = createMDX({})
const withNextIntl = createNextIntlPlugin()

export default withNextIntl(withMDX(nextConfig))
