import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Media } from './collections/media'
import { NavbarItems } from './collections/navbarItems'
import { Users } from './collections/users'
import { Sections } from './collections/sections'
import { Footer } from './collections/footer'
import { Pages } from './collections/pages'
import { Features } from './collections/features'
import { Jobs } from './collections/jobs'
import { Blog } from './collections/blog'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    localization: {
        locales: ['en', 'de'],
        defaultLocale: 'en',
    },
    collections: [Users, Media, NavbarItems, Sections, Footer, Pages, Features, Jobs, Blog],
    editor: lexicalEditor({}),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
    }),
    sharp,
    plugins: [],
})
