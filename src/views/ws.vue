<template>
    <h2>Admin Panel</h2>

    <div>
        <p>Positions</p>
        <div style="min-height: 100px; max-width: 100px; background-color: cadetblue"></div>
    </div>
    <div>
        <p>Controllers</p>
        <div style="min-height: 100px; max-width: 100px; background-color: cadetblue"></div>
    </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router"

const router = useRouter()
export default {
    name: "AdminPanel",
}
</script>
