import pinia from "./store"
import router from "./router"
import moment from "moment"
import { createVuetify } from "vuetify"
import "@mdi/font/css/materialdesignicons.css"
import "vuetify/styles"
import "./styles/settings.scss"

const vuetify = createVuetify({
    theme: {
        defaultTheme: "dark",
        themes: {
            light: {
                colors: {
                    primary: "#1867C0",
                    secondary: "#5CBBF6",
                },
            },
            dark: {
                colors: {
                    background: "#1e1f22",
                    surface: "#2b2d31",
                    // #1e1f22
                    // #2b2d31
                    // #313338
                },
            },
        },
    },
})

import App from "./App.vue"
import { createApp } from "vue"
import VueApexCharts from "vue3-apexcharts"

const app = createApp(App)

app.provide("moment", moment)
app.use(vuetify).use(router).use(pinia).use(VueApexCharts)

app.mount("#app")
