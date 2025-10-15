<template>
    <div class="ws-panel">
        <h1>WS Panel</h1>
        <v-tabs v-model="tab">
            <v-tab v-for="tabPages in tabs"> {{ tabPages }} </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
            <v-tabs-window-item v-for="tabPages in tabs" :key="tabPages">
                <div class="chart-section border-radius mt-2">
                    <div class="d-flex justify-space-between align-center mb-4 mt-2">
                        <h2>{{ tabPages }} tab</h2>
                        <div class="d-flex">
                            <p class="mr-3 mt-2">Last updated: {{ LatestUpdatedUTC.format("HH:mm:ss") }}z</p>
                            <v-btn @click="refresh" color="primary">refresh</v-btn>
                        </div>
                    </div>
                    <Timeline :chartData="chartData2" :chartOptions="chartOptions2" />
                </div>
                <div class="mx-4">
                    <v-range-slider :min="0" :max="24" :step="1" strict v-model="range"></v-range-slider>
                </div>
                <div class="ml-2" v-if="tab === 2">
                    <h2>Filter</h2>
                    <v-checkbox-btn
                        density="compact"
                        v-model="selectedCallsigns"
                        v-for="position in callsigns"
                        :value="position"
                        :label="position"
                    ></v-checkbox-btn>
                </div>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import Timeline from "@/components/Timeline.vue"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import type { Controller } from "@/views/pls.vue"
dayjs.extend(utc)

interface historyController {
    session_id: number
    cid: string
    callsign: string
    position: string
    session_end: number //ms
    session_start: number //ms
}

interface smallController {
    cid: string
    name: string
    sign: string
    rating: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
const router = useRouter()
document.title = "WS PANEL"

const tab = ref(0)
const tabs = ["Positions", "Controllers", "Callsign"]
const controllerEntries = ref<historyController[]>([])
const activeSessions = ref<Controller[]>()
const LatestUpdatedUTC = ref(dayjs.utc())
const selectedCallsigns = ref<string[]>([])
const savedControllers = ref<smallController[]>([])
const range = ref([0, 24])

const callsigns = computed(() => {
    const positionsSet = new Set<string>()
    controllerEntries.value.forEach((entry) => {
        positionsSet.add(entry.callsign)
    })
    activeSessions.value?.forEach((entry) => {
        if (entry.callsign == undefined || entry.position == undefined) return
        positionsSet.add(entry.callsign)
    })
    // selectedPositions.value = Array.from(positionsSet)
    console.log(positionsSet)
    return Array.from(positionsSet).sort()
})

const positions = computed(() => {
    const callsignSet = new Set<string>()
    controllerEntries.value.forEach((entry) => {
        callsignSet.add(entry.position)
    })
    activeSessions.value?.forEach((entry) => {
        if (entry.callsign == undefined || entry.position == undefined) return
        callsignSet.add(entry.position)
    })
    return Array.from(callsignSet).sort()
})

const controllers = computed(() => {
    const controllersSet = new Set<string>()
    controllerEntries.value.forEach((entry) => {
        controllersSet.add(entry.cid)
    })
    activeSessions.value?.forEach((entry) => {
        if (entry.cid) {
            controllersSet.add(entry.cid)
        }
    })
    return Array.from(controllersSet)
})

// Use consistent colors for each controller (CID) across all tabs
const controllerColors: { [key: string]: string } = {}
const availableColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#98d8c8", "#f39c12", "#e74c3c", "#9b59b6"]

function getControllerColor(cid: string): string {
    if (!controllerColors[cid]) {
        const colorIndex = Object.keys(controllerColors).length % availableColors.length
        controllerColors[cid] = availableColors[colorIndex]
    }
    return controllerColors[cid]
}

// datasets from sessions - POSITIONS VIEW
function generatePositionsDatasets(sessions: historyController[], usePositions: boolean) {
    const sessionsByUser = new Map<string, historyController[]>()

    sessions.forEach((session) => {
        const key = session.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        sessionsByUser.get(key)!.push(session)
    })

    activeSessions.value?.forEach((Activesession) => {
        const key = Activesession.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        if (Activesession.callsign == undefined || Activesession.position == undefined) return
        const session: historyController = {
            session_id: 0,
            cid: Activesession.cid,
            callsign: Activesession.callsign,
            position: Activesession.position,
            session_start: dayjs.utc(Activesession.timestamp).valueOf(),
            session_end: dayjs.utc().valueOf(),
        }
        sessionsByUser.get(key)!.push(session)
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

        // Create one dataset per session
        userSessions.forEach((session) => {
            let data: any[]

            if (usePositions) {
                // Positions view - map against positions
                data = positions.value.map((position) => {
                    if (position === session.position) {
                        const startTime =
                            typeof session.session_start === "number" ? session.session_start : dayjs.utc(session.session_start).valueOf()
                        const endTime =
                            typeof session.session_end === "number" ? session.session_end : dayjs.utc(session.session_end).valueOf()
                        return [startTime, endTime]
                    }
                    return null
                })
            } else {
                // Callsigns view - map against callsigns
                data = callsigns.value.map((callsign) => {
                    if (callsign === session.callsign) {
                        const startTime =
                            typeof session.session_start === "number" ? session.session_start : dayjs.utc(session.session_start).valueOf()
                        const endTime =
                            typeof session.session_end === "number" ? session.session_end : dayjs.utc(session.session_end).valueOf()
                        return [startTime, endTime]
                    }
                    return null
                })
            }

            datasets.push({
                label: `${userKey}`,
                data: data,
                backgroundColor: getControllerColor(userKey), // Use controller CID for consistent coloring
            })
        })
    })

    return datasets
}

// datasets from sessions - CONTROLLERS VIEW
function generateControllersDatasets(sessions: historyController[]) {
    const sessionsByUser = new Map<string, historyController[]>()

    // Group all sessions by controller CID
    sessions.forEach((session) => {
        const key = session.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        sessionsByUser.get(key)!.push(session)
    })

    // Add active sessions
    activeSessions.value?.forEach((Activesession) => {
        const key = Activesession.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        if (Activesession.callsign == undefined || Activesession.position == undefined) return
        const session: historyController = {
            session_id: 0,
            cid: Activesession.cid,
            callsign: Activesession.callsign,
            position: Activesession.position,
            session_start: dayjs.utc(Activesession.timestamp).valueOf(),
            session_end: dayjs.utc().valueOf(),
        }
        sessionsByUser.get(key)!.push(session)
    })

    const datasets: any[] = []
    sessionsByUser.forEach((userSessions, userKey) => {
        const sessionsByPosition = new Map<string, historyController[]>()
        userSessions.forEach((session) => {
            const position = session.callsign
            if (!sessionsByPosition.has(position)) {
                sessionsByPosition.set(position, [])
            }
            sessionsByPosition.get(position)!.push(session)
        })

        sessionsByPosition.forEach((positionSessions, position) => {
            positionSessions.forEach((session) => {
                const data = controllers.value.map((controllerCid) => {
                    if (controllerCid === session.cid) {
                        const startTime =
                            typeof session.session_start === "number" ? session.session_start : dayjs.utc(session.session_start).valueOf()
                        const endTime =
                            typeof session.session_end === "number" ? session.session_end : dayjs.utc(session.session_end).valueOf()
                        return [startTime, endTime]
                    }
                    return null
                })

                datasets.push({
                    label: `${position}`, // Position name as label
                    data: data,
                    backgroundColor: getControllerColor(userKey), // Use controller CID for consistent coloring
                })
            })
        })
    })

    return datasets
}

// chartjs data format
const chartData2 = computed(() => {
    if (tab.value === 0) {
        // Positions tab - positions on Y-axis, controllers as bars
        const datasets = generatePositionsDatasets(controllerEntries.value, true)
        return {
            labels: positions.value,
            datasets: datasets,
        }
    } else if (tab.value === 1) {
        // Controllers tab - controllers on Y-axis, positions as bars
        const datasets = generateControllersDatasets(controllerEntries.value)
        return {
            labels: controllers.value,
            datasets: datasets,
        }
    } else {
        // Callsigns tab (tab 2) - callsigns on Y-axis
        const datasets = generatePositionsDatasets(controllerEntries.value, false)
        return {
            labels: callsigns.value, // Use callsigns computed property instead of empty selectedCallsigns
            datasets: datasets,
        }
    }
})

// OPTIONS
const chartOptions2 = computed(() => {
    const minTime = dayjs.utc().startOf("day").add(range.value[0], "hour").valueOf()
    const maxTime = dayjs.utc().startOf("day").add(range.value[1], "hour").valueOf()

    return {
        animation: {
            duration: 0,
        },
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y" as const,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    title: function (context: any) {
                        // Show the Y-axis label (position or controller)
                        return context[0].label
                    },
                    label: function (context: any) {
                        const datasetLabel = context.dataset.label
                        const data = context.raw
                        if (Array.isArray(data) && data.length === 2) {
                            const startTime = dayjs.utc(data[0]).format("HH:mm")
                            const endTime = dayjs.utc(data[1]).format("HH:mm")
                            return tab.value == 1
                                ? `${tooltipInformation(context.label)}: ${startTime} - ${endTime}z`
                                : `${tooltipInformation(datasetLabel)}: ${startTime} - ${endTime}z`
                        }
                        return `${datasetLabel}: No data`
                    },
                },
            },
            annotation: {
                annotations: {
                    line1: {
                        type: "line" as const,
                        xMin: LatestUpdatedUTC.value.valueOf(),
                        xMax: LatestUpdatedUTC.value.valueOf(),
                        borderColor: "rgb(255, 99, 132)",
                        borderWidth: 1,
                    },
                },
            },
        },
        scales: {
            y: {
                stacked: true,
            },
            x: {
                type: "linear" as const,
                min: minTime,
                max: maxTime,
                ticks: {
                    stepSize: 1000 * 60 * 60, // 1 hour steps
                    maxTicksLimit: Math.max(6, range.value[1] - range.value[0] + 1), // Dynamic based on range
                    callback: function (value: any) {
                        return dayjs.utc(value).format("HH:mm")
                    },
                },
            },
        },
    } as any
})

function tooltipInformation(label: string): string {
    if (!Array.isArray(savedControllers.value)) {
        return `Position ${label}`
    }

    if (tab.value === 1) {
    }

    const controller = savedControllers.value.find((c) => c.cid === label)
    if (controller) {
        return `[${controller.rating}] ${controller.name}`
    } else {
        return `Position ${label}`
    }
}

/**
 * Data fetching and subscripting logic
 */
async function fetchControllerInfo() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/controller/saved`)
        const data = await response.json()
        // Ensure data is an array
        console.log(data)
        savedControllers.value = Array.isArray(data.Controllers) ? data.Controllers : []
        console.log("Saved controllers:", savedControllers.value)
    } catch (err) {
        console.error("Error fetching controller info:", err)
        savedControllers.value = [] // Fallback to empty array
    }
}

function fetchControllerHistory() {
    LatestUpdatedUTC.value = dayjs.utc()
    fetch(`${apiBaseUrl}/api/history?day=${dayjs.utc().format("YYYY-MM-DD")}`)
        .then((resp) => resp.json())
        .then((data) => {
            controllerEntries.value = data.sessions
                .filter((e: any) => {
                    if (e.position && e.position != "pause" && e.position != " " && e.position != "other") return e
                })
                .map((session: any) => ({
                    ...session,
                    session_start: dayjs.utc(session.session_start).valueOf(),
                    session_end: dayjs.utc(session.session_end).valueOf(),
                }))
        })
        .catch((err) => {
            console.error("Error fetching controller history:", err)
        })
}

let unsubscribe: undefined | (() => void) = undefined

function subscribe() {
    const evtSource = new EventSource(`${apiBaseUrl}/subscribe-long`)
    evtSource.onmessage = (ev) => {
        LatestUpdatedUTC.value = dayjs.utc()
        activeSessions.value = JSON.parse(ev.data).activeControllers
    }
    return () => {
        evtSource.close()
    }
}

const refresh = async () => {
    LatestUpdatedUTC.value = dayjs.utc()
    fetchControllerHistory()
    if (unsubscribe) unsubscribe() // force request data from api...
    try {
        const response = await fetch(`${apiBaseUrl}/api/controllers`)
        const data = await response.json()
        activeSessions.value = data.activeControllers
    } catch (err) {
        console.error("Error fetching fresh controller data:", err)
    }

    // Restart the subscription
    unsubscribe = subscribe()
}

onMounted(async () => {
    LatestUpdatedUTC.value = dayjs.utc()
    fetchControllerHistory()
    fetchControllerInfo()
    unsubscribe = subscribe()
    try {
        const response = await fetch(`${apiBaseUrl}/api/controllers`)
        const data = await response.json()
        activeSessions.value = data.activeControllers
    } catch (err) {
        console.error("Error fetching initial controller data:", err)
    }
})

onUnmounted(() => {
    if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.ws-panel {
    padding: 20px;
}

.chart-section {
    margin-bottom: 40px;
    padding: 10px;
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
