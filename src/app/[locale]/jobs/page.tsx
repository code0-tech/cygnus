import { Aurora } from "@/components/Aurora"
import { LandingContainer } from "@/components/LandingContainer"

const jobs = [
    {
        title: "Senior Software Engineer",
        company: "Tech Innovators Inc.",
        location: "Remote",
        description: "Join our dynamic team to build cutting-edge software solutions that revolutionize the industry. We are looking for a passionate Senior Software Engineer with expertise in full-stack development, cloud technologies, and a strong background in scalable applications. If you thrive in a fast-paced environment and are eager to make an impact, we want to hear from you!"
    },
    {
        title: "Product Manager",
        company: "Creative Solutions Ltd.",
        location: "New York, NY",
        description: "We are seeking a visionary Product Manager to lead the development of innovative products that meet customer needs. The ideal candidate will have experience in product lifecycle management, strong communication skills, and a proven track record of delivering successful products. If you are passionate about creating impactful solutions and driving product strategy, apply now!"
    },
    {
        title: "UX/UI Designer",
        company: "Design Studio Co.",
        location: "San Francisco, CA",
        description: "Join our creative team as a UX/UI Designer and help us craft intuitive and visually stunning user experiences. We are looking for a designer with a strong portfolio, proficiency in design tools, and a deep understanding of user-centered design principles. If you are passionate about creating engaging digital experiences, we would love to see your work!"
    }
]

export default function JobPage() {
    return (
        <>
            <Aurora/>
            <LandingContainer className="py-[20vh]">
                <div className={"md:w-[50vw] mx-auto flex flex-col gap-8"}>
                    <h1 className={"text-4xl font-semibold mb-8 text-center"}>Join Our Team</h1>
                    {jobs.map((job, index) => (
                        <div key={index} className={"bg-white/10 p-6 rounded-lg shadow-md"}>
                            <h2 className={"text-2xl font-semibold mb-2"}>{job.title}</h2>
                            <p className={"text-sm text-gray-400 mb-4"}>{job.company} - {job.location}</p>
                            <p className={"text-white/75"}>{job.description}</p>
                        </div>
                    ))}
                </div>
            </LandingContainer>
        </>
    )
}
