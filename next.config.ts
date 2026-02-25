import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    serverExternalPackages: ["@takumi-rs/image-response"]
}

export default withPayload(nextConfig)
