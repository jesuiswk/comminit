export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  const authConfig = to.meta.auth

  // Require auth
  if (authConfig === true && !user.value) {
    return navigateTo('/login')
  }

  // Guest only (login/register pages)
  if (authConfig?.guestOnly && user.value) {
    return navigateTo('/')
  }
})