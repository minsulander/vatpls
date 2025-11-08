<template>
    <div class="chart-container" :style="{ height: Math.max(200, props.chartData.labels.length * 50) + 'px' }" ref="containerRef">
        <Bar :data="chartDataWithDragBar" :options="props.chartOptions" ref="chartRef" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { Bar } from "vue-chartjs"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import zoomPlugin from "chartjs-plugin-zoom"
import Annotation from "chartjs-plugin-annotation"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin, Annotation, ChartDataLabels)

const props = defineProps<{
    chartData: any
    chartOptions: any
}>()

const emit = defineEmits<{
    requestBlockTime: [payload: { position: string; startTime: number; endTime: number }]
    clickBlockedTime: [payload: { blockId: number }]
}>()

const chartRef = ref<any>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const isDragging = ref(false)
const dragStart = ref<{ x: number; y: number; time: number; yIndex: number } | null>(null)
const dragEnd = ref<{ x: number; y: number; time: number } | null>(null)
const mouseDownPosition = ref<{ x: number; y: number } | null>(null)
const mouseDownEvent = ref<MouseEvent | null>(null)

const chartDataWithDragBar = computed(() => {
    if (!isDragging.value || !dragStart.value || !dragEnd.value) {
        return props.chartData
    }

    const data = JSON.parse(JSON.stringify(props.chartData))
    const yIndex = dragStart.value.yIndex
    const startTime = Math.min(dragStart.value.time, dragEnd.value.time)
    const endTime = Math.max(dragStart.value.time, dragEnd.value.time)

    const previewData = data.labels.map((_: any, index: number) => {
        if (index === yIndex) {
            return [startTime, endTime]
        }
        return null
    })

    data.datasets.push({
        label: "Blocked time",
        data: previewData,
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        borderColor: "rgba(255, 0, 0, 0.6)",
        borderWidth: 2,
        borderDash: [5, 5],
    })

    return data
})

function getTimeFromX(x: number): number {
    const chart = chartRef.value?.chart
    if (!chart) return 0

    const xScale = chart.scales.x
    return xScale.getValueForPixel(x)
}

function getYIndexFromY(y: number): number {
    const chart = chartRef.value?.chart
    if (!chart) return -1

    const yScale = chart.scales.y
    const value = yScale.getValueForPixel(y)
    return Math.round(value)
}

function handleMouseDown(event: MouseEvent) {
    const chart = chartRef.value?.chart
    if (!chart) return

    const rect = chart.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    mouseDownPosition.value = { x, y }
    mouseDownEvent.value = event

    // get clicked on elements
    const elements = chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, false)

    // if click on elements and elements block time we dont wanna start a drag
    if (elements && elements.length > 0) {
        const element = elements[0]
        const datasetIndex = element.datasetIndex
        const dataset = chart.data.datasets[datasetIndex]

        // If clicking on a blocked time, don't start drag
        if (dataset.label && dataset.label.startsWith("BLOCKED-")) {
            return
        }
    }

    // compare clicked position (time) to current
    const time = getTimeFromX(x)
    const now = dayjs.utc().valueOf()

    if (time < now) return

    // figure out where in y axis is clicked.
    const yIndex = getYIndexFromY(y)
    if (yIndex < 0 || yIndex >= props.chartData.labels.length) return

    dragStart.value = { x, y, time, yIndex }
    dragEnd.value = { x, y, time }
}

function handleMouseMove(event: MouseEvent) {
    if (!dragStart.value) return

    // Only start dragging if mouse has moved
    if (!isDragging.value && mouseDownPosition.value) {
        const chart = chartRef.value?.chart
        if (!chart) return

        const rect = chart.canvas.getBoundingClientRect()
        const currentX = event.clientX - rect.left
        const currentY = event.clientY - rect.top

        // pythagors sats för längd..
        const distance = Math.sqrt(Math.pow(currentX - mouseDownPosition.value.x, 2) + Math.pow(currentY - mouseDownPosition.value.y, 2))

        if (distance > 5) {
            isDragging.value = true
        }
    }

    if (!isDragging.value) return

    const chart = chartRef.value?.chart
    if (!chart) return

    const rect = chart.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const time = getTimeFromX(x)
    const now = dayjs.utc().valueOf()

    const clampedTime = Math.max(time, now)

    dragEnd.value = { x, y, time: clampedTime }
}

function handleMouseUp() {
    // click but not drag, chheck if cliked on blocke time.
    if (mouseDownEvent.value && !isDragging.value) {
        const chart = chartRef.value?.chart
        if (chart) {
            // Use the original mouse down event to get elements
            const elements = chart.getElementsAtEventForMode(mouseDownEvent.value, "nearest", { intersect: true }, false)

            if (elements && elements.length > 0) {
                const element = elements[0]
                const barElementidx = element.datasetIndex
                const barElement = chart.data.datasets[barElementidx]

                if (barElement.label && barElement.label.startsWith("BLOCKED-")) {
                    const blockId = parseInt(barElement.label.replace("BLOCKED-", ""), 10)
                    emit("clickBlockedTime", { blockId })
                }
            }
        }

        // reset
        isDragging.value = false
        dragStart.value = null
        dragEnd.value = null
        mouseDownPosition.value = null
        mouseDownEvent.value = null
        return
    }

    // missing start or end of drag op
    if (!dragStart.value || !dragEnd.value) {
        isDragging.value = false
        dragStart.value = null
        dragEnd.value = null
        mouseDownPosition.value = null
        mouseDownEvent.value = null
        return
    }

    // else valid drag operation
    const startTime = Math.min(dragStart.value.time, dragEnd.value.time)
    const endTime = Math.max(dragStart.value.time, dragEnd.value.time)
    const yIndex = dragStart.value.yIndex
    const position = props.chartData.labels[yIndex]
    const duration = endTime - startTime

    const minDuration = 5 * 60 * 1000 // 5 minutes more or less??
    if (duration >= minDuration) {
        emit("requestBlockTime", { position, startTime, endTime })
    }

    isDragging.value = false
    dragStart.value = null
    dragEnd.value = null
    mouseDownPosition.value = null
    mouseDownEvent.value = null
}

function handleMouseLeave() {
    // handle when mouse leaves chart, maybe not required but safety number 1 priortiy
    if (isDragging.value) {
        isDragging.value = false
        dragStart.value = null
        dragEnd.value = null
        mouseDownPosition.value = null
        mouseDownEvent.value = null
    }
}

onMounted(() => {
    setTimeout(() => {
        const canvas = chartRef.value?.chart?.canvas
        if (canvas) {
            canvas.addEventListener("mousedown", handleMouseDown)
            canvas.addEventListener("mousemove", handleMouseMove)
            canvas.addEventListener("mouseup", handleMouseUp)
            canvas.addEventListener("mouseleave", handleMouseLeave)
        }
    }, 100)
})

onUnmounted(() => {
    const canvas = chartRef.value?.chart?.canvas
    if (canvas) {
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
})
</script>
<style scoped>
.chart-container {
    position: relative;
    width: 100%;
}
</style>
