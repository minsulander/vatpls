// Plugins
import vue from "@vitejs/plugin-vue"
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify"
import ViteFonts from "unplugin-fonts/vite"
import { VitePWA } from "vite-plugin-pwa"

// Utilities
import { defineConfig } from "vite"
import { fileURLToPath, URL } from "node:url"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: { transformAssetUrls },
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
        vuetify({
            autoImport: true,
            styles: {
                configFile: "src/styles/settings.scss",
            },
        }),
        ViteFonts({
            google: {
                families: [
                    {
                        name: "Roboto",
                        styles: "wght@100;300;400;500;700;900",
                    },
                ],
            },
        }),
        VitePWA({
            registerType: "autoUpdate",
            devOptions: { enabled: true },
            manifest: {
                name: "VatPLS",
                short_name: "VatPLS",
                description: "VATSIM PositionsLedningsSystem",
                theme_color: "#1e2022",
                icons: [
                    {
                        src: "/android-chrome-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/android-chrome-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
                screenshots: [
                    {
                        src: "/screenshots/1024.png",
                        sizes: "1024x768",
                        type: "image/png",
                        form_factor: "wide",
                        label: "VatPLS",
                    },
                    {
                        src: "/screenshots/iphone_se.png",
                        sizes: "750x1334",
                        type: "image/png",
                        form_factor: "narrow",
                        label: "VatPLS",
                    },
                ],
            },
        }),
    ],
    define: { "process.env": {} },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
        extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
    },
    server: {
        port: 3000,
    },
})
