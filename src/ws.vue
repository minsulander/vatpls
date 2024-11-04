<template>
    <h2>WS Panel</h2>
    <div>
        <h3>Login</h3>
    </div>
    <div v-if="authorized">
          
      <div>
          <apexchart width="800" type="rangeBar" :options="options" :series="series"></apexchart>
      </div>
      <div>
        <apexchart width="600" type="rangeBar" :options="userChartOption" :series="series"></apexchart>
      </div>
    </div>
</template>


<script setup lang="ts">
import { ref, Ref } from 'vue';



const dataSessions = ref([
  {
    start: new Date("2024-01-01T08:00:00"),
    end: new Date("2024-01-01T10:32:00"),
    position: "OS3",
    cid: "104352",
    name: "user"
  },
  {
    start: new Date("2024-01-01T09:00:00"),
    end: new Date("2024-01-01T11:00:00"),
    position: "MM2",
    cid: "117893",
    name: "user"
  },
  {
    start: new Date("2024-01-01T10:00:00"),
    end: new Date("2024-01-01T12:00:00"),
    position: "SA AD",
    cid: "94321",
    name: "user"
  },
  {
    start: new Date("2024-01-01T11:00:00"),
    end: new Date("2024-01-01T13:00:00"),
    position: "GG AD",
    cid: "125678",
    name: "user"
  },
  {
    start: new Date("2024-01-01T12:00:00"),
    end: new Date("2024-01-01T14:00:00"),
    position: "SA APP",
    cid: "138402",
    name: "user"
  },
  {
    start: new Date("2024-01-01T13:00:00"),
    end: new Date("2024-01-01T15:00:00"),
    position: "GG APP",
    cid: "91542",
    name: "user"
  },
  {
    start: new Date("2024-01-01T14:00:00"),
    end: new Date("2024-01-01T16:00:00"),
    position: "OS3",
    cid: "143291",
    name: "user"
  },
  {
    start: new Date("2024-01-01T15:00:00"),
    end: new Date("2024-01-01T17:00:00"),
    position: "MM2",
    cid: "135678",
    name: "user"
  },
  {
    start: new Date("2024-01-01T16:00:00"),
    end: new Date("2024-01-01T18:00:00"),
    position: "SA AD",
    cid: "105467",
    name: "user"
  },
  {
    start: new Date("2024-01-01T17:00:00"),
    end: new Date("2024-01-01T19:00:00"),
    position: "GG AD",
    cid: "112345",
    name: "user"
  },
]);

console.log(formatByCID(dataSessions))

const userChartOption = {
  series: [
    {
      data: formatByCID(dataSessions) // Ensure `formatData` formats data with start and end times
    },
  ],
  chart: {
    type: 'rangeBar'
  },
  xaxis: {
    type: 'datetime',  // X-axis represents time
  },
  yaxis: {
    categories: dataSessions.value.map((session) => {
      console.log(session.cid);
      return session.cid
    }), // Extract CIDs for y-axis
    title: {
      text: "CID",
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '50%' // Adjust height for better spacing if needed
    }
  },
  tooltip: {
    style: {
      color: "#FFFFFF"
    },
    theme: 'dark',
    marker: {
      show: true,
      fillColors: ["#FF4560"]
    },
  },
};


const options = {
        series: [
          {
            name: "Sessions",
            data: formatByPosition(dataSessions)
          },
        ],
        chart: {
          type: 'rangeBar'
        },
        xaxis: {
          type: 'datetime',
          
        },
        yaxis: {
          labels: {
            formatter: (val: any) => val
          },
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
          custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
            // Ensure dataPointIndex is valid
            if (dataPointIndex === undefined || dataSessions.value[dataPointIndex] === undefined) return '';

            console.log(dataPointIndex);

            // Retrieve start and end times formatted as hh:mm:ss
            const startTime = dataSessions.value[dataPointIndex].start.toTimeString().split(' ')[0];
            const endTime = dataSessions.value[dataPointIndex].end.toTimeString().split(' ')[0];
            const duration = calculateTime(dataSessions.value[dataPointIndex].start, dataSessions.value[dataPointIndex].end);

            // Format the tooltip HTML
            return `
              <div class="tooltip-content">
                <p class="tooltip-title">Position: ${dataSessions.value[dataPointIndex].position}</p>
                <p><strong>CID:</strong> ${dataSessions.value[dataPointIndex].name} (${dataSessions.value[dataPointIndex].cid})</p>
                <p><strong>Time:</strong> ${startTime} -  ${endTime}</p>
                <p><strong>Duration:</strong> ${duration}</p>
              </div>
            `;
          },
          onDatasetHover: {
            highlightDataSeries: true
          },
          theme: 'dark',
          marker: {
            show: true,
            fillColors: ["#FF4560"], // Customize marker color if needed
          },
        },
      };

const series = [{
        data: formatByPosition(dataSessions)
        }];



const authorized: Ref<boolean> = ref(true); 

interface dataSession {
  start: Date;
  end: Date;
  position: string;
  cid: string;
  name: string;
};


function calculateTime(start: Date, end: Date) {
  const totaltime = new Date(end.getTime() - start.getTime());

  const hours = String(totaltime.getUTCHours()).padStart(2, '0');
  const minutes = String(totaltime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(totaltime.getUTCSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}



function formatByPosition(sessions: Ref<dataSession[]>) {
  return sessions.value.map((val) => {
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

function formatByCID(sessions: Ref<dataSession[]>) {
  return sessions.value.map(val => {
    return {
      x: [val.start.getTime(), val.end.getTime()],
      y: val.cid
    };
  });
}

</script>
<style>
.tooltip-content {
  background-color: #f0f0f0;  /* Light gray background */
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);  /* Slight shadow */
  max-width: 200px;
  font-family: Arial, sans-serif;
}

.tooltip-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.tooltip-content p {
  font-size: 14px;
  color: #555;
  margin: 4px 0;
}

.tooltip-content strong {
  color: #333;
}

</style>