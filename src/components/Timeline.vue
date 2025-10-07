<template>
    <div class="chart-container" :style="{ height: props.chartData.labels.length * 40 + 'px' }">
        <Bar :data="props.chartData" :options="props.chartOptions" ref="chartRef" />
    </div>
</template>

<script setup lang="ts">
import { Bar } from "vue-chartjs"
import { Chart as ChartJS, CategoryScale, TimeScale, BarElement, Title, Tooltip, Legend, ChartOptions, TooltipItem } from "chart.js"
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"
import zoomPlugin from "chartjs-plugin-zoom"
import Annotation from "chartjs-plugin-annotation"
import dayjs from "dayjs"

// Register Chart.js components
ChartJS.register(CategoryScale, TimeScale, BarElement, Title, Tooltip, Legend, zoomPlugin, Annotation)

const props = defineProps<{
    chartData: any
    chartOptions: any
}>()
</script>
<style scoped>
.chart-container {
    position: relative;
    width: 100%;
}
</style>
