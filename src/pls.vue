<template>
    <div v-if="!authorized">
        <h3> Please login </h3>
        <v-text-field
            v-model="password"
            label="Password"
            type="password"
            outlined
            clearable
            @keyup.enter="toggleAuthorization" />
        <v-btn @click="toggleAuthorization" color="primary" type="button">Authorize</v-btn>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>


    <v-container fluid class="pa-5 d-flex flex-column" style="height: 100vh;">
      <!-- Button to Add or Remove Controller -->
      <div class="d-flex flex-row ga-3 mb-3 justify-end">
        <v-btn @click="showControllerDialog = isAuthorized()" color="primary" variant="tonal">
          Start shift
        </v-btn>
        <v-btn @click="showDeleteControllerDialog = isAuthorized()" color="error" variant="tonal">
          End shift
        </v-btn>
      </div>

      <v-row class="d-flex flex-grow-1">
        <!-- Left Column: Position (Active Controllers) -->
        <v-col class="d-flex flex-column">
          <h2>Active</h2>
          <VueDraggable
            class="d-flex flex-column gap-2 pa-4 flex-grow-1 bg-grey darken-3 overflow-auto"
            v-model="activeControllers"
            :animation="100"
            ghostClass="ghost"
            group="tasks"
            :disabled="!authorized"
            @update="onUpdate"
            @add="onAddPosition"
            @remove="onRemove"
          >
            <div
              v-for="controller in activeControllers"
              :key="controller.cid"
              class="cursor-move white-bg lighten-5 mb-2 position-relative"
              :class="{ 'online-card': controller.position?.toLowerCase() === 'online'}"
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
                    {{ controller.position }}
                  </v-col>
                  <v-col cols="2"
                  class="border-cell no-border-right no-border-top"
                  :style="controller.timestamp ? getSessionBorder(controller.timestamp) : ' '">
                    {{ formatTimeDifference(controller.timestamp) }}
                  </v-col>
                </v-row>

                <v-row no-gutters class="border-row">
                  <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                    {{ controller.endorsment === "NIL" ? " " : parseEndorsment(controller.endorsment, controller.rating) }}
                  </v-col>
                  <v-col cols="6" class="border-cell no-border-right no-border-bottom">
                    {{ controller.callsign.length > 0 ? controller.callsign : "&nbsp;" }} &nbsp;
                  </v-col>
                </v-row>
              </v-card-text>
            </div>
          </VueDraggable>
        </v-col>

        <!-- Middle Column: Paus (Available Controllers) -->
        <v-col class="d-flex flex-column">
          <h2>Break</h2>
          <VueDraggable
            class="d-flex flex-column gap-2 pa-4 flex-grow-1 bg-grey darken-3 overflow-auto"
            v-model="controllerNames"
            :animation="100"
            ghostClass="ghost"
            group="tasks"
            :disabled="!authorized"
            @update="onUpdate"
            @add="onAddPause"
            @remove="onRemove"
          >
            <div
              v-for="controller in controllerNames"
              :key="controller.cid"
              :style="getBorderColor(controller)"
              class="cursor-move white-bg lighten-5 mb-2 position-relative"
              @dragstart="onDragStart(controller)"
            >
              <div class="controller-rating" :style="getBorderTextColor(controller)">{{ controller.rating }}</div>
              <v-card-text class="pa-1">
                <v-row no-gutters class="border-row">
                  <v-col cols="6" class="border-cell no-border-left no-border-top">
                    {{ controller.name }} ({{ controller.cid }})
                  </v-col>
                  <v-col cols="4" class="border-cell no-border-top">
                    Paus
                  </v-col>
                  <v-col cols="2" class="border-cell no-border-right no-border-top">
                    {{ formatTimeDifference(controller.timestamp) }}
                  </v-col>
                </v-row>

                <v-row no-gutters class="border-row">
                  <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                    {{ controller.endorsment === "NIL" ? " " : parseEndorsment(controller.endorsment, controller.rating) }}
                  </v-col>
                  <v-col cols="6" class="border-cell no-border-right no-border-bottom">&nbsp;</v-col>
                </v-row>
              </v-card-text>
            </div>
          </VueDraggable>
        </v-col>

        <!-- Right Column: Övrig tid (Away Controllers) -->
        <v-col class="d-flex flex-column">
          <h2>Other</h2>
          <VueDraggable
            class="d-flex flex-column gap-2 pa-4 flex-grow-1 bg-grey darken-3 overflow-auto"
            v-model="awayControllers"
            :animation="100"
            ghostClass="ghost"
            group="tasks"
            :disabled="!authorized"
            @update="onUpdate"
            @add="onAddAway"
            @remove="onRemove"
          >
            <div
              v-for="controller in awayControllers"
              :key="controller.cid"
              :style="getBorderColor(controller)"
              class="cursor-move white-bg lighten-5 mb-2 position-relative"
              @dragstart="onDragStart(controller)"
            >
              <div class="controller-rating" :style="getBorderTextColor(controller)">{{ controller.rating }}</div>
              <v-card-text class="pa-1">
                <v-row no-gutters class="border-row">
                  <v-col cols="6" class="border-cell no-border-left no-border-top">
                    {{ controller.name }} ({{ controller.cid }})
                  </v-col>
                  <v-col cols="4" class="border-cell no-border-top">
                    {{ "&nbsp;" }}
                  </v-col>
                  <v-col cols="2" class="border-cell no-border-right no-border-top">
                    {{ formatTimeDifference(controller.timestamp) }}
                  </v-col>
                </v-row>

                <v-row no-gutters class="border-row">
                  <v-col cols="6" class="border-cell no-border-left no-border-bottom">
                    {{ controller.endorsment === "NIL" ? " " : parseEndorsment(controller.endorsment, controller.rating) }}
                  </v-col>
                  <v-col cols="6" class="border-cell no-border-right no-border-bottom">
                    {{ controller.callsign ||  "other" }} &nbsp
                  </v-col>
                </v-row>
              </v-card-text>
            </div>
          </VueDraggable>
        </v-col>
      </v-row>

      <v-dialog v-model="showControllerDialog" max-width="500">
        <v-card>
          <v-card-title>Start shift</v-card-title>
          <v-card-text>
            <v-form ref="controllerForm">
              <v-text-field v-model="newController.cid" label="CID" autofocus></v-text-field>
              <p v-if="controllerMatch()" class="ml-4">{{ isActiveController(newController) ? "Controller is already active" : foundController?.name + " found" }}</p>
              <p v-else-if="newController.cid.length > 0" class="ml-4">Incorrect CID</p>
              <v-card-actions>
                <v-btn v-if="controllerMatch() && !isActiveController(newController)" color="primary" @click="startSession">Start shift</v-btn>
                <v-btn v-if="!controllerMatch() && !isActiveController(newController)" color="primary" @click="showNewControllerDialog = true">New controller</v-btn>
                <v-btn variant="text" @click="showControllerDialog = false, newController.cid = ''">Cancel</v-btn>
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
            <v-btn
              color="primary"
              @click="addNewController"
              :disabled="!isNewControllerFormValid"
            >Add</v-btn>
            <v-btn variant="text" @click="showNewControllerDialog = false, showControllerDialog = false, newController.cid = ''">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog for Removing an Existing Controller -->
      <v-dialog v-model="showDeleteControllerDialog" max-width="500">
        <v-card>
          <v-card-title>End shift</v-card-title>
          <v-card-text>
            <v-form ref="removeControllerForm">
              <v-text-field v-model="newController.cid" label="CID" autofocus></v-text-field>
              <p v-if="controllerMatchLogoff()" class="ml-4">{{ foundController?.name }} found</p>
              <p v-else-if="newController.cid.length > 0" class="ml-4">Incorrect CID</p>
              <v-card-actions>
                <v-btn v-if="controllerMatchLogoff()" color="error" @click="stopSession">End shift</v-btn>
                <v-btn variant="text" @click="showDeleteControllerDialog = false, newController.cid = ''">Cancel</v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Dialog for Pause -->
      <v-dialog v-model="showPauseDialog" max-width="400">
        <v-card>
          <v-card-title>Go on break</v-card-title>
          <v-card-actions>
            <v-btn color="primary" @click="confirmPause">Confirm</v-btn>
            <v-btn variant="text" @click="cancelAction">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog for selection of Position and Callsign -->
      <v-dialog v-model="showPositionDialog" max-width="500">
        <v-card class="position-dialog-card">
          <v-card-title>Go on position</v-card-title>
          <v-card-text class="position-dialog-content">
            <v-form ref="positionForm" class="position-form">
              <v-text-field
                v-model="selectedPosition"
                label="Position"
                @input="updatePositionSelection"
                clearable
                @click:clear="clearPosition"
              ></v-text-field>

              <v-list class="position-list" ref="positionList">
                <template v-for="(group, index) in positionGroups" :key="index">
                  <v-list-subheader>{{ group.name }}</v-list-subheader>
                  <v-list-item
                    v-for="position in group.positions"
                    :key="position"
                    :title="position"
                    @click="selectedPosition = position"
                    :active="selectedPosition.toLowerCase() === position.toLowerCase()"
                    :ref="(el: any) => { if (position.toLowerCase() === selectedPosition.toLowerCase()) matchingItemRef = el }"
                  ></v-list-item>
                  <v-divider v-if="index < positionGroups.length - 1"></v-divider>
                </template>
              </v-list>

              <v-text-field v-model="selectedCallsign" label="Callsign (if not implied by position)" class="mt-4"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              @click="confirmPosition"
              :disabled="!isValidPosition"
            >
              Confirm
            </v-btn>
            <v-btn variant="text" @click="cancelAction">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog for Away Position -->
      <v-dialog v-model="showAwayDialog" max-width="500">
        <v-card>
            <v-card-title>Go on other (not break/position)</v-card-title>
            <v-card-text>
              <v-text-field v-model="freeTextPositon" label="Note"></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="confirmAway">Confirm</v-btn>
              <v-btn @click="cancelAction">Cancel</v-btn>
            </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, nextTick, watch, Ref } from "vue"
  import { VueDraggable } from "vue-draggable-plus"
  import moment from "moment"


  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"

  interface Controller {
    name: string;
    sign: string;
    cid: string;
    callsign: string;
    position?: string;
    frequency: string;
    rating: string;
    endorsment: string;
    timestamp: string;
  }

  const ratings = [ "S1", "S2", "S3", "C1" ]
  const endorsments = ["NIL", "T2 APS", "T1 TWR", "T1 APP"]
  const positions = [ "Online", "GG APP", "GG TWR", "GG GND", "GG DEL", "SA TWR", "SA GND", "SA DEL", "SA AD+", "ACC1", "ACC2", "ACC3", "ACC4", "ACC5", "ACC6", "APP1", "APP2", "APP3", "WS", "Ö1", "Ö2" ]

  const positionGroups = ref([
    {
      name: "ACC",
      positions: positions.filter(p => p.startsWith("ACC"))
    },
    {
      name: "APP",
      positions: positions.filter(p => p.startsWith("APP"))
    },
    {
      name: "GG",
      positions: positions.filter(p => p.startsWith("GG"))
    },
    {
      name: "SA",
      positions: positions.filter(p => p.startsWith("SA"))
    },
    {
      name: "Other",
      positions: ["Online", "Ö1", "Ö2", "WS"]
    }
  ]);

  const showControllerDialog = ref(false)
  const showNewControllerDialog = ref(false)
  const showDeleteControllerDialog = ref(false)
  const showPositionDialog = ref(false)
  const showPauseDialog = ref(false)
  const showAwayDialog = ref(false)

  const authorized = ref(false)
  const password = ref("")
  const errorMessage = ref("")

  const selectedPosition = ref("")
  const isValidPosition = computed(() => positions.includes(selectedPosition.value))

  const selectedCallsign = ref("")
  const freeTextPositon = ref("")

  const selectedController = ref<Controller | null>(null)
  const selectedControllerToRemove = ref("")

  const foundController = ref<Controller | null>(null)

  const activeControllers = ref<Controller[]>([])
  const controllerNames = ref<Controller[]>([])
  const awayControllers = ref<Controller[]>([])

  const predefinedControllers = ref<Controller[]>([])

  const getAllControllers = computed(() => [
    ...controllerNames.value,
    ...activeControllers.value,
    ...awayControllers.value
  ])

  const backupActiveControllers = ref<Controller[] | null>(null)
  const backupControllerNames = ref<Controller[] | null>(null)
  const backupAwayControllers = ref<Controller[] | null>(null)
  const backupControllers = ref(false)

  const tempEndorsment = ref<string[]>([]);

  const newController = ref({
    name: "",
    sign: "",
    cid: "",
    callsign: "",
    position: "",
    frequency: "",
    rating: "",
    endorsment: "",
    timestamp: new Date().toISOString()
  })

  const positionList = ref(null as any)
  let matchingItemRef: { $el: any; } | null = null

  const allPositions = computed(() =>
    positionGroups.value.flatMap(group => group.positions)
  )

  const positionDialog = ref(false)

  const newControllerForm = ref(null)

  const isNewControllerFormValid = computed(() => {
    if (!newControllerForm.value) return false
    return (
      newController.value.name.length >= 3 &&
      /^[a-zA-Z]{2}$/.test(newController.value.sign) &&
      /^\d{5,8}$/.test(newController.value.cid) &&
      !!newController.value.rating &&
      !!tempEndorsment
    )
  })

  function controllerMatch() {
    const controllersSearch = predefinedControllers.value.filter(controller => controller.cid === newController.value.cid)
    const allControllersSearch = getAllControllers.value.filter(controller => controller.cid === newController.value.cid)
    if(controllersSearch) {
      foundController.value = controllersSearch[0]
    } else if(allControllersSearch) {
      foundController.value = allControllersSearch[0]
    }

    return controllersSearch.length > 0 || allControllersSearch.length > 0
  }

  function controllerMatchLogoff() {
    const controllersSearch = getAllControllers.value.filter(controller => controller.cid === newController.value.cid)
    if(controllersSearch) {
      foundController.value = controllersSearch[0]
    }

    return controllersSearch.length > 0
  }

  function isActiveController(ctrl: Controller) {
    if(!ctrl) return false
    return getAllControllers.value.find(controller => controller.cid === ctrl.cid) || false
  }

  function isAuthorized() {
    if (authorized.value == true) {
        return true;
    } else if (localStorage.getItem("authkey") === 'true') {
      return true;
    }
    else {
        return false;
    }
  }

  const parseEndorsment = (endorsementStr: string | string[], rating: string) => {
    // Rating = {C1} => All endorsement, show none.
    if (rating === "C1") return " ";
    
    // If something is given wrong or if the str is NULL (other words no rating, display NIL)
    if (endorsementStr === '{NULL}' || endorsementStr == undefined) {
      return " ";
    }
    if (typeof(endorsementStr) != "string") { return " "}
    
    // Match "T1 APP", "T2 APS" etc.
    let matches = endorsementStr.match(/\w\d \w+/g) || [];

    let strmatches = [];
    for (const match of matches) {
      strmatches.push(match.toString());
    } 

    // Remove endorsements that are implied by the rating.
    if (rating === "S3") {
      if (strmatches.includes("T1 APP")) {
        strmatches = strmatches.filter((val) => val === "T1 APP");
      } else {
        strmatches = strmatches.filter((val) => val === "T1 APP" || val === "T1 TWR");
      }
    }

    const result = strmatches.join(", ");
    if (endorsments == null) { return "NIL" }
    
    return result;
  }


  /**
   *
   * ALL API METHODS
   *
   */
  async function toggleAuthorization() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: password.value
        })
      })
      const data = await response.json()
      if(data.authorized == true) {
        console.log("authorized")
        authorized.value = true;
        localStorage.setItem("authkey", "true");
        errorMessage.value = "";
      } else {
        errorMessage.value = "Authorization failed. Please try again.";
      }
    } catch {
    errorMessage.value = "An error occurred. Please try again.";
  }
  password.value = ""; // Clear password after attempt
  }

  async function fetchControllers() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/controllers`)
      const data = await response.json()

      activeControllers.value = data.activeControllers || []
      controllerNames.value = data.availableControllers || []
      awayControllers.value = data.awayControllers || []
    } catch(error) {
      console.error("Error fetching controller data:", error)
    }

    sortControllerSessions()
  }

  async function fetchPredefinedControllers() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/controller/saved`)
      const data = await response.json()

      predefinedControllers.value = data.Controllers || []
    } catch(error) {
      console.error("Error fetching predefined controller data:", error)
    }
  }

  async function saveControllers(movedController: Controller) {
    try {
      await fetch(`${apiBaseUrl}/api/controller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          controller: movedController
        })
      })
    } catch(error) {
      console.error("Error saving controller data:", error)
    }

    sortControllerSessions()
  }

  const addControllerToDB = async (newcontroller: Controller) =>  {
    console.log(newcontroller)
    try {
      await fetch(`${apiBaseUrl}/api/controller/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({Controller: newcontroller})
      })
    } catch(error) {
      console.error("Error saving controller data:", error)
    }

  }

  const deleteControllerAsActive = async (controllerToRemoveCID: string) => {
    try {
      await fetch(`${apiBaseUrl}/api/controller/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cid: controllerToRemoveCID
        })
      })
    } catch(error) {
      console.error("Error saving controller data:", error)
    }
  }

  /**
   * OTHER
   */

  function addNewController() {
    if (isNewControllerFormValid.value) {
      const newCreatedController = {
        ...newController.value,
        endorsment: tempEndorsment.value.join(", "),
        sign: newController.value.sign.toUpperCase(),
        timestamp: new Date().toISOString()
      }
      controllerNames.value.push(newCreatedController)

      newController.value = {
        name: "",
        sign: "",
        cid: "",
        callsign: "",
        position: "",
        frequency: "",
        rating: "",
        endorsment: "",
        timestamp: new Date().toISOString()
      }
      tempEndorsment.value.length = 0;

      showNewControllerDialog.value = false
      showControllerDialog.value = false

      addControllerToDB(controllerNames.value.slice(-1)[0])
    }
  }

  function startSession() {
    if(foundController) {
      controllerNames.value.push({
        ...foundController.value!,
        position: "pause",
        callsign: "pause",
        timestamp: new Date().toISOString()
      })

      foundController.value!.position = "pause";
      foundController.value!.callsign = "pause";

      saveControllers(foundController.value!)

      foundController.value = null

      newController.value = {
        name: "",
        sign: "",
        cid: "",
        callsign: "",
        position: "",
        frequency: "",
        rating: "",
        endorsment: "",
        timestamp: new Date().toISOString()
      }
    }

    showControllerDialog.value = false
  }

  function stopSession() {
    const controllerToRemove = getAllControllers.value.find(controller => controller.cid === newController.value.cid)

    if (controllerToRemove && controllerToRemove.cid) {
      deleteControllerAsActive(controllerToRemove.cid);
    }

    if(controllerToRemove && controllerToRemove.cid) {
      activeControllers.value = activeControllers.value.filter(controller => controller.cid !== controllerToRemove.cid)
      controllerNames.value = controllerNames.value.filter(controller => controller.cid !== controllerToRemove.cid)
      awayControllers.value = awayControllers.value.filter(controller => controller.cid !== controllerToRemove.cid)

      // saveControllers(controllerToRemove)
    }

    newController.value = {
      name: "",
      sign: "",
      cid: "",
      callsign: "",
      position: "",
      frequency: "",
      rating: "",
      endorsment: "",
      timestamp: new Date().toISOString()
    }

    foundController.value = null

    selectedControllerToRemove.value = ""
    showDeleteControllerDialog.value = false
  }

  function formatTimeDifference(timestamp: string) {
    if (!timestamp) return "--:--:--"

    const currentTime = new Date().getTime();
    const startTime = new Date(timestamp).getTime(); // Local time is automatically used here

    const diffInSeconds = Math.floor((currentTime - startTime) / 1000);

    if (diffInSeconds < 1) { return "--:--:--";}
    const hours = String(Math.floor(diffInSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(diffInSeconds % 60).padStart(2, "0");

    //return `${hours}:${minutes}:${seconds}`
    return `${hours}:${minutes}`
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


  let unsubscribe: undefined | (() => void) ;

  /** used to sync controller cards */
  const subscribe = () => {

    const updateControllerList = (toUpdate: Ref<Controller[] | null>, newList: Controller[]) => {
      if (toUpdate.value) {
        toUpdate.value.length = 0;
        toUpdate.value.push(...newList);
      }
    };

    const handleSubscriptionData = (rcvdData: any) => {
      if (
        showControllerDialog.value == false &&
        showNewControllerDialog.value == false &&
        showDeleteControllerDialog.value == false &&
        showPositionDialog.value == false &&
        showPauseDialog.value == false &&
        showAwayDialog.value == false
      ) {
        if (rcvdData.activeControllers) {
          updateControllerList(activeControllers, rcvdData.activeControllers);
        }
        if (rcvdData.availableControllers) {
          updateControllerList(controllerNames, rcvdData.availableControllers);
        }
        if (rcvdData.awayControllers) {
          updateControllerList(awayControllers, rcvdData.awayControllers);
        }
      }
      sortControllerSessions();
    };

    const evtSource = new EventSource(`${apiBaseUrl}/subscribe`);
    evtSource.onmessage = (ev) => {
      handleSubscriptionData(JSON.parse(ev.data));
    }

    return () => {
      evtSource.close();
    };
  };


  // Fetch data from the server when the component is mounted
  onMounted(async () => {
    fetchControllers()
    fetchPredefinedControllers()
    refreshTime()
    authorized.value = isAuthorized()
    unsubscribe = subscribe();
  })

  onUnmounted(() => {
    clearInterval(refreshInterval);
    if (unsubscribe) {
      unsubscribe();
    }
  })

  function onAddPosition() {
    backupControllers.value = true
    showPositionDialog.value = true
  }

  function confirmPosition() {
    if(selectedController.value) {
      const controller = activeControllers.value.find(controller => controller.cid === selectedController.value?.cid)
      if(controller) {
        controller.position = selectedPosition.value
        controller.callsign = selectedCallsign.value
        controller.timestamp = new Date().toISOString()
        saveControllers(controller)
      }

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
      const controller = controllerNames.value.find(controller => controller.cid === selectedController.value?.cid);
      if(controller) {
        controller.position = "pause"
        controller.timestamp = new Date().toISOString()
        saveControllers(controller)
      }

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
      const controller = awayControllers.value.find(controller => controller.cid === selectedController.value?.cid)
      if(controller) {
        controller.position = "other"
        controller.callsign = freeTextPositon.value;
        controller.timestamp = new Date().toISOString()
        saveControllers(controller)
      }

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
    if(backupControllers.value) return

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
      //{'font-weight': "bold"},
    ];

  };

  function getBorderColor(ctrl: Controller) {
    let ratingColor;

    switch(ctrl.rating) {
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

  function getBorderTextColor(ctrl: Controller) {
    if(ctrl.rating === "C1") return { color: "#000" };
    return { color: "#FFF" };
  }

  function updatePositionSelection() {
    const inputLower = selectedPosition.value.toLowerCase()
    const matchingPosition = allPositions.value.find(
      pos => pos.toLowerCase() === inputLower
    )

    if (matchingPosition) {
      selectedPosition.value = matchingPosition
    }

    nextTick(() => {
      if (matchingItemRef && positionList.value) {
        const listElement = positionList.value.$el
        const itemElement = matchingItemRef.$el

        if (itemElement) {
          listElement.scrollTop = itemElement.offsetTop - listElement.offsetTop
        }
      }
    })
  }

  function clearPosition() {
    selectedPosition.value = ""
    matchingItemRef = null
    // Optionally, you can scroll the list back to the top
    if (positionList.value) {
      positionList.value.$el.scrollTop = 0
    }
  }

  // Watch for changes in positionDialog
  watch(positionDialog, (newValue) => {
    if (!newValue) {
      // Dialog is being closed
      clearPositionDialog()
    }
  })

  function clearPositionDialog() {
    selectedPosition.value = ""
    matchingItemRef = null
    if (positionList.value) {
      positionList.value.$el.scrollTop = 0
    }
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

    .controller-rating {
      position: absolute;
      top: 40%;
      left: 2px;
      transform: rotate(-90deg);
      transform-origin: left bottom;
      white-space: nowrap;
      font-size: 12px;
      font-weight: bold;
      color: #FFF;
      background-color: transparent;
      padding-left: 5px;
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

    .position-dialog-card {
    display: flex;
    flex-direction: column;
    height: 90vh;
  }

  .position-dialog-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .position-form {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .position-list {
    flex-grow: 1;
    overflow-y: auto;
    margin: 10px 0;
  }

  .v-card-actions {
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }

  .online-card {
    background-color: #eff3cf;
  }
  </style>
