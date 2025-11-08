<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px">
        <v-card>
            <v-card-title class="text-h5">Edit Controller Information</v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <v-select
                                v-model="localController.cid"
                                label="Select Controller"
                                :items="controllerItems"
                                item-title="display"
                                item-value="cid"
                                variant="outlined"
                                density="compact"
                                @update:model-value="onControllerSelect"
                            ></v-select>
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="localController.name" label="Name" variant="outlined" density="compact"></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-text-field
                                v-model="localController.sign"
                                label="Sign/Initials"
                                variant="outlined"
                                density="compact"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-select
                                v-model="localController.rating"
                                label="Rating"
                                :items="ratings"
                                variant="outlined"
                                density="compact"
                            ></v-select>
                        </v-col>
                        <v-col cols="12">
                            <v-select
                                v-model="localController.endorsements"
                                label="Endorsements"
                                :items="availableEndorsements"
                                variant="outlined"
                                density="compact"
                                multiple
                                chips
                                closable-chips
                            ></v-select>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
                <v-btn color="primary" variant="text" @click="handleSave">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"

interface Controller {
    cid: string
    name: string
    sign: string
    rating: string
    endorsements?: string[]
}

const props = defineProps<{
    modelValue: boolean
    controller?: Controller | null
}>()

const emit = defineEmits<{
    "update:modelValue": [value: boolean]
    confirm: [controller: Controller]
}>()

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
const ratings = ["OBS", "S1", "S2", "S3", "C1", "C3", "I1", "I3"]
const availableEndorsements = ["T1 APP", "T2 APS", "T1 TWR", "SOLO GG TWR", "SOLO GG APP"]
const allControllers = ref<Controller[]>([])

const localController = ref<Controller>({
    cid: "",
    name: "",
    sign: "",
    rating: "S1",
    endorsements: [],
})

const controllerItems = computed(() => {
    return allControllers.value.map((ctrl) => ({
        cid: ctrl.cid,
        display: ctrl.name ? `${ctrl.name} (${ctrl.cid})` : ctrl.cid,
    }))
})

async function fetchControllers() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/controller/saved`)
        const data = await response.json()
        if (data.Controllers) {
            allControllers.value = data.Controllers.map((ctrl: any) => ({
                cid: ctrl.cid,
                name: ctrl.name || "",
                sign: ctrl.sign || "",
                rating: ctrl.rating || "S1",
                endorsements: Array.isArray(ctrl.endorsements) ? ctrl.endorsements.filter((e: string) => e && e !== "NIL") : [],
            }))
        }
    } catch (err) {
        console.error("Error fetching controllers:", err)
    }
}

onMounted(() => {
    fetchControllers()
})

watch(
    () => props.controller,
    (newController) => {
        if (newController) {
            localController.value = { ...newController }
        } else {
            localController.value = {
                cid: "",
                name: "",
                sign: "",
                rating: "S1",
                endorsements: [],
            }
        }
    },
    { immediate: true }
)

function onControllerSelect(cid: string) {
    const selected = allControllers.value.find((ctrl) => ctrl.cid === cid)
    if (selected) {
        localController.value = {
            cid: selected.cid,
            name: selected.name,
            sign: selected.sign,
            rating: selected.rating,
            endorsements: selected.endorsements ? [...selected.endorsements] : [],
        }
    }
}

function handleSave() {
    emit("confirm", localController.value)
    emit("update:modelValue", false)
}
</script>
