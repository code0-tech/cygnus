// The Crater session cookie is HttpOnly and scoped to /api/crater, and every Crater session -- the shared
// guest session the checkout creates from CRATER_SAGITTARIUS_TOKEN included -- is a user session. Neither a
// page nor the browser can therefore tell a completed Sagittarius login apart from a guest checkout, and
// /api/crater/auth/session answers 200 for both. This marker is what records the difference: it is set next
// to the session cookie when the login callback succeeds, carries no token, and is cleared wherever the
// session cookie is cleared.
export const CRATER_USER_LOGIN_COOKIE_NAME = "crater_user_login"
export const CRATER_USER_LOGIN_COOKIE_VALUE = "1"

export function hasCraterUserLoginMarker() {
    return document.cookie.split(";").some((cookie) => cookie.trim() === `${CRATER_USER_LOGIN_COOKIE_NAME}=${CRATER_USER_LOGIN_COOKIE_VALUE}`)
}

export function clearCraterUserLoginMarker() {
    document.cookie = `${CRATER_USER_LOGIN_COOKIE_NAME}=; max-age=0; path=/; samesite=lax`
}
