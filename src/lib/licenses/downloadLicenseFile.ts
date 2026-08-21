export async function downloadLicenseFile(licenseId: string) {
    const response = await fetch("/api/crater/licenses/export", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: licenseId }),
    })
    if (!response.ok) throw new Error("License export failed.")

    const file = await response.blob()
    const fileName = response.headers.get("x-license-filename")?.trim() || "code0-license.lic"
    const fileUrl = URL.createObjectURL(file)
    const download = document.createElement("a")
    download.href = fileUrl
    download.download = fileName
    document.body.append(download)
    download.click()
    download.remove()
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1_000)
}
