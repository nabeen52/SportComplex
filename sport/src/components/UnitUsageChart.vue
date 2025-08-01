<template>
  <div style="width:100%;min-height:380px;">
    <div
      v-if="!hasData"
      style="color:#888;text-align:center;font-size:1.15rem;margin-top:80px;">
      ไม่มีข้อมูลตรงตามเงื่อนไขที่เลือก
    </div>
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend,
} from 'chart.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend)

const props = defineProps({
  units: { type: Array, default: () => [] },
  unitType: { type: String, default: 'usage' },
  yLabel: { type: String, default: '' }    // << เพิ่มตรงนี้
})

const chartData = computed(() => {
  // ตรวจสอบประเภท ถ้าเป็นกราฟอุปกรณ์กีฬา (unitType === 'equipment') ใช้ "จำนวนการใช้"
  const usageLabel = props.unitType === 'equipment' ? 'จำนวนการใช้' : 'จำนวนครั้ง';
  const datasets = [
    {
      label: usageLabel,
      data: props.units.map(u => u.usage || 0),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, .09)',
      tension: 0.35,
      fill: false,
    }
  ];
  // เพิ่มเส้นจำนวนชั่วโมง ถ้ามี u.hours
  if (props.units.some(u => u.hours !== undefined)) {
    datasets.push({
      label: 'จำนวนชั่วโมง',
      data: props.units.map(u => u.hours || 0),
      borderColor: '#d32f2f',
      backgroundColor: 'rgba(211,47,47,.09)',
      tension: 0.35,
      fill: false,
    });
  }
  return {
    labels: props.units.map(u => u.unit),
    datasets
  }
});



// เช็คว่ามีข้อมูลหรือไม่
const hasData = computed(() =>
  props.units && Array.isArray(props.units) && props.units.length > 0
  && props.units.some(u => (u.usage || 0) > 0 || (u.hours || 0) > 0)
)

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { font: { size: 15 } } },
    title: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}`
      }
    }
  },
  scales: {
    x: { title: { display: false } },
    y: {
      beginAtZero: true,
      title: {
        display: !!props.yLabel,
        text: props.yLabel || '',   // << ใช้ yLabel ที่ส่งมา
        font: { size: 15 }
      }
    }
  }
}))

</script>
