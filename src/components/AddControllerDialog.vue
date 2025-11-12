<template>
    <!-- Dialog for Adding/Starting a Controller Session -->
    <v-dialog v-model="localShowDialog" max-width="500">
        <v-card>
            <v-card-title>Start shift</v-card-title>
            <v-card-text>
                <v-form ref="controllerForm" @submit.prevent>
                    <v-text-field v-model="newController.cid" label="CID" autofocus @keyup.enter="startSession"></v-text-field>
                    <p v-if="controllerMatch()" class="ml-4">
                        {{ isActiveController(newController) ? "Controller is already active" : foundController?.name + " found" }}
                    </p>
                    <p v-else-if="newController.cid.length > 0" class="ml-4">Incorrect CID</p>
                    <v-card-actions>
                        <v-btn v-if="controllerMatch() && !isActiveController(newController)" color="primary" @click="startSession"
                            >Start shift</v-btn
                        >
                        <v-btn
                            v-if="!controllerMatch() && !isActiveController(newController)"
                            color="primary"
                            @click="showNewControllerDialog = true"
                            >New controller</v-btn
                        >
                        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
                    </v-card-actions>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Dialog for Adding a New Controller -->
    <v-dialog v-model="showNewControllerDialog" max-width="500">
        <v-card>
            <v-card-title>New controller</v-card-title>
            <v-card-text>
                <v-form ref="newControllerForm">
                    <v-text-field
                        v-model="newController.name"
                        label="Full Name"
                        autofocus
                        :rules="[(v: string) => v.length >= 3 || 'Name must be at least 3 characters long']"
                    ></v-text-field>
                    <v-text-field
                        v-model="newController.sign"
                        label="Signature (2 letters)"
                        :rules="[(v: string) => /^[a-zA-Z]{2}$/.test(v) || 'Sign must be 2 letters']"
                        maxlength="2"
                    ></v-text-field>
                    <v-text-field
                        v-model="newController.cid"
                        label="CID"
                        :rules="[(v: string) => /^\d{5,8}$/.test(v) || 'CID must be 5-8 digits']"
                    ></v-text-field>
                    <v-select
                        v-model="newController.rating"
                        :items="ratings"
                        label="Rating"
                        :rules="[(v: string) => !!v || 'Rating is required']"
                    ></v-select>
                    <v-select
                        v-model="tempEndorsment"
                        :items="endorsments"
                        label="Endorsment"
                        chips
                        multiple
                        :rules="[(v: string) => !!v && v.length > 0 || 'Endorsment is required']"
                    >
                    </v-select>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" @click="addNewController" :disabled="!isNewControllerFormValid">Add</v-btn>
                <v-btn variant="text" @click="closeAllDialogs">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export interface Controller {
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
    modelValue: boolean
    predefinedControllers: Controller[]
    allActiveControllers: Controller[]
    apiBaseUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
    apiBaseUrl: "http://localhost:3001",
})

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void
    (e: "controllerAdded", controller: Controller): void
}>()

const ratings = ["S1", "S2", "S3", "C1"]
const endorsments = ["NIL", "T2 APS", "T1 TWR", "T1 APP", "SOLO GG TWR", "SOLO GG APP"]

const localShowDialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
})

const showNewControllerDialog = ref(false)
const foundController = ref<Controller | null>(null)
const newControllerForm = ref(null)

const newController = ref({
    name: "",
    sign: "",
    cid: "",
    callsign: "",
    position: "",
    frequency: "",
    rating: "",
    endorsment: "",
    timestamp: dayjs().utc().format(),
})

const tempEndorsment = ref<string[]>([])

const isNewControllerFormValid = computed(() => {
    if (!newControllerForm.value) return false
    return (
        newController.value.name.length >= 3 &&
        /^[a-zA-Z]{2}$/.test(newController.value.sign) &&
        /^\d{5,8}$/.test(newController.value.cid) &&
        !!newController.value.rating &&
        !!tempEndorsment.value
    )
})

function controllerMatch() {
    const controllersSearch = props.predefinedControllers.filter((controller) => controller.cid === newController.value.cid)
    const allControllersSearch = props.allActiveControllers.filter((controller) => controller.cid === newController.value.cid)

    if (controllersSearch.length > 0) {
        foundController.value = controllersSearch[0]
    } else if (allControllersSearch.length > 0) {
        foundController.value = allControllersSearch[0]
    }

    return controllersSearch.length > 0 || allControllersSearch.length > 0
}

function isActiveController(ctrl: Controller) {
    if (!ctrl) return false
    return props.allActiveControllers.find((controller) => controller.cid === ctrl.cid) || false
}

async function addControllerToDB(newcontroller: Controller) {
    try {
        await fetch(`${props.apiBaseUrl}/api/controller/new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ Controller: newcontroller }),
        })
    } catch (error) {
        console.error("Error saving controller data:", error)
    }
}

async function saveControllers(controller: Controller) {
    try {
        await fetch(`${props.apiBaseUrl}/api/controller`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                controller: controller,
            }),
        })
    } catch (error) {
        console.error("Error saving controller data:", error)
    }
}

function addNewController() {
    if (isNewControllerFormValid.value) {
        const newCreatedController = {
            ...newController.value,
            endorsment: tempEndorsment.value.join(", "),
            sign: newController.value.sign.toUpperCase(),
            timestamp: dayjs.utc().format(),
        }

        addControllerToDB(newCreatedController)
        emit("controllerAdded", newCreatedController)

        resetForm()
        showNewControllerDialog.value = false
        localShowDialog.value = false
    }
}

function startSession() {
    if (foundController.value) {
        const controllerToAdd = {
            ...foundController.value,
            position: "pause",
            callsign: "pause",
            timestamp: dayjs.utc().format(),
        }

        saveControllers(controllerToAdd)
        emit("controllerAdded", controllerToAdd)

        resetForm()
        localShowDialog.value = false
    }
}

function closeDialog() {
    resetForm()
    localShowDialog.value = false
}

function closeAllDialogs() {
    resetForm()
    showNewControllerDialog.value = false
    localShowDialog.value = false
}

function resetForm() {
    newController.value = {
        name: "",
        sign: "",
        cid: "",
        callsign: "",
        position: "",
        frequency: "",
        rating: "",
        endorsment: "",
        timestamp: dayjs.utc().format(),
    }
    tempEndorsment.value = []
    foundController.value = null
}

// Watch for dialog close to reset form
watch(localShowDialog, (newVal) => {
    if (!newVal) {
        resetForm()
    }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
