<template>
    <div class="chart-container" :style="{ height: props.chartData.labels.length * 50 + 'px' }">
        <Bar :data="props.chartData" :options="props.chartOptions" ref="chartRef" />
    </div>
</template>

<script setup lang="ts">
import { Bar } from "vue-chartjs"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import zoomPlugin from "chartjs-plugin-zoom"
import Annotation from "chartjs-plugin-annotation"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin, Annotation, ChartDataLabels)

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
