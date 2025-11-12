<template>
    <v-dialog v-model="isOpen" max-width="600px">
        <v-card>
            <v-card-title>
                <span class="text-h5">Register Block Time</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <p><strong>Position:</strong> {{ blockData?.position }}</p>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="startTime" label="Start time (HH:mm)" type="time" required></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="endTime" label="End Ttme (HH:mm)" type="time" required></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="reason" :items="reasonOptions" label="Reason" required></v-select>
                        </v-col>
                        <v-col cols="12">
                            <v-textarea v-model="notes" label="Notes (optional)" rows="3"></v-textarea>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="handleCancel">Cancel</v-btn>
                <v-btn color="primary" variant="text" @click="handleConfirm">Block Time</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

interface BlockTimeData {
    position: string
    startTime: number
    endTime: number
}

const props = defineProps<{
    modelValue: boolean
    blockData: BlockTimeData | null
}>()

const emit = defineEmits<{
    "update:modelValue": [value: boolean]
    confirm: [
        payload: {
            position: string
            startTime: number
            endTime: number
            reason: string
            notes: string
        }
    ]
}>()

const isOpen = ref(props.modelValue)
const startTime = ref("")
const endTime = ref("")
const reason = ref("")
const notes = ref("")

const reasonOptions = ["Unavailable", "Break", "Other"]

// Watch for prop changes
watch(
    () => props.modelValue,
    (newValue) => {
        isOpen.value = newValue
        if (newValue && props.blockData) {
            // Initialize times when dialog opens
            startTime.value = dayjs.utc(props.blockData.startTime).format("HH:mm")
            endTime.value = dayjs.utc(props.blockData.endTime).format("HH:mm")
            reason.value = ""
            notes.value = ""
        }
    }
)

// Watch for dialog close
watch(isOpen, (newValue) => {
    emit("update:modelValue", newValue)
})

function handleCancel() {
    isOpen.value = false
    startTime.value = ""
    endTime.value = ""
    reason.value = ""
    notes.value = ""
}

function handleConfirm() {
    if (!props.blockData) return

    // Parse the time inputs and create timestamps for today
    const today = dayjs.utc().startOf("day")
    const [startHour, startMinute] = startTime.value.split(":").map(Number)
    const [endHour, endMinute] = endTime.value.split(":").map(Number)

    const startTimeValue = today.hour(startHour).minute(startMinute).valueOf()
    const endTimeValue = today.hour(endHour).minute(endMinute).valueOf()

    // send event
    emit("confirm", {
        position: props.blockData.position,
        startTime: startTimeValue,
        endTime: endTimeValue,
        reason: reason.value,
        notes: notes.value,
    })

    // reset
    isOpen.value = false
    startTime.value = ""
    endTime.value = ""
    reason.value = ""
    notes.value = ""
}
</script>

<style scoped></style>
