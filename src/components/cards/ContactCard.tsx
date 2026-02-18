"use client"

import { Button } from "@code0-tech/pictor"

interface ContactCardContent {
    heading: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    submitLabel: string
}

interface ContactCardProps {
    content?: Partial<ContactCardContent> | null
}

const defaultContent: ContactCardContent = {
    heading: "Contact us",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    messageLabel: "Message",
    messagePlaceholder: "How can we help you?",
    submitLabel: "Send message",
}

export function ContactCard({ content }: ContactCardProps) {
    const labels = { ...defaultContent, ...content }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-white">{labels.heading}</h3>
            <form className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="contact-name" className="text-sm text-white/80">
                        {labels.nameLabel}
                    </label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.namePlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="contact-email" className="text-sm text-white/80">
                        {labels.emailLabel}
                    </label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.emailPlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="contact-message" className="text-sm text-white/80">
                        {labels.messageLabel}
                    </label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={6}
                        className="w-full resize-y rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.messagePlaceholder}
                    />
                </div>

                <Button type="submit" variant="normal" className="mt-2 w-full! text-base!">
                    {labels.submitLabel}
                </Button>
            </form>
        </div>
    )
}
