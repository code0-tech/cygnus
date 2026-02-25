import { ImageResponseOptions } from "@takumi-rs/image-response"
import { ReactNode } from "react";

export interface GenerateProps {
    title: ReactNode
    backgroundSrc?: string
}

export async function getImageResponseOptions(): Promise<ImageResponseOptions> {
    return {
        width: 1200,
        height: 630,
        format: 'webp'
    }
}

export function generate({ title, backgroundSrc }: GenerateProps) {
    const siteName = "CodeZero"
    const primaryTextColor = 'rgb(240,240,240)'

    const logo = (
        <svg
            id="a"
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="white"
        >
            <path d="M11.996,10.545c.739,0,1.272-.213,1.6-.64.329-.427.493-.985.493-1.674v-3.718c0-.706.09-1.333.271-1.884.18-.549.48-1.013.898-1.391s.977-.665,1.674-.862c.697-.197,1.563-.295,2.598-.295h.492v2.93h-.615c-.739,0-1.235.164-1.49.493-.255.328-.382.837-.382,1.526v3.274c0,.854-.115,1.576-.345,2.167s-.689,1.1-1.378,1.526c.689.427,1.148.936,1.378,1.526.23.591.345,1.313.345,2.167v3.274c0,.689.127,1.198.382,1.527.254.328.751.492,1.49.492h.615v2.93h-.492c-1.034,0-1.9-.099-2.598-.296-.698-.197-1.256-.484-1.674-.861-.418-.378-.718-.842-.898-1.391-.181-.55-.271-1.178-.271-1.884v-3.718c0-.689-.164-1.247-.493-1.674-.328-.427-.861-.64-1.6-.64v-2.905Z" />
            <path d="M12.002,13.451c-.739,0-1.272.213-1.601.64-.329.427-.492.985-.492,1.674v3.718c0,.706-.091,1.333-.271,1.884-.181.549-.48,1.013-.899,1.391-.418.377-.977.665-1.674.861-.698.197-1.563.296-2.598.296h-.493v-2.93h.616c.739,0,1.235-.164,1.49-.492.254-.329.381-.837.381-1.527v-3.274c0-.854.115-1.576.345-2.167.229-.591.689-1.099,1.379-1.526-.689-.427-1.149-.936-1.379-1.526-.23-.591-.345-1.313-.345-2.167v-3.274c0-.689-.127-1.198-.381-1.526-.255-.329-.751-.493-1.49-.493h-.616V.082h.493c1.034,0,1.899.098,2.598.295.697.197,1.255.484,1.674.862.419.377.718.841.899,1.391.18.55.271,1.178.271,1.884v3.718c0,.689.164,1.248.492,1.674.328.427.862.64,1.601.64v2.905Z" />
        </svg>
    )

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                color: 'white',
                backgroundColor: 'rgb(3, 0, 20)',
            }}
        >
            {backgroundSrc ? (
                <img
                    src={backgroundSrc}
                    alt=""
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.2,
                    }}
                />
            ) : null}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    padding: '4rem',
                }}
            >
                <span
                    style={{
                        fontWeight: 600,
                        fontSize: '76px',
                        color: "rgb(114, 248, 150)"
                    }}
                >
                    {title}
                </span>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '24px',
                        marginTop: 'auto',
                        color: primaryTextColor,
                    }}
                >
                {logo}
                    <span
                        style={{
                            fontSize: '46px',
                            fontWeight: 600,
                        }}
                    >
                        {siteName}
                    </span>
                </div>
            </div>
       </div>
    )
}
