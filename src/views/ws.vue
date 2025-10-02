<template>
    <div class="ws-panel">
        <h1>WS Panel</h1>

        <v-tabs v-model="tab">
            <v-tab v-for="tabPages in tabs"> {{ tabPages }} </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
            <v-tabs-window-item v-for="tabPages in tabs" :key="tabPages">
                <div class="chart-section">
                    <h2>{{ tabPages }} tab</h2>
                    <Timeline :chartData="chartData2" :chartOptions="chartOptions2" />
                </div>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import Timeline from "@/components/Timeline.vue"

const router = useRouter()
const chartRef = ref()
const tab = ref("Positions")
const tabs = ["Positions", "Controllers"]
const positions = ["SA-TWR", "GG-TWR", "OS-1", "MM-2", "SA-GND", "APP-E", "APP-W", "DEP-E", "DEP-W"]
const chartData2 = {
    labels: positions,
    datasets: [
        {
            label: "Task 1",
            data: [
                null,
                [new Date("2021-09-11T00:00:00"), new Date("2021-09-13T00:00:00")],
                [new Date("2021-09-11T00:00:00"), new Date("2021-09-13T00:00:00")],
            ],
            backgroundColor: "red",
        },
        {
            label: "Task 2",
            data: [
                [new Date("2021-09-12T00:00:00"), new Date("2021-09-14T00:00:00")],
                [new Date("2021-09-14T00:00:00"), new Date("2021-09-15T00:00:00")],
                null,
            ],
            backgroundColor: "blue",
        },
        {
            label: "Task 3",
            data: [null, [new Date("2021-09-16T00:00:00"), new Date("2021-09-18T00:00:00")], null],
            backgroundColor: "orange",
        },
    ],
} as any

const chartOptions2 = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
        legend: {
            position: "top" as const,
        },
        title: {
            display: true,
            text: "Positions Timeline",
        },
    },
    scales: {
        y: {
            stacked: true,
        },
        x: {
            type: "time" as const,
            time: {
                unit: "day" as const,
                stepSize: 1,
                displayFormats: {
                    day: "MMM DD",
                },
                tooltipFormat: "YYYY-MM-DD",
            },
            ticks: {
                maxTicksLimit: 8,
            },
            min: new Date("2021-09-11T00:00:00"),
            max: new Date("2021-09-18T00:00:00"),
        },
    },
} as any

onMounted(() => {})
</script>

<style scoped>
.ws-panel {
    padding: 20px;
}

.chart-section {
    margin-bottom: 40px;
}

.chart-container {
    height: 400px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-sections {
    display: flex;
    gap: 20px;
}

.info-sections > div {
    flex: 1;
}
</style>
