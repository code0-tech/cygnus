import {NextConfig} from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    images: {
        loader: 'custom',
        loaderFile: './src/utils/image-loader.js'
    }
}

const withMDX = createMDX({})
const withNextIntl = createNextIntlPlugin()

export default withMDX(withNextIntl(nextConfig))
