// Composables
import { createRouter, createWebHistory, isNavigationFailure } from "vue-router"

const routes = [
    {
        path: "/",
        name: "Home",
        component: () => import("@/views/Home.vue"),
    },
    {
        path: "/settings",
        component: () => import("@/views/Settings.vue"),
    },
    {
        path: "/flight/:id",
        component: () => import("@/views/Flight.vue"),
    },
    {
        path: "/airport/:id",
        component: () => import("@/views/Airport.vue"),
    },
    {
        path: "/tracon/:id",
        component: () => import("@/views/Tracon.vue"),
    },
    {
        path: "/fir/:id",
        component: () => import("@/views/FIR.vue"),
    },
    {
        path: "/uir/:id",
        component: () => import("@/views/UIR.vue"),
    },
    {
        path: "/country/:id",
        component: () => import("@/views/Country.vue"),
    },
    {
        path: "/member/:id",
        component: () => import("@/views/Member.vue"),
    },
    {
        path: "/:pathMatch(.*)*",
        name: "404",
        component: () => import("@/views/Home.vue"),
    },
    {
        path: '/controllers',
        name: 'ControllerList',
        component: () => import('@/views/ControllerList.vue'),
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
})

import { isStandaloneApp } from "@/common"
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

export default router
