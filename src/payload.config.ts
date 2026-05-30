import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { BlocksFeature, CodeBlock, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Actions } from './collections/actions'
import { Blog } from './collections/blog'
import { CookieBanner } from './collections/cookieBanner'
import { Features } from './collections/features'
import { Footer } from './collections/footer'
import { Jobs } from './collections/jobs'
import { Media } from './collections/media'
import { NavbarButtons } from './collections/navbarButtons'
import { NavbarItems } from './collections/navbarItems'
import { Pages } from './collections/pages'
import { SubscriptionCollection } from './collections/subscriptionConfig'
import { TeamMembers } from './collections/teamMembers'
import { Users } from './collections/users'
import { GraphLexicalBlock, TriggerLexicalBlock } from './lib/richText/customLexicalBlocks'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const smtpHost = process.env.SMTP_HOST
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build"
const isDevelopment = process.env.NODE_ENV === "development"
const appURL = (process.env.NEXT_PUBLIC_APP_URL?.trim() || (isDevelopment ? 'http://localhost:3000' : 'https://codezero.build')).replace(/\/$/, '')
const allowedOrigins = Array.from(
    new Set([
        appURL,
        'http://localhost:3000',
        'https://localhost:3000',
        'https://codezero.build',
    ]),
)
const shouldSkipEmailVerify =
    isDevelopment ||
    isBuildPhase ||
    process.env.PAYLOAD_SKIP_EMAIL_VERIFY === "true" ||
    !smtpHost

export default buildConfig({
    serverURL: appURL,
    cors: allowedOrigins,
    csrf: allowedOrigins,
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        livePreview: {
            url: 'http://localhost:3000',
            collections: ['pages', 'jobs', 'actions', 'teamMembers', 'features', 'blog'],
        },
    },
    localization: {
        locales: ['en', 'de'],
        defaultLocale: 'en',
    },
    collections: [Users, Media, NavbarItems, NavbarButtons, Footer, CookieBanner, Pages, Features, Actions, Jobs, Blog, TeamMembers, SubscriptionCollection],
    jobs: {
        autoRun: [{
            cron: '*/5 * * * *', // Check every 5 minutes
            queue: 'default',
        }]
    },
    editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures,
            FixedToolbarFeature(),
            BlocksFeature({
                blocks: [CodeBlock(), TriggerLexicalBlock, GraphLexicalBlock],
            }),
        ],
    }),
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
                { slug: 'navbarButtons' },
                { slug: 'footer' },
                { slug: 'cookie-banner' },
                { slug: 'pages' },
                { slug: 'features' },
                { slug: 'actions' },
                { slug: 'jobs' },
                { slug: 'blog' },
                { slug: 'team-members' },
                { slug: 'subscriptionConfig' }
            ]
        }),
        seoPlugin({
            collections: [
                'pages',
                'blog'
            ],
            uploadsCollection: 'media',
            generateTitle: ({ doc }) => doc?.title,
            generateDescription: ({ doc }) => doc?.shortDescription,
            generateImage: ({ doc }) => doc?.heroImage,
            generateURL: ({ collectionConfig, doc, locale }) => {
                if (!doc?.slug || !locale) return ''

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://code0.tech'
                const normalizedBaseUrl = baseUrl.replace(/\/$/, '')

                if (collectionConfig?.slug === 'blog') {
                    return `${normalizedBaseUrl}/${locale}/blog/${doc.slug}`
                }

                if (collectionConfig?.slug === 'pages') {
                    const pagePath = doc.slug === 'main' ? `/${locale}` : `/${locale}/${doc.slug}`
                    return `${normalizedBaseUrl}${pagePath}`
                }

                return ''
            },
        })
    ],
})
