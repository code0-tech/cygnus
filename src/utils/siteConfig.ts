import { Metadata } from "next"

const TITLE = "Code0 - Revolutionize the backend development"
const DESCRIPTION = "Revolutionize the backend development"

export const siteConfig: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    icons: { icon: "/icon.png" },
    applicationName: "Code0",
    creator: "",
    /*openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/code0_software.png`,
                width: 1904,
                height: 925,
                alt: TITLE,
            }
        ]
    },
    twitter: {
        site: "@",
        creator: "@",
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: [`${process.env.NEXT_PUBLIC_APP_URL}/code0_software.png`]
    },*/
    category: "",
    alternates: { canonical: "./" },
    keywords: ["Code0", "NoCode", "Backend", "CodeZero", "SEO"],
    //metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
}