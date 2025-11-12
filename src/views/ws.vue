<template>
    <div v-if="authorized" class="d-flex align-center mt-8 flex-column">
        <h1>WS Panel</h1>
        <h2 class="mb-8">Please login</h2>
        <v-text-field
            v-model="password"
            label="Password"
            type="password"
            outlined
            clearable
            @keyup.enter="toggleAuthorization"
            style="width: 33%"
        />
        <v-btn @click="toggleAuthorization" color="primary" type="button" rounded style="width: 33%">Authorize</v-btn>
        <p v-if="errorMessage" class="text-red mt-2">{{ errorMessage }}</p>
    </div>
    <div class="ws-panel" v-else>
        <div class="d-flex justify-space-between">
            <h1>WS Panel</h1>
            <div class="d-flex-end mt-2">
                <v-btn color="#5865f2" @click="openAddControllerDialog">Add Controller</v-btn>
                <v-btn class="ml-2" @click="openEditControllerDialog">Edit Controller</v-btn>
                <v-btn class="ml-2" @click="openVatdashDialog">VATDASH</v-btn>
            </div>
        </div>
        <v-tabs v-model="tab">
            <v-tab v-for="tabPages in tabs" :key="tabPages"> {{ tabPages }} </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
            <v-tabs-window-item v-for="tabPages in tabs" :key="tabPages">
                <div class="chart-section border-radius mt-2">
                    <div class="d-flex justify-end align-center mb-4 mt-2">
                        <div class="d-flex">
                            <p class="mr-3 mt-2">Last updated: {{ LatestUpdatedUTC.format("HH:mm:ss") }}z</p>
                            <v-btn @click="refresh" color="primary">refresh</v-btn>
                        </div>
                    </div>
                    <Timeline
                        v-if="tab === 1"
                        :chartData="chartData2"
                        :chartOptions="chartOptions"
                        @requestBlockTime="openBlockTimeDialog"
                        @clickBlockedTime="handleClickBlockedTime"
                    />
                    <Timeline v-else :chartData="chartData2" :chartOptions="chartOptions" />
                </div>
                <div class="mx-4">
                    <v-range-slider :min="0" :max="24" :step="1" strict v-model="range"></v-range-slider>
                </div>
                <div class="ml-2">
                    <h2>Filter</h2>
                    <div v-if="tab === 0">
                        <v-checkbox-btn
                            density="compact"
                            v-model="selectedPositions"
                            v-for="position in positions"
                            :value="position"
                            :label="position"
                            :key="position"
                        ></v-checkbox-btn>
                    </div>
                    <div v-else-if="tab === 1">
                        <template v-for="(rating, index) in ['C1', 'S3', 'S2', 'S1', 'Other']" :key="rating">
                            <div v-if="controllersByRating[rating].length > 0" :class="{ 'mt-4': index > 0 }">
                                <div class="d-flex justify-space-between align-center mb-2">
                                    <h3 class="text-subtitle-1 font-weight-bold">{{ rating }}</h3>
                                    <div>
                                        <v-btn size="x-small" variant="text" @click="selectAllInRating(rating)" class="mr-1">
                                            Select All
                                        </v-btn>
                                        <v-btn size="x-small" variant="text" @click="deselectAllInRating(rating)"> Deselect All </v-btn>
                                    </div>
                                </div>
                                <v-checkbox-btn
                                    density="compact"
                                    v-model="selectedControllers"
                                    v-for="controller in controllersByRating[rating]"
                                    :value="controller"
                                    :label="tooltipInformation(controller)"
                                    :key="controller"
                                ></v-checkbox-btn>
                            </div>
                        </template>
                    </div>
                    <div v-else-if="tab === 2">
                        <v-checkbox-btn
                            density="compact"
                            v-model="selectedCallsigns"
                            v-for="callsign in callsigns"
                            :value="callsign"
                            :label="callsign"
                            :key="callsign"
                        ></v-checkbox-btn>
                    </div>
                </div>
            </v-tabs-window-item>
        </v-tabs-window>

        <BlockTimeDialog v-model="blockTimeDialog" :blockData="pendingBlockTime" @confirm="handleBlockTimeConfirm" />
        <DeleteBlockedTimeDialog
            v-model="deleteBlockedTimeDialog"
            :blockedTime="pendingDeleteBlock"
            :controllerName="pendingDeleteBlock ? tooltipInformation(pendingDeleteBlock.cid) : ''"
            @confirm="confirmDeleteBlockedTime"
        />
        <EditControllerDialog v-model="editControllerDialog" :controller="pendingEditController" @confirm="handleEditControllerConfirm" />
        <AddControllerDialog
            v-model="addControllerDialog"
            :predefined-controllers="savedControllersAsControllers"
            :all-active-controllers="allActiveControllers"
            :api-base-url="apiBaseUrl"
            @controller-added="handleControllerAdded"
        />

        <!-- VATDASH for editing notepad -->
        <v-dialog v-model="vatdashDialog" max-width="600">
            <v-card>
                <v-card-title>WS Meddelanden</v-card-title>
                <v-card-text>
                    <v-textarea
                        v-model="vatdashContent"
                        placeholder="Skriv meddelanden här..."
                        variant="outlined"
                        rows="10"
                        auto-grow
                    ></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeVatdashDialog">Cancel</v-btn>
                    <v-btn color="primary" @click="submitVatdashContent">Submit</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import Timeline from "@/components/Timeline.vue"
import BlockTimeDialog from "@/components/BlockTimeDialog.vue"
import DeleteBlockedTimeDialog from "@/components/DeleteBlockedTimeDialog.vue"
import EditControllerDialog from "@/components/EditControllerDialog.vue"
import AddControllerDialog from "@/components/AddControllerDialog.vue"
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
    endorsements?: string[]
}

interface BlockedTime {
    block_id: number
    cid: string
    position: string
    blocked_start: number // ms
    blocked_end: number // ms
    reason: string
    notes?: string
    created_at: number // ms
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
document.title = "VATPLS | WS"

const tab = ref(0)
const tabs = ["Positions", "Controllers", "Callsign"]

const controllerEntries = ref<historyController[]>([])
const activeSessions = ref<Controller[]>()
const availableSessions = ref<Controller[]>()
const awaySessions = ref<Controller[]>()
const savedControllers = ref<smallController[]>([])
const LatestUpdatedUTC = ref(dayjs.utc())

const blockedTimes = ref<BlockedTime[]>([])

const selectedCallsigns = ref<string[]>([])
const selectedPositions = ref<string[]>([])
const selectedControllers = ref<string[]>([])

const range = ref([0, 24])

const blockTimeDialog = ref(false)
const pendingBlockTime = ref<{ position: string; startTime: number; endTime: number } | null>(null)

const deleteBlockedTimeDialog = ref(false)
const pendingDeleteBlock = ref<BlockedTime | null>(null)

const editControllerDialog = ref(false)
const pendingEditController = ref<smallController | null>(null)

const addControllerDialog = ref(false)

const vatdashDialog = ref(false)
const vatdashContent = ref("")

const authorized = ref(false)
const password = ref("")
const errorMessage = ref("")

function toggleAuthorization() {
    const envPassword = import.meta.env.VITE_WS_PASSWORD || ""
    authorized.value = password.value === envPassword
    if (!authorized.value) errorMessage.value = "Incorrect password"
}
// Computed property for all active controllers
const allActiveControllers = computed(() => [
    ...(activeSessions.value || []),
    ...(availableSessions.value || []),
    ...(awaySessions.value || []),
])

// Convert savedControllers to full Controller format for AddControllerDialog
const savedControllersAsControllers = computed<Controller[]>(() =>
    savedControllers.value.map((c) => ({
        name: c.name,
        sign: c.sign,
        cid: c.cid,
        callsign: "",
        position: "",
        frequency: "",
        rating: c.rating,
        endorsment: c.endorsements?.join(", ") || "",
        timestamp: "",
    }))
)

const callsigns = computed(() => {
    const positionsSet = new Set<string>()
    controllerEntries.value.forEach((entry) => {
        positionsSet.add(entry.callsign)
    })
    activeSessions.value?.forEach((entry) => {
        if (entry.callsign == undefined || entry.position == undefined) return
        positionsSet.add(entry.callsign)
    })
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

const controllersByRating = computed(() => {
    const groups: { [rating: string]: string[] } = {
        C1: [],
        S3: [],
        S2: [],
        S1: [],
        Other: [],
    }

    controllers.value.forEach((cid) => {
        const controller = savedControllers.value.find((c) => c.cid === cid)
        if (controller) {
            const rating = controller.rating
            // C3 controllers are grouped with C1
            if (rating === "C3" || rating === "C1" || rating === "I1") {
                groups["C1"].push(cid)
            } else if (rating in groups) {
                groups[rating].push(cid)
            } else {
                groups["Other"].push(cid)
            }
        } else {
            groups["Other"].push(cid)
        }
    })

    return groups
})

// Initialize selections when data changes
watch(
    callsigns,
    (newCallsigns) => {
        if (newCallsigns.length > 0 && selectedCallsigns.value.length === 0) {
            selectedCallsigns.value = [...newCallsigns]
        }
    },
    { immediate: true }
)

watch(
    positions,
    (newPositions) => {
        if (newPositions.length > 0 && selectedPositions.value.length === 0) {
            selectedPositions.value = [...newPositions]
        }
    },
    { immediate: true }
)

watch(
    controllers,
    (newControllers) => {
        if (newControllers.length > 0 && selectedControllers.value.length === 0) {
            selectedControllers.value = [...newControllers]
        }
    },
    { immediate: true }
)

// Use consistent colors for each CID across all tabs
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

    // för varje session hämta cid, cid representerar en nyckel som mappar till sessioner.
    sessions.forEach((session) => {
        const key = session.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        sessionsByUser.get(key)!.push(session)
    })

    // samma sak fast för aktiva, de ligger bökigt nog under två olika variabler.
    activeSessions.value?.forEach((Activesession) => {
        const key = Activesession.cid
        if (!sessionsByUser.has(key)) {
            sessionsByUser.set(key, [])
        }
        // ta bort skräp
        if (Activesession.callsign == undefined || Activesession.position == undefined) return
        const session: historyController = {
            session_id: 0,
            cid: Activesession.cid,
            callsign: Activesession.callsign,
            position: Activesession.position,
            session_start: dayjs.utc(Activesession.timestamp).valueOf(), // ms
            session_end: dayjs.utc().valueOf(), // ms
        }
        sessionsByUser.get(key)!.push(session)
    })

    const datasets: any[] = []
    // för varje cid och den personens sessions
    // sortera enligt callsign
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

    blockedTimes.value.forEach((blockedTime) => {
        let data: any[]
        const startTime = blockedTime.blocked_start
        const endTime = blockedTime.blocked_end

        if (usePositions) {
            // Positions view - map against positions
            data = positions.value.map((position) => {
                if (position === blockedTime.position) {
                    return [startTime, endTime]
                }
                return null
            })
        } else {
            // Callsigns view - map against callsigns
            data = callsigns.value.map((callsign) => {
                if (callsign === blockedTime.position) {
                    return [startTime, endTime]
                }
                return null
            })
        }

        datasets.push({
            label: `BLOCKED-${blockedTime.block_id}`,
            data: data,
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            borderColor: "rgba(255, 0, 0, 0.8)",
            borderWidth: 2,
            borderSkipped: false,
            barThickness: "flex",
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

    // Add blocked times as separate datasets
    blockedTimes.value.forEach((blockedTime) => {
        const data = controllers.value.map((controllerCid) => {
            if (controllerCid === blockedTime.cid) {
                const startTime = blockedTime.blocked_start
                const endTime = blockedTime.blocked_end
                return [startTime, endTime]
            }
            return null
        })

        datasets.push({
            label: `BLOCKED-${blockedTime.block_id}`,
            data: data,
            backgroundColor: "rgba(255, 0, 0, 0.5)", // Red with transparency for blocked times
            borderColor: "rgba(255, 0, 0, 0.8)",
            borderWidth: 2,
            borderSkipped: false, // Show borders on all sides
            barThickness: "flex",
        })
    })

    return datasets
}

// filter related stuff
const filteredCallsigns = computed(() => {
    return callsigns.value.filter((c) => selectedCallsigns.value.includes(c))
})

const filteredPositions = computed(() => {
    return positions.value.filter((p) => selectedPositions.value.includes(p))
})

const filteredControllers = computed(() => {
    return controllers.value.filter((c) => selectedControllers.value.includes(c))
})

const filteredControllersName = computed(() => {
    return savedControllers.value.filter((c) => selectedControllers.value.includes(c.cid)).map((c) => `${c.name}`)
})

// chartjs data format
const chartData2 = computed(() => {
    //positions (actual real positions) ACC1, APP1 etc
    if (tab.value === 0) {
        const datasets = generatePositionsDatasets(controllerEntries.value, true)
        return {
            labels: filteredPositions.value,
            datasets: datasets,
        }
    }
    // controllers
    else if (tab.value === 1) {
        const datasets = generateControllersDatasets(controllerEntries.value)
        return {
            labels: filteredControllersName.value,
            datasets: datasets,
        }
    }
    // callsigns ESSA_TWR etc.
    else {
        const datasets = generatePositionsDatasets(controllerEntries.value, false)
        return {
            labels: filteredCallsigns.value,
            datasets: datasets,
        }
    }
})

// OPTIONS
const chartOptions = computed(() => {
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
            datalabels: {
                formatter: function (value: any, context: any) {
                    if (Array.isArray(value) && value.length === 2) {
                        // TODO hide label on very small bars
                        const start = value[0]
                        const end = value[1]
                        const hideForMinutes = 10

                        if (end - start > 1000 * 60 * hideForMinutes) return `${context.dataset.label}`
                    }
                    return ""
                },
                color: "#e0e0e0",
                font: {
                    size: 8,
                    weight: "bold",
                },
                labels: {
                    title: {},
                },
            },
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

                        // Check if this is a blocked time
                        if (datasetLabel && datasetLabel.startsWith("BLOCKED-")) {
                            const blockId = datasetLabel.replace("BLOCKED-", "")
                            const blockedTime = blockedTimes.value.find(
                                (bt) => bt.block_id.toString() === blockId || bt.position === blockId
                            )

                            if (Array.isArray(data) && data.length === 2) {
                                const startTime = dayjs.utc(data[0]).format("HH:mm")
                                const endTime = dayjs.utc(data[1]).format("HH:mm")

                                if (blockedTime) {
                                    return [
                                        `BLOCKED: ${startTime} - ${endTime}z`,
                                        `Reason: ${blockedTime.reason}`,
                                        blockedTime.notes ? `Notes: ${blockedTime.notes}` : "",
                                    ].filter(Boolean)
                                }
                                return `BLOCKED: ${startTime} - ${endTime}z`
                            }
                        }

                        // Regular session tooltip
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
                ticks: {
                    color: "#e0e0e0",
                },
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
                    color: "#e0e0e0",
                },
            },
        },
    } as any
})

function tooltipInformation(label: string): string {
    if (!Array.isArray(savedControllers.value)) {
        return `Position ${label}`
    }

    const controller = savedControllers.value.find((c) => c.cid === label)
    if (controller) {
        return ` ${controller.name} (${controller.cid})`
    } else {
        return `Position ${label}`
    }
}

/**
 * Rating filter functions
 */
function selectAllInRating(rating: string) {
    const controllersInRating = controllersByRating.value[rating]
    controllersInRating.forEach((cid) => {
        if (!selectedControllers.value.includes(cid)) {
            selectedControllers.value.push(cid)
        }
    })
}

function deselectAllInRating(rating: string) {
    const controllersInRating = controllersByRating.value[rating]
    selectedControllers.value = selectedControllers.value.filter((cid) => !controllersInRating.includes(cid))
}

/**
 * Data fetching and subscripting logic
 */
async function fetchControllerInfo() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/controller/saved`)
        const data = await response.json()
        savedControllers.value = Array.isArray(data.Controllers) ? data.Controllers : []
    } catch (err) {
        console.error("Error fetching controller info:", err)
        savedControllers.value = []
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

function fetchBlockedTimes() {
    fetch(`${apiBaseUrl}/api/blocked-time?day=${dayjs.utc().format("YYYY-MM-DD")}`)
        .then((resp) => resp.json())
        .then((data) => {
            blockedTimes.value = (data.blockedTimes || []).map((bt: any) => ({
                ...bt,
                blocked_start: dayjs.utc(bt.blocked_start).valueOf(),
                blocked_end: dayjs.utc(bt.blocked_end).valueOf(),
                created_at: dayjs.utc(bt.created_at).valueOf(),
            }))
        })
        .catch((err) => {
            console.error("Error fetching blocked times:", err)
        })
}

let unsubscribe: undefined | (() => void) = undefined

function subscribe() {
    const evtSource = new EventSource(`${apiBaseUrl}/subscribe-long`)
    evtSource.onmessage = (ev) => {
        LatestUpdatedUTC.value = dayjs.utc()
        const jsonData = JSON.parse(ev.data)
        availableSessions.value = jsonData.availableControllers
        awaySessions.value = jsonData.awayControllers
        activeSessions.value = jsonData.activeControllers
    }
    return () => {
        evtSource.close()
    }
}

const refresh = async () => {
    LatestUpdatedUTC.value = dayjs.utc()
    fetchControllerHistory()
    fetchBlockedTimes()
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

    // hack to get all items after refresh has been done
    setTimeout(() => {
        if (callsigns.value.length > 0) selectedCallsigns.value = [...callsigns.value]
        if (positions.value.length > 0) selectedPositions.value = [...positions.value]
        if (controllers.value.length > 0) selectedControllers.value = [...controllers.value]
    }, 200)
}

onMounted(async () => {
    LatestUpdatedUTC.value = dayjs.utc()
    // latest passed hour
    const closestHour = dayjs.utc().startOf("hour").add(-1, "hour")
    range.value = [closestHour.hour(), 24]
    fetchControllerHistory()
    fetchControllerInfo()
    fetchBlockedTimes()
    unsubscribe = subscribe()
    try {
        const response = await fetch(`${apiBaseUrl}/api/controllers`)
        const data = await response.json()
        activeSessions.value = data.activeControllers
    } catch (err) {
        console.error("Error fetching initial controller data:", err)
    }

    // Ensure all items are selected after initial data load with multiple checks
    const initSelections = () => {
        if (callsigns.value.length > 0) selectedCallsigns.value = [...callsigns.value]
        if (positions.value.length > 0) selectedPositions.value = [...positions.value]
        if (controllers.value.length > 0) selectedControllers.value = [...controllers.value]
    }
    // fix this properly
    setTimeout(initSelections, 1000)
})

onUnmounted(() => {
    if (unsubscribe) unsubscribe()
})

/**
 * Block time dialog functions
 */
function openBlockTimeDialog(payload: { position: string; startTime: number; endTime: number }) {
    pendingBlockTime.value = payload
    blockTimeDialog.value = true
}

function handleClickBlockedTime(payload: { blockId: number }) {
    const blockedTime = blockedTimes.value.find((bt) => bt.block_id === payload.blockId)

    if (blockedTime) {
        pendingDeleteBlock.value = blockedTime
        deleteBlockedTimeDialog.value = true
    } else {
        console.error("Blocked time not found:", payload.blockId)
    }
}

function handleBlockTimeConfirm(payload: { position: string; startTime: number; endTime: number; reason: string; notes: string }) {
    // In Controllers tab, payload.position is the CID
    const cid = payload.position

    fetch(`${apiBaseUrl}/api/blocked-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cid: cid,
            position: payload.position, // Store CID as position for Controllers tab
            blocked_start: dayjs.utc(payload.startTime).toISOString(),
            blocked_end: dayjs.utc(payload.endTime).toISOString(),
            reason: payload.reason,
            notes: payload.notes,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.error || "Failed to block time")
                })
            }
            return response.json()
        })
        .then(() => {
            // Refresh data to show the new blocked time
            fetchBlockedTimes()
        })
        .catch((err) => {
            console.error("Failed to block time:", err)
            alert(`Failed to block time: ${err.message}`)
        })
}

function confirmDeleteBlockedTime() {
    if (!pendingDeleteBlock.value) return

    fetch(`${apiBaseUrl}/api/blocked-time/${pendingDeleteBlock.value.block_id}`, {
        method: "DELETE",
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.error || "Failed to delete blocked time")
                })
            }
            return response.json()
        })
        .then(() => {
            deleteBlockedTimeDialog.value = false
            pendingDeleteBlock.value = null
            // Refresh data to remove the deleted blocked time
            fetchBlockedTimes()
        })
        .catch((err) => {
            console.error("Failed to delete blocked time:", err)
            alert(`Failed to delete blocked time: ${err.message}`)
        })
}

function openAddControllerDialog() {
    addControllerDialog.value = true
}

function handleControllerAdded(controller: Controller) {
    console.log("Controller added:", controller)
    // Refresh data to show the new controller
    refresh()
}

function openEditControllerDialog() {
    pendingEditController.value = null
    editControllerDialog.value = true
}

function handleEditControllerConfirm(controller: smallController) {
    fetch(`${apiBaseUrl}/api/controller/${controller.cid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: controller.name,
            sign: controller.sign,
            rating: controller.rating,
            endorsements: controller.endorsements || [],
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.error || "Failed to update controller")
                })
            }
            return response.json()
        })
        .then(() => {
            const index = savedControllers.value.findIndex((c) => c.cid === controller.cid)
            if (index !== -1) {
                savedControllers.value[index] = controller
            } else {
                savedControllers.value.push(controller)
            }
            editControllerDialog.value = false
            pendingEditController.value = null
        })
        .catch((err) => {
            console.error("Failed to update controller:", err)
            alert(`Failed to update controller: ${err.message}`)
        })
}

/**
 * VATDASH notepad functions
 */
async function openVatdashDialog() {
    // Fetch current content from API
    try {
        const response = await fetch(`${apiBaseUrl}/api/notepad`)
        const data = await response.json()
        vatdashContent.value = data.content || ""
    } catch (error) {
        console.error("Error fetching notepad content:", error)
        vatdashContent.value = ""
    }
    vatdashDialog.value = true
}

function closeVatdashDialog() {
    vatdashDialog.value = false
    vatdashContent.value = ""
}

async function submitVatdashContent() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/notepad`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: vatdashContent.value }),
        })

        if (!response.ok) {
            throw new Error("Failed to update notepad")
        }

        // Close dialog on success
        vatdashDialog.value = false
        console.log("Notepad updated successfully")
    } catch (error) {
        console.error("Error updating notepad:", error)
        alert("Failed to update notepad")
    }
}
</script>

<style scoped>
.ws-panel {
    padding: 20px;
}

.chart-section {
    margin-bottom: 40px;
    padding: 10px;
    background: #2b2b2b;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.chart-section h2,
.chart-section p {
    color: #e0e0e0;
}

.info-sections {
    display: flex;
    gap: 20px;
}

.info-sections > div {
    flex: 1;
}
</style>
