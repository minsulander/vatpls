<template>
    <div class="ws-panel">
        <h1>WS Panel</h1>

        <div class="chart-section">
            <h2>Activity Chart</h2>
            <div class="chart-container">
                <Bar :data="chartData2" :options="chartOptions2" ref="chartRef" />
            </div>
        </div>

        <div class="info-sections">
            <div>
                <h2>Positions</h2>
                <div style="min-height: 100px; max-width: 100px; background-color: cadetblue"></div>
            </div>
            <div>
                <h2>Controllers</h2>
                <div style="min-height: 100px; max-width: 100px; background-color: cadetblue"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Bar } from "vue-chartjs"
import { Chart as ChartJS, CategoryScale, TimeScale, BarElement, Title, Tooltip, Legend, ChartOptions, TooltipItem } from "chart.js"
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"
import zoomPlugin from "chartjs-plugin-zoom"
import dayjs from "dayjs"

// Register Chart.js components
ChartJS.register(CategoryScale, TimeScale, BarElement, Title, Tooltip, Legend, zoomPlugin)

const router = useRouter()
const chartRef = ref()

const positions = ["SA-TWR", "GG-TWR", "OS-1"]

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
