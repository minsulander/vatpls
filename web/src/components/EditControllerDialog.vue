<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="920px" scrollable>
        <v-card class="edit-controller-dialog">
            <v-card-title class="pb-1">Edit controller</v-card-title>
            <v-card-subtitle class="pb-4">Select a controller, then update their information.</v-card-subtitle>

            <v-divider />

            <v-card-text class="pa-0">
                <div class="dialog-content">
                    <section class="controller-picker">
                        <div class="picker-search">
                            <v-text-field
                                v-model="search"
                                label="Search controllers"
                                prepend-inner-icon="mdi-magnify"
                                variant="outlined"
                                density="compact"
                                clearable
                                hide-details
                            />
                        </div>

                        <div v-if="loading" class="picker-state">
                            <v-progress-circular indeterminate color="primary" size="28" />
                            <span>Loading controllers…</span>
                        </div>

                        <div v-else-if="loadError" class="picker-state text-error">
                            <v-icon icon="mdi-alert-circle-outline" />
                            <span>{{ loadError }}</span>
                            <v-btn size="small" variant="text" color="primary" @click="fetchControllers">Retry</v-btn>
                        </div>

                        <v-list v-else class="controller-list" nav density="compact">
                            <template v-for="group in controllerGroups" :key="group.rating">
                                <template v-if="group.controllers.length">
                                    <v-list-subheader
                                        class="rating-header"
                                        role="button"
                                        tabindex="0"
                                        :aria-expanded="!isRatingCollapsed(group.rating)"
                                        @click="toggleRating(group.rating)"
                                        @keydown.enter.prevent="toggleRating(group.rating)"
                                        @keydown.space.prevent="toggleRating(group.rating)"
                                    >
                                        <div class="rating-header-content">
                                            <v-icon
                                                class="mr-1"
                                                :icon="isRatingCollapsed(group.rating) ? 'mdi-chevron-right' : 'mdi-chevron-down'"
                                                size="small"
                                            />
                                            <span>{{ group.rating }}</span>
                                            <v-chip class="ml-2" size="x-small" variant="tonal">{{ group.controllers.length }}</v-chip>
                                        </div>
                                    </v-list-subheader>

                                    <template v-if="!isRatingCollapsed(group.rating)">
                                        <v-list-item
                                            v-for="controllerItem in group.controllers"
                                            :key="controllerItem.cid"
                                            :active="localController.cid === controllerItem.cid"
                                            color="primary"
                                            rounded="lg"
                                            @click="onControllerSelect(controllerItem.cid)"
                                        >
                                            <v-list-item-title class="controller-summary">
                                                <span class="controller-name">{{ controllerItem.name || controllerItem.cid }}</span>
                                                <span class="controller-meta">
                                                    <template v-if="controllerItem.sign">{{ controllerItem.sign }} · </template
                                                    >{{ controllerItem.cid }}
                                                </span>
                                            </v-list-item-title>
                                            <template #append>
                                                <v-chip size="x-small" label :color="ratingColor(controllerItem.rating)" variant="tonal">
                                                    {{ controllerItem.rating }}
                                                </v-chip>
                                            </template>
                                        </v-list-item>
                                    </template>
                                </template>
                            </template>

                            <div v-if="controllerGroups.every((group) => group.controllers.length === 0)" class="picker-state">
                                <v-icon icon="mdi-account-search-outline" />
                                <span>No controllers found</span>
                            </div>
                        </v-list>
                    </section>

                    <section class="controller-editor">
                        <div v-if="!localController.cid" class="editor-placeholder">
                            <v-icon icon="mdi-account-edit-outline" size="42" />
                            <p class="text-subtitle-1 font-weight-medium">Select a controller to edit</p>
                            <p class="text-body-2 text-medium-emphasis">Controller details will appear here.</p>
                        </div>

                        <v-form v-else @submit.prevent="handleSave">
                            <div class="editor-heading mb-5">
                                <div>
                                    <p class="text-h6">{{ localController.name || localController.cid }}</p>
                                    <p class="text-body-2 text-medium-emphasis">CID {{ localController.cid }}</p>
                                </div>
                                <v-chip label :color="ratingColor(localController.rating)" variant="tonal">
                                    {{ localController.rating }}
                                </v-chip>
                            </div>

                            <v-text-field v-model="localController.name" label="Name" variant="outlined" density="compact" />
                            <v-text-field v-model="localController.sign" label="Sign/Initials" variant="outlined" density="compact" />
                            <v-select
                                v-model="localController.rating"
                                label="Rating"
                                :items="ratings"
                                variant="outlined"
                                density="compact"
                            />
                            <v-select
                                v-model="localController.endorsements"
                                label="Endorsements"
                                :items="availableEndorsements"
                                variant="outlined"
                                density="compact"
                                multiple
                                chips
                                closable-chips
                            />
                        </v-form>
                    </section>
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="px-5 py-3">
                <v-spacer />
                <v-btn color="grey" variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :disabled="!localController.cid" @click="handleSave">Save changes</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

interface Controller {
    cid: string
    name: string
    sign: string
    rating: string
    endorsements?: string[]
}

interface ControllerGroup {
    rating: string
    controllers: Controller[]
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
const ratings = ["S1", "S2", "S3", "C1"]
const ratingOrder = ["C1", "S3", "S2", "S1", "Other"]
const availableEndorsements = ["T1 APP", "T2 APS", "T1 TWR", "SOLO GG TWR", "SOLO GG APP", "SOLO MM"]
const allControllers = ref<Controller[]>([])
const search = ref("")
const loading = ref(false)
const loadError = ref("")
const collapsedRatings = ref(new Set<string>())

const emptyController = (): Controller => ({
    cid: "",
    name: "",
    sign: "",
    rating: "S1",
    endorsements: [],
})

const localController = ref<Controller>(emptyController())

function ratingGroup(rating: string) {
    if (["C1", "C3", "I1", "I3"].includes(rating)) return "C1"
    if (["S3", "S2", "S1"].includes(rating)) return rating
    return "Other"
}

const controllerGroups = computed<ControllerGroup[]>(() => {
    const normalizedSearch = search.value.trim().toLocaleLowerCase()
    const filteredControllers = allControllers.value.filter((controller) => {
        if (!normalizedSearch) return true

        return [controller.name, controller.cid, controller.sign, controller.rating].some((value) =>
            value.toLocaleLowerCase().includes(normalizedSearch),
        )
    })

    return ratingOrder.map((rating) => ({
        rating,
        controllers: filteredControllers
            .filter((controller) => ratingGroup(controller.rating) === rating)
            .sort((a, b) => a.name.localeCompare(b.name, "sv", { sensitivity: "base" }) || a.cid.localeCompare(b.cid)),
    }))
})

function ratingColor(rating: string) {
    const colors: Record<string, string> = {
        C1: "yellow",
        C3: "yellow",
        I1: "yellow",
        I3: "yellow",
        S3: "red",
        S2: "blue",
        S1: "green",
    }

    return colors[rating] || "grey-lighten-1"
}

function isRatingCollapsed(rating: string) {
    return collapsedRatings.value.has(rating)
}

function toggleRating(rating: string) {
    const nextCollapsedRatings = new Set(collapsedRatings.value)

    if (nextCollapsedRatings.has(rating)) {
        nextCollapsedRatings.delete(rating)
    } else {
        nextCollapsedRatings.add(rating)
    }

    collapsedRatings.value = nextCollapsedRatings
}

async function fetchControllers() {
    loading.value = true
    loadError.value = ""

    try {
        const response = await fetch(`${apiBaseUrl}/api/controller/saved`)
        if (!response.ok) throw new Error("Could not load controllers")

        const data = await response.json()
        allControllers.value = (data.Controllers || []).map((controller: Partial<Controller>) => ({
            cid: controller.cid || "",
            name: controller.name || "",
            sign: controller.sign || "",
            rating: controller.rating || "S1",
            endorsements: Array.isArray(controller.endorsements)
                ? controller.endorsements.filter((endorsement) => endorsement && endorsement !== "NIL")
                : [],
        }))
    } catch (error) {
        console.error("Error fetching controllers:", error)
        loadError.value = error instanceof Error ? error.message : "Could not load controllers"
    } finally {
        loading.value = false
    }
}

function onControllerSelect(cid: string) {
    const selected = allControllers.value.find((controller) => controller.cid === cid)
    if (!selected) return

    localController.value = {
        ...selected,
        endorsements: selected.endorsements ? [...selected.endorsements] : [],
    }
}

watch(
    () => props.modelValue,
    async (isOpen) => {
        if (!isOpen) return

        search.value = ""
        localController.value = emptyController()
        await fetchControllers()

        if (props.controller) onControllerSelect(props.controller.cid)
    },
    { immediate: true },
)

watch(
    () => props.controller,
    (controller) => {
        if (props.modelValue && controller) onControllerSelect(controller.cid)
    },
)

function handleSave() {
    if (!localController.value.cid) return

    emit("confirm", {
        ...localController.value,
        endorsements: localController.value.endorsements ? [...localController.value.endorsements] : [],
    })
    emit("update:modelValue", false)
}
</script>

<style scoped>
.edit-controller-dialog {
    height: 75vh;
    min-height: 75vh;
    flex: none;
}

.edit-controller-dialog > .v-card-text {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
}

.dialog-content {
    display: grid;
    grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr);
    height: 100%;
    min-height: 0;
}

.controller-picker {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: rgba(var(--v-theme-on-surface), 0.025);
}

.picker-search {
    padding: 12px;
}

.controller-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 6px 10px;
    background: transparent;
}

.rating-header {
    min-height: 30px;
    padding-inline: 10px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
}

.rating-header:hover,
.rating-header:focus-visible {
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.rating-header-content {
    display: flex;
    width: 100%;
    align-items: center;
}

.controller-list :deep(.v-list-item) {
    min-height: 36px;
    padding-inline: 10px;
}

.controller-list :deep(.v-list-item__append) {
    margin-inline-start: 8px;
}

.controller-summary {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    font-size: 0.875rem;
}

.controller-name {
    overflow: hidden;
    text-overflow: ellipsis;
}

.controller-meta {
    flex-shrink: 0;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 0.75rem;
    font-weight: 400;
}

.picker-state,
.editor-placeholder {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 180px;
    padding: 24px;
    text-align: center;
}

.controller-editor {
    min-width: 0;
    overflow-y: auto;
    padding: 24px;
}

.editor-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

@media (max-width: 700px) {
    .edit-controller-dialog {
        height: 820px;
        min-height: min(820px, 92vh);
        max-height: 92vh;
    }

    .dialog-content {
        display: block;
        overflow-y: auto;
    }

    .controller-picker {
        height: 330px;
        border-right: 0;
        border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    .controller-editor {
        overflow: visible;
    }
}
</style>
