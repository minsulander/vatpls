<template>
  <!-- Button to Add New Controller -->
  <v-container fluid class="pa-5">
    <v-btn @click="showNewControllerDialog = true" color="primary" variant="tonal" class="mb-4">
      Ny flygledare
    </v-btn>

    <v-row class="d-flex">
      <!-- Left Column: Position (Active Controllers) -->
      <v-col>
        <h3>Position</h3>
        <VueDraggable
          class="d-flex flex-column gap-2 pa-4 h-100 bg-grey darken-3 overflow-auto"
          v-model="activeControllers"
          animation="150"
          ghostClass="ghost"
          group="tasks"
          @update="onUpdate"
          @add="onAddPosition"
          @remove="onRemove"
        >
          <div
            v-for="controller in activeControllers"
            :key="controller.CID"
            class="cursor-move white-bg lighten-5 mb-2"
            :style="getBorderColor(controller)"
            @dragstart="onDragStart(controller)"
          >
            <v-card-text class="pa-1">
              <v-row no-gutters class="border-row">
                <v-col cols="4" class="border-cell no-border-left no-border-top">
                  <v-tooltip location="top" text="{{ controller.name }}">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">{{ controller.sign }} ({{ controller.CID }})</div>
                    </template>
                    <span>{{ controller.name }}</span>
                  </v-tooltip>
                </v-col>
                <v-col cols="4" class="border-cell no-border-top">
                  {{ controller.position }}
                </v-col>
                <v-col cols="4"
                class="border-cell no-border-right no-border-top"
                :style="controller.timestamp ? getSessionBorder(controller.timestamp) : ' '">
                  {{ formatTimeDifference(controller.timestamp) }}
                </v-col>
              </v-row>

              <v-row no-gutters class="border-row">
                <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                  {{ controller.endorsment === "NIL" ? " " : controller.endorsment }}
                </v-col>
                <v-col cols="6" class="border-cell no-border-right no-border-bottom">
                  {{ controller.callsign }}
                </v-col>
              </v-row>
            </v-card-text>
          </div>
        </VueDraggable>
      </v-col>

      <!-- Middle Column: Paus (Available Controllers) -->
      <v-col>
        <h3>Paus</h3>
        <VueDraggable
          class="d-flex flex-column gap-2 pa-4 h-100 bg-grey darken-3 overflow-auto"
          v-model="controllerNames"
          animation="150"
          ghostClass="ghost"
          group="tasks"
          @update="onUpdate"
          @add="onAddPause"
          @remove="onRemove"
        >
          <div
            v-for="controller in controllerNames"
            :key="controller.CID"
            :style="getBorderColor(controller)"
            class="cursor-move white-bg lighten-5 mb-2"
            @dragstart="onDragStart(controller)"
          >
            <v-card-text class="pa-1">
              <v-row no-gutters class="border-row">
                <v-col cols="4" class="border-cell no-border-left no-border-top">
                  <v-tooltip location="top" text="{{ controller.name }}">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">{{ controller.sign }} ({{ controller.CID }})</div>
                    </template>
                    <span>{{ controller.name }}</span>
                  </v-tooltip>
                </v-col>
                <v-col cols="4" class="border-cell no-border-top">
                  Paus
                </v-col>
                <v-col cols="4" class="border-cell no-border-right no-border-top">
                  {{ formatTimeDifference(controller.timestamp) }}
                </v-col>
              </v-row>

              <v-row no-gutters class="border-row">
                <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                  {{ controller.endorsment === "NIL" ? " " : controller.endorsment }}
                </v-col>
                <v-col cols="6" class="border-cell no-border-right no-border-bottom">&nbsp;</v-col>
              </v-row>
            </v-card-text>
          </div>
        </VueDraggable>
      </v-col>

      <!-- Right Column: Övrig tid (Away Controllers) -->
      <v-col>
        <h3>Övrig tid</h3>
        <VueDraggable
          class="d-flex flex-column gap-2 pa-4 h-100 bg-grey darken-3 overflow-auto"
          v-model="awayControllers"
          animation="150"
          ghostClass="ghost"
          group="tasks"
          @update="onUpdate"
          @add="onAddAway"
          @remove="onRemove"
        >
          <div
            v-for="controller in awayControllers"
            :key="controller.CID"
            :style="getBorderColor(controller)"
            class="cursor-move white-bg lighten-5 mb-2"
            @dragstart="onDragStart(controller)"
          >
            <v-card-text class="pa-1">
              <v-row no-gutters class="border-row">
                <v-col cols="4" class="border-cell no-border-left no-border-top">
                  <v-tooltip location="top" text="{{ controller.name }}">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">{{ controller.sign }} ({{ controller.CID }})</div>
                    </template>
                    <span>{{ controller.name }}</span>
                  </v-tooltip>
                </v-col>
                <v-col cols="4" class="border-cell no-border-top">
                  {{ controller.position || " " }}
                </v-col>
                <v-col cols="4" class="border-cell no-border-right no-border-top">
                  {{ formatTimeDifference(controller.timestamp) }}
                </v-col>
              </v-row>

              <v-row no-gutters class="border-row">
                <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                  {{ controller.endorsment === "NIL" ? " " : controller.endorsment }}
                </v-col>
                <v-col cols="6" class="border-cell no-border-right no-border-bottom">&nbsp;</v-col>
              </v-row>
            </v-card-text>
          </div>
        </VueDraggable>
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

    <!-- Dialog for Pause -->
    <v-dialog v-model="showPauseDialog" max-width="400">
      <v-card>
        <v-card-title>Gå på paus?</v-card-title>
        <v-card-actions>
          <v-btn color="primary" @click="confirmPause">Yes</v-btn>
          <v-btn text @click="cancelAction">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for selection of Position and Callsign -->
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
          <v-btn color="primary" @click="confirmPosition">Save</v-btn>
          <v-btn text @click="cancelAction">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Away Position -->
    <v-dialog v-model="showAwayDialog" max-width="500">
      <v-card>
          <v-card-title>Ange notis</v-card-title>
          <v-card-text>
              <v-text-field v-model="freeTextPositon" label="Notis"></v-text-field>
          </v-card-text>
          <v-card-actions>
              <v-btn color="primary" @click="confirmAway">Save</v-btn>
              <v-btn @click="cancelAction">Cancel</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import moment from "moment"

interface Controller {
  name: string;
  sign: string;
  CID: string;
  callsign: string;
  position?: string;
  frequency: string;
  rating: string;
  endorsment: string;
  timestamp: string;
}

const ratings = [ "S1", "S2", "S3", "C1" ]
const endorsments = [ "NIL", "T2 APS", "T1 TWR", "T1 APP" ]
const positions = [ "GG AD1", "GG AD2", "GG AD3", "SA AD1", "SA AD2", "SA AD3", "SA AD4", "ACC1", "ACC2", "ACC3", "ACC4", "ACC5", "ACC6", "WS", "Ö1", "Ö2" ]

const showNewControllerDialog = ref(false)
const showPositionDialog = ref(false)
const showPauseDialog = ref(false)
const showAwayDialog = ref(false)

const selectedPosition = ref("")
const selectedCallsign = ref("")
const freeTextPositon = ref("")

const activeControllers = ref<Controller[]>([])
const controllerNames = ref<Controller[]>([])
const awayControllers = ref<Controller[]>([])

const backupActiveControllers = ref<Controller[] | null>(null)
const backupControllerNames = ref<Controller[] | null>(null)
const backupAwayControllers = ref<Controller[] | null>(null)
const backupControllers = ref(false)

const selectedController = ref<Controller | null>(null)

const newController = ref({
  name: "",
  sign: "",
  CID: "",
  callsign: "",
  position: "",
  frequency: "",
  rating: "",
  endorsment: "",
  timestamp: new Date().toISOString()
})

async function fetchControllers() {
  try {
    const response = await fetch("http://localhost:3001/api/controllers")
    const data = await response.json()

    activeControllers.value = data.activeControllers || []
    controllerNames.value = data.availableControllers || []
    awayControllers.value = data.awayControllers || []
  } catch(error) {
    console.error("Error fetching controller data:", error)
  }

  sortControllerSessions()
}

async function saveControllers(movedController: Controller) {
  try {
    await fetch("http://localhost:3001/api/controllers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        activeControllers: activeControllers.value,
        availableControllers: controllerNames.value,
        awayControllers: awayControllers.value,
        moved: movedController
      })
    })
  } catch(error) {
    console.error("Error saving controller data:", error)
  }

  sortControllerSessions()
}

function addNewController() {
  controllerNames.value.push({
    ...newController.value,
    timestamp: new Date().toISOString() // Set timestamp on addition
  })

  newController.value = {
    name: "",
    sign: "",
    CID: "",
    callsign: "",
    position: "",
    frequency: "",
    rating: "",
    endorsment: "",
    timestamp: new Date().toISOString()
  }

  showNewControllerDialog.value = false
  saveControllers(controllerNames.value.slice(-1)[0])
}

function formatTimeDifference(timestamp: string) {
  if (!timestamp) return "--:--:--"

  const now = moment()
  const timeDifference = moment.duration(now.diff(moment(timestamp)))

  const hours = String(Math.floor(timeDifference.asHours())).padStart(2, "0")
  const minutes = String(Math.floor(timeDifference.minutes())).padStart(2, "0")
  const seconds = String(Math.floor(timeDifference.seconds())).padStart(2, "0")

  return `${hours}:${minutes}:${seconds}`
}

// TODO: type this correctly? https://developer.mozilla.org/en-US/docs/Web/API/clearInterval#intervalid
let refreshInterval: string | number | NodeJS.Timeout

// Refresh the displayed time every second
function refreshTime() {
  refreshInterval = setInterval(() => {
    activeControllers.value = [ ...activeControllers.value ]
    controllerNames.value = [ ...controllerNames.value ]
    awayControllers.value = [ ...awayControllers.value ]
  }, 1000)
}

function onDragStart(controller: Controller) {
  backupActiveControllers.value = activeControllers.value
  backupControllerNames.value = controllerNames.value
  backupAwayControllers.value = awayControllers.value

  selectedController.value = controller
}

// Fetch data from the server when the component is mounted
onMounted(() => {
  fetchControllers()
  refreshTime()
})

onUnmounted(() => {
  clearInterval(refreshInterval)
})

function onAddPosition() {
  backupControllers.value = true
  showPositionDialog.value = true
}

function confirmPosition() {
  if(selectedController.value) {
    const controller = activeControllers.value.find(controller => controller.CID === selectedController.value?.CID)
    if(controller) {
      controller.position = selectedPosition.value
      controller.callsign = selectedCallsign.value
      controller.timestamp = new Date().toISOString()
    }

    saveControllers(selectedController.value)

    selectedController.value = null
    backupControllers.value = false

    selectedPosition.value = ""
    selectedCallsign.value = ""

    showPositionDialog.value = false
  }
}

function onAddPause() {
  backupControllers.value = true
  showPauseDialog.value = true
}

function confirmPause() {
  if(selectedController.value) {
    const controller = controllerNames.value.find(controller => controller.CID === selectedController.value?.CID)
    if(controller) {
      controller.position = ""
      controller.timestamp = new Date().toISOString()
    }

    saveControllers(selectedController.value)

    showPauseDialog.value = false
    selectedController.value = null
    backupControllers.value = false
  }
}

function onAddAway() {
  backupControllers.value = true
  showAwayDialog.value = true
}

function confirmAway() {
  if(selectedController.value) {
    const controller = awayControllers.value.find(controller => controller.CID === selectedController.value?.CID)
    if(controller) {
      controller.position = freeTextPositon.value
      controller.timestamp = new Date().toISOString()
    }

    saveControllers(selectedController.value)

    backupControllers.value = false
    showAwayDialog.value = false
    selectedController.value = null

    freeTextPositon.value = ""
  }
}

function cancelAction() {
  if(backupControllers.value) {
    activeControllers.value = backupActiveControllers.value!  
    controllerNames.value = backupControllerNames.value!  
    awayControllers.value = backupAwayControllers.value!
  }

  backupControllers.value = false
  selectedController.value = null

  showPauseDialog.value = false
  showPositionDialog.value = false
  showAwayDialog.value = false

  freeTextPositon.value = ""
}

function onRemove() {
  if(backupControllers.value) {
    return
  }

  if(selectedController.value) {
    saveControllers(selectedController.value)
  }
}

function onUpdate() {
  if(selectedController.value) {
    saveControllers(selectedController.value)
  }

  sortControllerSessions()
}

function calculateSessionLength(timestamp: string) {
  const now = moment()
  const start = moment(timestamp)
  return moment.duration(now.diff(start)).asSeconds()
}

function sortControllerSessions() {
  activeControllers.value = [ ...activeControllers.value ].sort((a, b) => calculateSessionLength(a.timestamp) - calculateSessionLength(b.timestamp))
  controllerNames.value = [ ...controllerNames.value ].sort((a, b) => calculateSessionLength(a.timestamp) - calculateSessionLength(b.timestamp))
  awayControllers.value = [ ...awayControllers.value ].sort((a, b) => calculateSessionLength(a.timestamp) - calculateSessionLength(b.timestamp))
}

const getSessionBorder = (sessionLength: string) => {
  const totalMinutes = calculateSessionLength(sessionLength) / 60;

  //Session thresholds
  const longSessionThreshold = 120;
  const mediumSessionThreshold = 90;

  // Background color 
  const longSessionColor = "#CC3300";
  const mediumSessionColor = "#FFCC00";

  // Text color
  const longSessionTextColor = "black";
  const mediumSessionTextColor = "black";

  let bgColor, txtColor;

  if (longSessionThreshold < totalMinutes)  {
    bgColor = longSessionColor;
    txtColor = longSessionTextColor;
  }
  else if (mediumSessionThreshold < totalMinutes) {
     bgColor = mediumSessionColor;
     txtColor = mediumSessionTextColor;
  }

  // If these have not been assigned, style wont be changed.
  if (!bgColor) return "";

  return [ 
    {background: bgColor},
    {color: txtColor},
    {'font-weight': "bold"},
  ];

};

function getBorderColor(ctrl: Controller) {

  let ratingColor;

  switch(ctrl.rating) {
    case "S1":
      ratingColor = "red"
      break
    case "S2":
      ratingColor = "blue"
      break
    case "S3":
      ratingColor = "green"
      break
    case "C1":
      ratingColor = "yellow"
      break
    default:
      ratingColor = "grey"
  }

  return { "--v-border-color": ratingColor, borderLeft: "10px solid var(--v-border-color)" }
}
</script>

<style scoped>
  .ghost {
    opacity: 50%;
  }

  .bg-grey {
    background-color: #AAA !important;
  }

  .white-bg {
    background-color: #ECECEC;
    color: #000;
  }

  .border-row {
    margin: 0;
  }

  .border-cell {
    border: 0.5px solid #BBBBBB;
    text-align: center;
    padding: 3px !important;
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
</style>
