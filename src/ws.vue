<template>
    <h2>WS Panel</h2>
    <div>
        <h3>Login</h3>
    </div>
    <div v-if="authorized">
        
    <div>
        <apexchart width="500" type="rangeBar" :options="options" :series="series"></apexchart>
    </div>
    </div>
</template>


<script setup lang="ts">
import { ref, Ref } from 'vue';

const dataSessions: dataSession[] = [
  {
    start: new Date("2024-01-01T08:00:00"),
    end: new Date("2024-01-01T10:00:00"),
    position: "OS3",
    cid: "104352",
  },
  {
    start: new Date("2024-01-01T09:00:00"),
    end: new Date("2024-01-01T11:00:00"),
    position: "MM2",
    cid: "117893",
  },
  {
    start: new Date("2024-01-01T10:00:00"),
    end: new Date("2024-01-01T12:00:00"),
    position: "SA AD",
    cid: "94321",
  },
  {
    start: new Date("2024-01-01T11:00:00"),
    end: new Date("2024-01-01T13:00:00"),
    position: "GG AD",
    cid: "125678",
  },
  {
    start: new Date("2024-01-01T12:00:00"),
    end: new Date("2024-01-01T14:00:00"),
    position: "SA APP",
    cid: "138402",
  },
  {
    start: new Date("2024-01-01T13:00:00"),
    end: new Date("2024-01-01T15:00:00"),
    position: "GG APP",
    cid: "91542",
  },
  {
    start: new Date("2024-01-01T14:00:00"),
    end: new Date("2024-01-01T16:00:00"),
    position: "OS3",
    cid: "143291",
  },
  {
    start: new Date("2024-01-01T15:00:00"),
    end: new Date("2024-01-01T17:00:00"),
    position: "MM2",
    cid: "135678",
  },
  {
    start: new Date("2024-01-01T16:00:00"),
    end: new Date("2024-01-01T18:00:00"),
    position: "SA AD",
    cid: "105467",
  },
  {
    start: new Date("2024-01-01T17:00:00"),
    end: new Date("2024-01-01T19:00:00"),
    position: "GG AD",
    cid: "112345",
  },
];

const options = {
        series: [
          {
            name: "Sessions",
            data: formatData(dataSessions)
          },
        ],
        chart: {
          type: 'rangeBar'
        },
        xaxis: {
          type: 'datetime',
          
        },
        plotOptions: {
          bar: {
            horizontal: true
          }
        },
        tooltip: {
          style: {
            color: "#FFFFFF"
          },
          y: {
            formatter: function (value, context) {
              return `CID: ${context.series[context.seriesIndex][context.dataPointIndex].cid || 'Not available'}`;
            },
          },
          onDatasetHover: {
            highlightDataSeries: true
          },
          theme: 'dark',
          marker: {
            show: true,
            fillColors: ["#FF4560"], // Customize marker color if needed
          },
        }
      };

const series = [{
        data: formatData(dataSessions)
        }];



const authorized: Ref<boolean> = ref(true); 

interface dataSession {
  start: Date;
  end: Date;
  position: string;
  cid: string;
};




function formatData(sessions: dataSession[]) {
  return sessions.map((val) => {
    const entry = {
      x: val.position,
      y: [
        val.start.getTime(),
        val.end.getTime()
      ],
      cid: val.cid
    }
    return entry;
  });
}




</script>