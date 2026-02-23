import nodemailer from "nodemailer"
import { getRequiredEnv } from "@/utils/apiRouteUtils"

export const createSmtpTransporter = () => {
    const smtpHost = getRequiredEnv("SMTP_HOST")
    const smtpPort = Number.parseInt(getRequiredEnv("SMTP_PORT"), 10)
    const smtpUser = getRequiredEnv("SMTP_USER")
    const smtpPass = getRequiredEnv("SMTP_PASS")

    if (!Number.isFinite(smtpPort)) {
        throw new Error("SMTP_PORT ist keine gueltige Zahl.")
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    })
}
