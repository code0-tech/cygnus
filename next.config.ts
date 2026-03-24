import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: "standalone",
    productionBrowserSourceMaps: true,
}

export default withPayload(nextConfig)
