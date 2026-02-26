import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    serverExternalPackages: ["@takumi-rs/image-response"],
    images: {
        unoptimized: true,
    },
}

export default withPayload(nextConfig)
