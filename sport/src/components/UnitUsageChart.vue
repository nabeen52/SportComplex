<template>
  <div class="chart-container">
    <div class="chart-box">
      <Bar :data="barData" :options="chartOptions" />
    </div>
    <div class="chart-box">
      <Pie :data="pieData" :options="pieOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale)

const props = defineProps({
  units:    { type: Array,  required: true },
  unitType: { type: String, required: true }
})

// ฟังก์ชันสร้างสี HSL ไม่ซ้ำ สูงสุด 200 สี
function generateColorPalette(n) {
  const colors = []
  for (let i = 0; i < n; i++) {
    const hue = Math.round((360 * i) / n)
    colors.push(`hsl(${hue}, 70%, 50%)`)
  }
  return colors
}

const unitLabels  = computed(() => props.units.map(u => u.unit))
// ทำให้ค่าหลักในกราฟเปลี่ยนตาม unitType (ชั่วโมง/ครั้ง)
const mainValues = computed(() =>
  props.unitType === 'hours'
    ? props.units.map(u => u.hours)
    : props.units.map(u => u.usage)
)
const colors = computed(() => generateColorPalette(props.units.length))

const barData = computed(() => ({
  labels: unitLabels.value,
  datasets: [
    {
      label: props.unitType === 'hours' ? 'ชั่วโมง/ครั้ง' : 'ครั้ง/ชั่วโมง',
      data: mainValues.value,
      backgroundColor: colors.value,
      borderWidth: 1,
      borderColor: '#fff'
    }
  ]
}))

const pieData = computed(() => ({
  labels: unitLabels.value,
  datasets: [
    {
      label: props.unitType === 'hours' ? 'ชั่วโมง/ครั้ง' : 'ครั้ง/ชั่วโมง',
      data: mainValues.value,
      backgroundColor: colors.value,
      borderWidth: 1,
      borderColor: '#fff'
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const u = props.units[ctx.dataIndex]
          if (!u) return ctx.formattedValue
          // โชว์ข้อมูลสลับตาม filter ที่เลือก
          if (props.unitType === 'hours') {
            return [
              `จำนวนชั่วโมง: ${u.hours ?? 0}`,
              `จำนวนครั้ง: ${u.usage ?? 0}`
            ]
          } else {
            return [
              `จำนวนครั้ง: ${u.usage ?? 0}`,
              `จำนวนชั่วโมง: ${u.hours ?? 0}`
            ]
          }
        }
      }
    },
    title: {
      display: true,
      text: props.unitType === 'hours'
        ? 'กราฟแท่ง: ชั่วโมง/ครั้ง การใช้งานแต่ละหน่วยงาน'
        : 'กราฟแท่ง: ครั้ง/ชั่วโมง การใช้งานแต่ละหน่วยงาน'
    }
  },
  scales: {
    x: { ticks: { font: { size: 12 }, autoSkip: false, maxRotation: 45 } },
    y: { beginAtZero: true }
  }
}))

const pieOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const u = props.units[ctx.dataIndex]
          if (!u) return ctx.formattedValue
          if (props.unitType === 'hours') {
            return [
              `จำนวนชั่วโมง: ${u.hours ?? 0}`,
              `จำนวนครั้ง: ${u.usage ?? 0}`
            ]
          } else {
            return [
              `จำนวนครั้ง: ${u.usage ?? 0}`,
              `จำนวนชั่วโมง: ${u.hours ?? 0}`
            ]
          }
        }
      }
    },
    title: {
      display: true,
      text: props.unitType === 'hours'
        ? 'กราฟวงกลม: ชั่วโมง/ครั้ง การใช้งานแต่ละหน่วยงาน'
        : 'กราฟวงกลม: ครั้ง/ชั่วโมง การใช้งานแต่ละหน่วยงาน'
    }
  }
}))
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: stretch;   /* เดิม center => เป็น stretch */
  align-items: stretch;       /* เดิม flex-start => stretch */
  width: 100%;
  height: 100%;               /* เพิ่ม! ให้กินเต็ม dashboard-section */
  min-height: 350px;          /* ป้องกันสูงน้อยเกิน */
}

.chart-box {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  background: none;
  display: flex;
  align-items: stretch;     /* แก้จาก center เป็น stretch */
  justify-content: stretch; /* แก้จาก center เป็น stretch */
}

.chart-box canvas {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  min-height: 320px;
}

/* Responsive */
@media (max-width: 900px) {
  .chart-container {
    flex-direction: column;
    gap: 1.5rem;
    min-height: 260px;
    height: auto;
  }
  .chart-box {
    width: 100%;
    min-width: 0;
    height: 260px;
    max-width: 100%;
    align-items: center;
    justify-content: center;
  }
}

</style>