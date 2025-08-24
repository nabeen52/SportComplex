<template>
  <div class="chart-wrap">
    <div v-if="!hasData" class="nodata">
      ไม่มีข้อมูลตรงตามเงื่อนไขที่เลือก
    </div>

    <template v-else>
      <Line :data="chartData" :options="chartOptions" :key="renderKey" />
      <!-- Legend แบบเดียวกับการ์ดอื่น (อยู่นอกแคนวาส) -->
      <div class="chart-legend">
        <span
          v-for="(ds, idx) in legendDatasets"
          :key="idx"
          class="legend-item"
          :style="{
            color: hidden[idx] ? '#ccc' : ds.borderColor,
            cursor: 'pointer',
            marginRight: '22px',
            fontWeight: hidden[idx] ? 'normal' : 'bold'
          }"
          @click="toggle(idx)"
        >
          <span
            class="legend-color"
            :style="{
              background: ds.borderColor,
              border: hidden[idx] ? '2px solid #ccc' : `2px solid ${ds.borderColor}`,
              opacity: hidden[idx] ? 0.33 : 1
            }"
          ></span>
          {{ ds.label }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend,
} from 'chart.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend)

const props = defineProps({
  units: { type: Array, default: () => [] },
  unitType: { type: String, default: 'usage' },
  yLabel: { type: String, default: '' }
})

// 1) เตรียมชุดข้อมูลดิบ (ยังไม่ใส่ hidden)
const rawDatasets = computed(() => {
  const usageLabel = props.unitType === 'equipment' ? 'จำนวนการใช้' : 'จำนวนครั้ง'
  const list = [
    {
      label: usageLabel,
      data: props.units.map(u => u.usage ?? 0),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25,118,210,.09)',
      tension: 0.35,
      fill: false,
      pointRadius: 3
    }
  ]
  if (props.units.some(u => u.hours !== undefined)) {
    list.push({
      label: 'จำนวนชั่วโมง',
      data: props.units.map(u => u.hours ?? 0),
      borderColor: '#d32f2f',
      backgroundColor: 'rgba(211,47,47,.09)',
      tension: 0.35,
      fill: false,
      pointRadius: 3
    })
  }
  return list
})

// 2) จัดการสถานะซ่อน/แสดงของแต่ละเส้น
const hidden = ref([])
watch(rawDatasets, (arr) => {
  // รักษาค่าเดิมถ้ามี ไม่งั้นตั้งต้นเป็น false
  hidden.value = arr.map((_, i) => hidden.value[i] ?? false)
}, { immediate: true })

const renderKey = ref(0)
function toggle(i) {
  hidden.value[i] = !hidden.value[i]
  renderKey.value++ // บังคับรีเรนเดอร์กราฟ
}

// 3) ชุดข้อมูลที่ส่งเข้า Chart.js (อิง hidden)
const chartData = computed(() => ({
  labels: props.units.map(u => u.unit),
  datasets: rawDatasets.value.map((ds, i) => ({
    ...ds,
    _hidden: hidden.value[i],
    hidden: hidden.value[i]
  }))
}))

// สำหรับวาด legend ด้านล่าง
const legendDatasets = computed(() =>
  rawDatasets.value.map(ds => ({ label: ds.label, borderColor: ds.borderColor }))
)

// มีข้อมูลไหม
const hasData = computed(() =>
  props.units?.length > 0 &&
  props.units.some(u => (u.usage ?? 0) > 0 || (u.hours ?? 0) > 0)
)

// 4) options: ปิด legend ของ chart.js, ใช้ hidden จาก _hidden
const chartOptions = computed(() => ({
  responsive: true,
  layout: { padding: { left: 0, right: 0 } },
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }, // << ปิด legend ในแคนวาส
    title: { display: false },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}`
      }
    }
  },
  interaction: { mode: 'nearest', intersect: false },
  scales: {
    x: {
      title: { display: false },
      ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 }
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      title: {
        display: !!props.yLabel,
        text: props.yLabel,
        font: { size: 15 }
      }
    }
  },
  datasets: {
    line: { hidden: (ctx) => ctx?.dataset?._hidden === true }
  }
}))
</script>

<style scoped>
.chart-wrap{
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: block;            /* สำคัญ: ให้เป็น block เต็มบล็อก */
}

/* บังคับ canvas ให้เต็มกว้างเหมือนกราฟอื่น และตัดพฤติกรรม inline */
.chart-wrap :deep(canvas){
  display: block !important; /* กันช่องว่าง inline */
  width: 100% !important;
  height: 260px !important;  /* เท่ากับการ์ดอื่น */
}
.chart-container.overall{
  overflow-x: hidden !important; /* การ์ดที่ต้องกว้างเท่ากัน ใช้ hidden ไปเลย */
  scrollbar-gutter: stable both-edges;
}

.chart-legend {
  margin-top: 12px;
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  font-size: 1rem;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
}
.legend-color {
  display: inline-block;
  width: 16px;
  height: 10px;
  border-radius: 4px;
  margin-right: 2px;
  vertical-align: middle;
}

.nodata{
  color:#888;
  text-align:center;
  font-size:1.15rem;
  margin-top:80px;
}

/* มือถือ: ให้ canvas เท่ากับการ์ดอื่น */
@media (max-width: 600px){
  .chart-wrap :deep(canvas){ height: 160px !important; }
}
</style>
