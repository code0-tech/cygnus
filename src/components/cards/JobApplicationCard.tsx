import { Button } from "@/components/ui/Button"

interface JobApplicationCardContent {
    applicationHeading: string
    applicationNameLabel: string
    applicationNamePlaceholder: string
    applicationEmailLabel: string
    applicationEmailPlaceholder: string
    applicationMessageLabel: string
    applicationMessagePlaceholder: string
    applicationSubmitLabel: string
}

interface JobApplicationCardProps {
    content?: Partial<JobApplicationCardContent> | null
}

const defaultContent: JobApplicationCardContent = {
    applicationHeading: "Apply now",
    applicationNameLabel: "Name",
    applicationNamePlaceholder: "Your name",
    applicationEmailLabel: "Email",
    applicationEmailPlaceholder: "you@example.com",
    applicationMessageLabel: "Message",
    applicationMessagePlaceholder: "Tell us a bit about yourself...",
    applicationSubmitLabel: "Send application",
}

export function JobApplicationCard({ content }: JobApplicationCardProps) {
    const labels = { ...defaultContent, ...content }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-white">{labels.applicationHeading}</h3>
            <form className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="job-application-name" className="text-sm text-white/80">
                        {labels.applicationNameLabel}
                    </label>
                    <input
                        id="job-application-name"
                        name="name"
                        type="text"
                        required
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.applicationNamePlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="job-application-email" className="text-sm text-white/80">
                        {labels.applicationEmailLabel}
                    </label>
                    <input
                        id="job-application-email"
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.applicationEmailPlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="job-application-message" className="text-sm text-white/80">
                        {labels.applicationMessageLabel}
                    </label>
                    <textarea
                        id="job-application-message"
                        name="message"
                        required
                        rows={6}
                        className="w-full resize-y rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/35"
                        placeholder={labels.applicationMessagePlaceholder}
                    />
                </div>

                <Button type="submit" variant="default" className="mt-2 w-full">
                    {labels.applicationSubmitLabel}
                </Button>
            </form>
        </div>
    )
}
