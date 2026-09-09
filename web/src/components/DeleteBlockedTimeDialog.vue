<template>
    <v-dialog v-model="isOpen" max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Delete Blocked Time</v-card-title>
            <v-card-text v-if="blockedTime">
                <p class="mb-2">Are you sure you want to delete this blocked time?</p>
                <div class="mt-4">
                    <p><strong>Controller:</strong> {{ controllerName }}</p>
                    <p><strong>Time:</strong> {{ formattedStartTime }} - {{ formattedEndTime }}z</p>
                    <p><strong>Reason:</strong> {{ blockedTime.reason }}</p>
                    <p v-if="blockedTime.notes"><strong>Notes:</strong> {{ blockedTime.notes }}</p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="cancel">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="confirm">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

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

const props = defineProps<{
    modelValue: boolean
    blockedTime: BlockedTime | null
    controllerName: string
}>()

const emit = defineEmits<{
    "update:modelValue": [value: boolean]
    confirm: []
}>()

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
})

const formattedStartTime = computed(() => {
    if (!props.blockedTime) return ""
    return dayjs.utc(props.blockedTime.blocked_start).format("HH:mm")
})

const formattedEndTime = computed(() => {
    if (!props.blockedTime) return ""
    return dayjs.utc(props.blockedTime.blocked_end).format("HH:mm")
})

function cancel() {
    emit("update:modelValue", false)
}

function confirm() {
    emit("confirm")
}
</script>
