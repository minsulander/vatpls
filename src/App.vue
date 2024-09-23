<template>
  <v-container>
    <!-- Button to Add New Controller -->
    <v-btn @click="showNewControllerDialog = true" color="primary" variant="tonal" class="mb-4">Ny flygledare</v-btn>

    <v-row>
      <!-- Left Column: Position (Active Controllers) -->
      <v-col cols="12" sm="4" @drop="onDropToPosition" @dragover.prevent>
        <h1>Position</h1>
        <v-col v-for="controller in activeControllers" :key="controller.CID" cols="12">
          <v-card
            class="border-card"
            :style="getBorderColor(controller.rating)"
            draggable="true"
            @dragstart="onDragStart(controller, 'position')"
          >
            <v-card-text>
              <v-row>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-col cols="3" v-bind="attrs" v-on="on">{{ controller.sign }}</v-col>
                  </template>
                  <span>{{ controller.name }}</span>
                </v-tooltip>
                <v-col cols="3">{{ controller.position }}</v-col>
                <v-col cols="3">{{ formatTimeDifference(controller.timestamp) }}</v-col>
              </v-row>
              <v-row>
                <v-col cols="6">{{ controller.endorsment === 'NIL' ? ' ' : controller.endorsment }}</v-col>
                <v-col cols="6">{{ controller.callsign }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>

      <!-- Middle Column: Paus (Available Controllers) -->
      <v-col cols="12" sm="4" @drop="onDropToPaus" @dragover.prevent>
        <h1>Paus</h1>
        <v-col v-for="controller in controllerNames" :key="controller.CID" cols="12">
          <v-card
            class="border-card"
            :style="getBorderColor(controller.rating)"
            draggable="true"
            @dragstart="onDragStart(controller, 'paus')"
          >
            <v-card-text>
              <v-row>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-col cols="4" v-bind="attrs" v-on="on">{{ controller.sign }}</v-col>
                  </template>
                  <span>{{ controller.name }}</span>
                </v-tooltip>
                <v-col cols="4">Paus</v-col>
                <v-col cols="4">{{ formatTimeDifference(controller.timestamp) }}</v-col>
              </v-row>
              <v-row>
                <v-col cols="12">{{ controller.endorsment === 'NIL' ? ' ' : controller.endorsment }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>

      <!-- Right Column: Övrig tid (Away Controllers) -->
      <v-col cols="12" sm="4" @drop="onDropToAway" @dragover.prevent>
        <h1>Övrig tid</h1>
        <v-col v-for="controller in awayControllers" :key="controller.CID" cols="12">
          <v-card
            class="border-card"
            :style="getBorderColor(controller.rating)"
            draggable="true"
            @dragstart="onDragStart(controller, 'away')"
          >
            <v-card-text>
              <v-row>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-col cols="4" v-bind="attrs" v-on="on">{{ controller.sign }}</v-col>
                  </template>
                  <span>{{ controller.name }}</span>
                </v-tooltip>
                <v-col cols="4">{{ controller.position }}</v-col>
                <v-col cols="4">{{ formatTimeDifference(controller.timestamp) }}</v-col>
              </v-row>
              <v-row>
                <v-col cols="12">{{ controller.callsign }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>
    </v-row>

    <!-- Dialog for Adding a New Controller -->
    <v-dialog v-model="showNewControllerDialog" max-width="500">
      <v-card>
        <v-card-title>Lägg till ny flygledare</v-card-title>
        <v-card-text>
          <v-form ref="newControllerForm">
            <v-text-field v-model="newController.name" label="Full Name"></v-text-field>
            <v-text-field v-model="newController.sign" label="Sign (2 letters)"></v-text-field>
            <v-text-field v-model="newController.CID" label="CID"></v-text-field>
            <v-select v-model="newController.rating" :items="ratings" label="Rating"></v-select>
            <v-select v-model="newController.endorsment" :items="endorsments" label="Endorsment"></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="addNewController">Add</v-btn>
          <v-btn text @click="showNewControllerDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Paus Column -->
    <v-dialog v-model="showPausDialog" max-width="400">
      <v-card>
        <v-card-title>Gå på paus?</v-card-title>
        <v-card-actions>
          <v-btn color="primary" @click="confirmPaus">Yes</v-btn>
          <v-btn text @click="cancelAction">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Övrig Tid Column (Free Text Input) -->
    <v-dialog v-model="showAwayDialog" max-width="500">
      <v-card>
        <v-card-title>Ange notis</v-card-title>
        <v-card-text>
          <v-text-field v-model="freeTextPosition" label="Position"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="confirmAwayPosition">Save</v-btn>
          <v-btn text @click="cancelAction">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Position and Callsign Selection -->
    <v-dialog v-model="showPositionDialog" max-width="500">
      <v-card>
        <v-card-title>Set Position and Callsign</v-card-title>
        <v-card-text>
          <v-form ref="positionForm">
            <v-select v-model="selectedPosition" :items="positions" label="Position"></v-select>
            <v-text-field v-model="selectedCallsign" label="Callsign"></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="savePositionSelection">Save</v-btn>
          <v-btn text @click="cancelAction">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import moment from 'moment'

// Columns for controllers
const controllerNames = ref([])
const activeControllers = ref([])
const awayControllers = ref([])
const showNewControllerDialog = ref(false)
const showPositionDialog = ref(false)
const showPausDialog = ref(false)
const showAwayDialog = ref(false)
const newController = ref({
  name: '',
  sign: '',
  CID: '',
  callsign: '',
  frequency: '',
  rating: '',
  endorsment: '',
  timestamp: new Date().toISOString() // Single timestamp
})
const ratings = ['S1', 'S2', 'S3', 'C1']
const endorsments = ['T2 APS', 'T1 TWR', 'T1 APP', 'NIL']
const selectedPosition = ref('')
const selectedCallsign = ref('')
const freeTextPosition = ref('') // Free text input for Övrig Tid
const selectedController = ref(null)
let originalSource = '' // Track where the controller was dragged from
let originalController = null // Track the original controller
const positions = ['Ground', 'Tower', 'Approach', 'Center']

// Fetch controller data from the server
async function fetchControllers() {
  try {
    const response = await fetch('http://localhost:3001/api/controllers')
    const data = await response.json()
    activeControllers.value = data.activeControllers || []
    controllerNames.value = data.availableControllers || []
    awayControllers.value = data.awayControllers || []
  } catch (error) {
    console.error('Error fetching controller data:', error)
  }
}

// Save controller data to the server
async function saveControllers() {
  try {
    await fetch('http://localhost:3001/api/controllers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activeControllers: activeControllers.value,
        availableControllers: controllerNames.value,
        awayControllers: awayControllers.value,
      }),
    })
  } catch (error) {
    console.error('Error saving controller data:', error)
  }
}

// Add a new controller to the available controllers
function addNewController() {
  controllerNames.value.push({
    ...newController.value,
    timestamp: new Date().toISOString() // Set timestamp on addition
  })

  newController.value = {
    name: '',
    sign: '',
    CID: '',
    callsign: '',
    frequency: '',
    rating: '',
    endorsment: '',
    timestamp: new Date().toISOString()
  }

  showNewControllerDialog.value = false
  saveControllers()
}

// Handle drag start event
function onDragStart(controller, source) {
  originalSource = source // Track the source
  originalController = { ...controller } // Store a copy of the original controller
  event.dataTransfer.setData('controller', JSON.stringify({ controller, source }))
}

// Handle drop to Position column and open dialog
function onDropToPosition(event) {
  const { controller, source } = JSON.parse(event.dataTransfer.getData('controller'))

  removeFromColumn(controller, source)

  selectedController.value = controller
  showPositionDialog.value = true
}

// Handle drop to Paus column and open dialog
function onDropToPaus(event) {
  const { controller, source } = JSON.parse(event.dataTransfer.getData('controller'))

  removeFromColumn(controller, source)
  
  selectedController.value = controller
  showPausDialog.value = true // Show paus confirmation dialog
}

// Handle drop to Övrig Tid column and open dialog
function onDropToAway(event) {
  const { controller, source } = JSON.parse(event.dataTransfer.getData('controller'))

  removeFromColumn(controller, source)

  selectedController.value = controller
  showAwayDialog.value = true // Show free text input dialog for Övrig Tid
}

// Confirm moving to Paus column
function confirmPaus() {
  selectedController.value.timestamp = new Date().toISOString() // Reset timestamp
  controllerNames.value.push(selectedController.value)
  showPausDialog.value = false
  saveControllers()
}

// Confirm moving to Övrig Tid column with free text
function confirmAwayPosition() {
  selectedController.value.position = freeTextPosition.value // Set free text position
  selectedController.value.timestamp = new Date().toISOString() // Reset timestamp
  awayControllers.value.push(selectedController.value)
  showAwayDialog.value = false
  saveControllers()
}

// Cancel action and revert the card to its original column
function cancelAction() {
  // Revert the card to its original column
  if (originalSource === 'position') {
    activeControllers.value.push(originalController)
  } else if (originalSource === 'paus') {
    controllerNames.value.push(originalController)
  } else if (originalSource === 'away') {
    awayControllers.value.push(originalController)
  }

  // Hide all dialogs
  showPositionDialog.value = false
  showPausDialog.value = false
  showAwayDialog.value = false
}

// Save position and callsign selected in the dialog
function savePositionSelection() {
  if (selectedController.value) {
    selectedController.value.position = selectedPosition.value
    selectedController.value.callsign = selectedCallsign.value
    selectedController.value.timestamp = new Date().toISOString() // Reset timestamp

    activeControllers.value.push(selectedController.value)

    showPositionDialog.value = false
    saveControllers()
  }
}

// Remove the controller from its original column
function removeFromColumn(controller, source) {
  if (source === 'position') {
    activeControllers.value = activeControllers.value.filter(c => c.CID !== controller.CID)
  } else if (source === 'paus') {
    controllerNames.value = controllerNames.value.filter(c => c.CID !== controller.CID)
  } else if (source === 'away') {
    awayControllers.value = awayControllers.value.filter(c => c.CID !== controller.CID)
  }
}

// Dynamically assign the border color using CSS variables
function getBorderColor(rating) {
  let color;
  switch (rating) {
    case 'S1':
      color = 'red';
      break;
    case 'S2':
      color = 'blue';
      break;
    case 'S3':
      color = 'green';
      break;
    case 'C1':
      color = 'yellow';
      break;
    default:
      color = 'grey';
  }
  return { '--v-border-color': color, border: '4px solid var(--v-border-color)' };
}

// Compute the time difference between now and a given timestamp
function formatTimeDifference(timestamp) {
  if (!timestamp) return '--:--:--'
  const now = moment()
  const timeDiff = moment.duration(now.diff(moment(timestamp)))
  const hours = String(Math.floor(timeDiff.asHours())).padStart(2, '0')
  const minutes = String(Math.floor(timeDiff.minutes())).padStart(2, '0')
  const seconds = String(Math.floor(timeDiff.seconds())).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// Refresh the displayed time every second
function refreshTime() {
  setInterval(() => {
    activeControllers.value = [...activeControllers.value]
    controllerNames.value = [...controllerNames.value]
    awayControllers.value = [...awayControllers.value]
  }, 1000)
}

// Fetch data from the server when the component is mounted
onMounted(() => {
  fetchControllers()
  refreshTime()
})

onUnmounted(() => {
  clearInterval(refreshTime)
})
</script>

<style scoped>
.border-card {
  border-radius: 8px;
}
</style>
