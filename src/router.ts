// Composables
import { createRouter, createWebHistory, isNavigationFailure } from "vue-router"

const routes = [
    {
        path: '/',
        name: 'ControllerList',
        component: () => import('@/pls.vue'),
    },
    {
        path: '/ws',
        name: 'AdminPanel',
        component: () => import('@/ws.vue'),
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
})

if (isStandaloneApp()) {
    // Remember last visited path and start there on next app launch
    let firstNavigation = true
    router.beforeEach((to, from, next) => {
        if (firstNavigation && to.path == "/" && "lastVisitedPath" in localStorage) {
            console.log("Navigating to last visited path", localStorage.lastVisitedPath)
            next(localStorage.lastVisitedPath)
        }
        firstNavigation = false
        next()
    })
    router.afterEach((to, from, failure) => {
        if (isNavigationFailure(failure)) {
            console.warn("Navigation failure", failure)
        } else {
            localStorage.lastVisitedPath = to.path
        }
    })
}

function isStandaloneApp() {
    return (navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches
}

export default router
