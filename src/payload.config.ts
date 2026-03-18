import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Blog } from './collections/blog'
import { Features } from './collections/features'
import { Footer } from './collections/footer'
import { Jobs } from './collections/jobs'
import { Media } from './collections/media'
import { NavbarItems } from './collections/navbarItems'
import { Pages } from './collections/pages'
import { RoadmapItems } from './collections/roadmapItems'
import { Sections } from './collections/sections'
import { Users } from './collections/users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const smtpHost = process.env.SMTP_HOST
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build"
const shouldSkipEmailVerify =
    isBuildPhase ||
    process.env.PAYLOAD_SKIP_EMAIL_VERIFY === "true" ||
    !smtpHost

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
    collections: [Users, Media, NavbarItems, Sections, Footer, Pages, Features, Jobs, Blog, RoadmapItems],
    jobs: {
        autoRun: [{
            cron: '*/5 * * * *', // Check every 5 minutes
            queue: 'default',
        }]
    },
    editor: lexicalEditor({}),
    email: nodemailerAdapter({
        defaultFromAddress: process.env.CONTACT_FROM_EMAIL!,
        defaultFromName: 'Payload Mail',
        skipVerify: shouldSkipEmailVerify,
        transportOptions: {
            host: smtpHost,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
        }
    }),
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
    plugins: [
        importExportPlugin({
            collections: [
                { slug: 'users', },
                { slug: 'media', },
                { slug: 'navbarItems' },
                { slug: 'sections' },
                { slug: 'footer' },
                { slug: 'pages' },
                { slug: 'features' },
                { slug: 'jobs' },
                { slug: 'blog' },
                { slug: 'roadmapItems' }
            ]
        })
    ],
})
