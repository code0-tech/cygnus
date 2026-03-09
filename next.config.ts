import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: "standalone",
}

export default withPayload(nextConfig)
