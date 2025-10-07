<template>
    <div class="ws-panel">
        <h1>WS Panel</h1>

        <v-tabs v-model="tab">
            <v-tab v-for="tabPages in tabs"> {{ tabPages }} </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
            <v-tabs-window-item v-for="tabPages in tabs" :key="tabPages">
                <div class="chart-section">
                    <div class="d-flex justify-space-between align-center mb-4">
                        <h2>{{ tabPages }} tab</h2>
                        <v-btn @click="fetchControllerHistory" color="primary">refresh</v-btn>
                    </div>
                    <Timeline :chartData="chartData2" :chartOptions="chartOptions2" />
                </div>
                {{ pos }}
                {{ positions }}
                {{ chartData2 }}
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import Timeline from "@/components/Timeline.vue"
import dayjs from "dayjs"

interface historyController {
    session_id: number
    cid: string
    callsign: string
    position: string
    session_end: Date
    session_start: Date
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
const router = useRouter()
const tab = ref("Positions")
const tabs = ["Positions", "Controllers"]
const controllerEntries = ref<historyController[]>([])

// get all available positions.
// generate dataset
// generate options..
// min, max date
// time unit
//

const pos = computed(() => {
    const positionsSet = new Set<string>()
    controllerEntries.value.forEach((entry) => {
        positionsSet.add(entry.callsign)
    })
    return Array.from(positionsSet)
})

function generateDatasetsFromSessions(sessions: historyController[]) {
    const sessionsByUser = new Map<string, historyController[]>()

    sessions.forEach((session) => {
        const key = session.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        sessionsByUser.get(key)!.push(session)
        console.log("Processing session:", session)
    })

    const datasets: any[] = []

    sessionsByUser.forEach((userSessions, userKey) => {
        const sessionsByCallsign = new Map<string, historyController[]>()

        userSessions.forEach((session) => {
            if (!sessionsByCallsign.has(session.callsign)) {
                sessionsByCallsign.set(session.callsign, [])
            }
            sessionsByCallsign.get(session.callsign)!.push(session)
        })

        // rando colors
        const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#98d8c8"]
        const userIndex = Array.from(sessionsByUser.keys()).indexOf(userKey)
        const userColor = colors[userIndex % colors.length]

        // Create one dataset per session
        userSessions.forEach((session) => {
            const data = pos.value.map((callsign) => {
                if (callsign === session.callsign) {
                    return [new Date(session.session_start), new Date(session.session_end)]
                }
                return null
            })

            datasets.push({
                label: `${userKey}`,
                data: data,
                backgroundColor: userColor,
            })
        })
    })

    return datasets
}

const positions = ["SA-TWR", "GG-TWR", "OS-1", "MM-2", "SA-GND", "APP-E", "APP-W", "DEP-E", "DEP-W"]

// Make chartData2 reactive based on controllerEntries
const chartData2 = computed(() => {
    const datasets = generateDatasetsFromSessions(controllerEntries.value)
    console.log("Generated datasets:", datasets)

    return {
        labels: pos.value,
        datasets: datasets,
    }
})

// Make chartOptions2 computed to be reactive to date changes
const chartOptions2 = computed(() => {
    const today = dayjs()
    const tomorrow = dayjs().add(1, "day")

    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y" as const,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
                text: "Positions Timeline",
            },
            tooltip: {
                callbacks: {
                    title: function (context: any) {
                        // Show the position name (y-axis label)
                        return context[0].label
                    },
                    label: function (context: any) {
                        const datasetLabel = context.dataset.label
                        const data = context.raw

                        if (Array.isArray(data) && data.length === 2) {
                            const startTime = dayjs(data[0]).format("HH:mm")
                            const endTime = dayjs(data[1]).format("HH:mm")
                            return `${datasetLabel}: ${startTime} - ${endTime}`
                        }

                        return `${datasetLabel}: No data`
                    },
                },
            },
        },
        scales: {
            y: {
                stacked: true,
            },
            x: {
                type: "time" as const,
                time: {
                    unit: "hour" as const,
                    stepSize: 1,
                    displayFormats: {
                        hour: "HH:mm",
                    },
                    tooltipFormat: "YYYY-MM-DD HH:mm",
                },
                ticks: {
                    maxTicksLimit: 24,
                },
                min: today.startOf("day").toDate(),
                max: tomorrow.startOf("day").toDate(),
            },
        },
    } as any
})

function fetchControllerHistory() {
    // fetch data from api

    fetch(`${apiBaseUrl}/api/history?day=${dayjs(Date.now()).format("YYYY-MM-DD")}`)
        .then((resp) => resp.json())
        .then((data) => {
            // This will trigger reactivity and re-render the chart
            controllerEntries.value = data.sessions.filter((e: any) => {
                if (e.position && e.position != "pause" && e.position != " " && e.position != "other") return e
            })

            console.log("Updated controller entries:", controllerEntries.value)
            console.log("Available positions:", pos.value)
        })
        .catch((err) => {
            console.error("Error fetching controller history:", err)
        })
}

onMounted(() => {
    fetchControllerHistory()
    console.log("today: ", dayjs().format("YYYY-MM-DD"))
})
</script>

<style scoped>
.ws-panel {
    padding: 20px;
}

.chart-section {
    margin-bottom: 40px;
}

.chart-container {
    height: 400px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-sections {
    display: flex;
    gap: 20px;
}

.info-sections > div {
    flex: 1;
}
</style>
