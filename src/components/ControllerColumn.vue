<template>
    <v-col class="d-flex flex-column" style="height: 90vh">
        <h2>{{ title }}</h2>
        <div
            class="d-flex flex-column gap-2 pa-4 flex-grow-1 bg-grey darken-3 overflow-auto"
            style="max-height: 100%"
            :ref="containerRef"
            @scroll="() => saveScrollPosition(columnType)"
        >
            <!-- Notepad Card - Only for "Other" column -->
            <div v-if="columnType === 'other'" class="notepad-card white-bg mb-2">
                <v-card-text class="pa-2">
                    <v-textarea
                        v-model="notepadContent"
                        placeholder="Notes..."
                        variant="outlined"
                        density="compact"
                        rows="4"
                        hide-details
                        auto-grow
                        @blur="saveNotepad"
                    ></v-textarea>
                </v-card-text>
            </div>

            <!-- Draggable Controllers -->
            <VueDraggable
                class="d-flex flex-column gap-2"
                v-model="controllers"
                :animation="100"
                ghostClass="ghost"
                group="tasks"
                :disabled="!authorized"
                @update="onUpdate"
                @add="onAdd"
                @remove="onRemove"
            >
                <div
                    v-for="controller in controllers"
                    :key="controller.cid"
                    class="cursor-move white-bg lighten-5 mb-2 position-relative"
                    :class="{
                        'online-card': controller.position?.toLowerCase() === 'online',
                        'ws-card': controller.callsign?.toLowerCase().startsWith('ws'),
                    }"
                    :style="getBorderColor(controller)"
                    @dragstart="onDragStart(controller)"
                >
                    <div class="controller-rating" :style="getBorderTextColor(controller)">{{ controller.rating }}</div>
                    <v-card-text class="pa-1">
                        <v-row no-gutters class="border-row">
                            <v-col cols="6" class="border-cell no-border-left no-border-top">
                                {{ controller.name }} ({{ controller.cid }})
                            </v-col>
                            <v-col cols="4" class="border-cell no-border-top">
                                {{ getPositionDisplay(controller) }}
                            </v-col>
                            <v-col
                                cols="2"
                                class="border-cell no-border-right no-border-top"
                                :style="controller.timestamp ? getSessionBorder(controller.timestamp) : ' '"
                            >
                                {{ formatTimeDifference(controller.timestamp) }}
                            </v-col>
                        </v-row>

                        <v-row no-gutters class="border-row">
                            <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                                {{ controller.endorsment === "NIL" ? " " : parseEndorsment(controller.endorsment, controller.rating) }}
                            </v-col>
                            <v-col cols="6" class="border-cell no-border-right no-border-bottom">
                                {{ getCallsignDisplay(controller) || " " }}
                            </v-col>
                        </v-row>
                    </v-card-text>
                </div>
            </VueDraggable>
        </div>
    </v-col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

interface Controller {
    name: string
    sign: string
    cid: string
    callsign: string
    position?: string
    frequency: string
    rating: string
    endorsment: string
    timestamp: string
}

interface Props {
    title: string
    columnType: "active" | "break" | "other"
    controllers: Controller[]
    authorized: boolean
    containerRef: string
}

interface Emits {
    (e: "update", controllers: Controller[]): void
    (e: "add"): void
    (e: "remove"): void
    (e: "dragStart", controller: Controller): void
    (e: "saveScrollPosition", columnType: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const controllers = computed({
    get: () => props.controllers,
    set: (value) => emit("update", value),
})

// Notepad functionality
const notepadContent = ref("")
const notepadStorageKey = "otherColumnNotepad"

onMounted(() => {
    // Load notepad content from localStorage
    const savedContent = localStorage.getItem(notepadStorageKey)
    if (savedContent) {
        notepadContent.value = savedContent
    }
})

const saveNotepad = () => {
    // Save notepad content to localStorage
    localStorage.setItem(notepadStorageKey, notepadContent.value)
}

const onUpdate = () => {
    emit("update", controllers.value)
}

const onAdd = () => {
    emit("add")
}

const onRemove = () => {
    emit("remove")
}

const onDragStart = (controller: Controller) => {
    emit("dragStart", controller)
}

const saveScrollPosition = (columnType: string) => {
    emit("saveScrollPosition", columnType)
}

const getPositionDisplay = (controller: Controller) => {
    switch (props.columnType) {
        case "active":
            return controller.position
        case "break":
            return "Paus"
        case "other":
            return ""
        default:
            return controller.position
    }
}

const getCallsignDisplay = (controller: Controller) => {
    switch (props.columnType) {
        case "active":
            return controller.callsign.length > 0 ? controller.callsign : ""
        case "break":
            return ""
        case "other":
            return controller.callsign || "other"
        default:
            return controller.callsign
    }
}

const formatTimeDifference = (timestamp: string) => {
    if (!timestamp) return "--:--:--"

    const now = dayjs.utc()
    const startTime = dayjs.utc(timestamp)
    const duration = dayjs.duration(now.diff(startTime))

    if (duration.asSeconds() < 1) {
        return "--:--:--"
    }

    const hours = String(Math.floor(duration.asHours())).padStart(2, "0")
    const minutes = String(duration.minutes()).padStart(2, "0")

    return `${hours}:${minutes}`
}

const parseEndorsment = (endorsementStr: string | string[], rating: string) => {
    if (rating === "C1") return " "

    if (endorsementStr === "{NULL}" || endorsementStr == undefined) {
        return " "
    }
    if (typeof endorsementStr != "string") {
        return " "
    }

    const validEndorsements = ["T2 APS", "T1 TWR", "T1 APP", "SOLO GG TWR", "SOLO GG APP"]
    let strmatches = validEndorsements.filter((endorsement) => endorsementStr.match(endorsement)?.length === 1)

    if (rating === "S3") {
        if (strmatches.includes("T1 APP")) {
            strmatches = strmatches.filter((val) => val === "T1 APP")
        } else {
            strmatches = strmatches.filter((val) => val === "T1 APP" || val === "T1 TWR")
        }
    }

    const result = strmatches.join(", ")
    if (result == null) {
        return " "
    }

    return result
}

const calculateSessionLength = (timestamp: string) => {
    const now = dayjs.utc()
    const start = dayjs.utc(timestamp)
    return dayjs.duration(now.diff(start)).asSeconds()
}

const getSessionBorder = (sessionLength: string) => {
    const totalMinutes = calculateSessionLength(sessionLength) / 60

    const longSessionThreshold = 120
    const mediumSessionThreshold = 90

    const longSessionColor = "#CC3300"
    const mediumSessionColor = "#FFCC00"

    const longSessionTextColor = "black"
    const mediumSessionTextColor = "black"

    let bgColor, txtColor

    if (longSessionThreshold < totalMinutes) {
        bgColor = longSessionColor
        txtColor = longSessionTextColor
    } else if (mediumSessionThreshold < totalMinutes) {
        bgColor = mediumSessionColor
        txtColor = mediumSessionTextColor
    }

    if (!bgColor) return ""

    return [{ background: bgColor }, { color: txtColor }]
}

const getBorderColor = (ctrl: Controller) => {
    let ratingColor

    switch (ctrl.rating) {
        case "S1":
            ratingColor = "green"
            break
        case "S2":
            ratingColor = "blue"
            break
        case "S3":
            ratingColor = "red"
            break
        case "C1":
            ratingColor = "yellow"
            break
        default:
            ratingColor = "grey"
    }

    return { "--v-border-color": ratingColor, borderLeft: "15px solid var(--v-border-color)" }
}

const getBorderTextColor = (ctrl: Controller) => {
    if (ctrl.rating === "C1") return { color: "#000" }
    return { color: "#FFF" }
}
</script>

<style scoped>
.ghost {
    opacity: 50%;
}

.bg-grey {
    background-color: #aaa !important;
}

.white-bg {
    background-color: #ececec;
    color: #000;
}

.controller-rating {
    position: absolute;
    top: 40%;
    left: 2px;
    transform: rotate(-90deg);
    transform-origin: left bottom;
    white-space: nowrap;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    background-color: transparent;
    padding-left: 5px;
}

.border-row {
    margin: 0;
}

.border-cell {
    border: 0.5px solid #bbbbbb;
    text-align: center;
    padding: 3px !important;
    min-height: 24px;
    line-height: 14px;
}

.no-border-left {
    border-left: none;
}

.no-border-right {
    border-right: none;
}

.no-border-bottom {
    border-bottom: none;
}

.no-border-top {
    border-top: none;
}

.v-card-text {
    padding: 0 !important;
}

.online-card {
    background-color: #eff3cf;
}

.ws-card {
    background-color: #dce6f5;
}

.notepad-card {
    background-color: #dce6f5;
    min-height: 100px;
}

.notepad-card :deep(.v-textarea) {
    font-size: 14px;
}

.notepad-card :deep(.v-field) {
    background-color: transparent;
}
</style>
