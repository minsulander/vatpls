<template>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>Controller Time Online</h1>
        </v-col>
      </v-row>
  
      <v-row>
        <v-col v-for="controller in sortedControllers" :key="controller.cid" cols="12" sm="6" md="4">
          <v-card>
            <v-card-title>{{ controller.callsign }}</v-card-title>
            <v-card-subtitle>{{ controller.frequency }}</v-card-subtitle>
            <v-card-text>
              <strong>Name:</strong> {{ controller.name }}<br />
              <strong>Time Online:</strong> {{ formatDuration(controller.accumulatedTimeOnline) }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { useVatsimStore } from '@/store/vatsim'
  import moment from 'moment'
  
  // Use VATSIM store to fetch controllers data
  const vatsim = useVatsimStore()
  
  // Computed property for sorted controllers by their accumulated time online
  const sortedControllers = computed(() => {
    return vatsim.data.controllers.map(controller => {
      const accumulatedTime = moment.duration(moment().diff(moment(controller.logon_time))).asMinutes()
      return {
        ...controller,
        accumulatedTimeOnline: accumulatedTime
      }
    }).sort((a, b) => b.accumulatedTimeOnline - a.accumulatedTimeOnline)
  })
  
  // Format the accumulated time online to a readable format
  function formatDuration(minutes) {
    const duration = moment.duration(minutes, 'minutes')
    const hours = Math.floor(duration.asHours())
    const mins = Math.floor(duration.minutes())
    return `${hours}h ${mins}m`
  }
  </script>
  