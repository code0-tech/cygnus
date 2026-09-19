// The Crater session cookie is HttpOnly and scoped to /api/crater. This readable, token-free marker records
// that the browser explicitly completed a Sagittarius account login. If that account session expires, the
// checkout can return to the login choice instead of silently creating its shared fallback session. The
// marker is cleared wherever the Crater session cookie is cleared.
export const CRATER_USER_LOGIN_COOKIE_NAME = "crater_user_login"
export const CRATER_USER_LOGIN_COOKIE_VALUE = "1"

export function hasCraterUserLoginMarker() {
    return document.cookie.split(";").some((cookie) => cookie.trim() === `${CRATER_USER_LOGIN_COOKIE_NAME}=${CRATER_USER_LOGIN_COOKIE_VALUE}`)
}

export function clearCraterUserLoginMarker() {
    document.cookie = `${CRATER_USER_LOGIN_COOKIE_NAME}=; max-age=0; path=/; samesite=lax`
}
