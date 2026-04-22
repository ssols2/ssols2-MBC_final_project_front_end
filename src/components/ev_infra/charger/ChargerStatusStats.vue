<template>
<div class="charger-status-stats">
  <div class="header-row">
    <h3 class="card-title">EV 충전 스테이션 공간 관제</h3>

    <div class="floor-tabs">
      <button
        v-for="tab in floorTabs"
        :key="tab.value"
        type="button"
        class="floor-tab"
        :class="{ active: selectedFloor === tab.value }"
        @click="selectedFloor = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>


    <div class="legend-row">
      <div class="legend-item">
        <span class="legend-dot standby"></span>
        <span>대기중</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot charging"></span>
        <span>충전 중</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot check"></span>
        <span>점검</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot risk"></span>
        <span>위험</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot power-off"></span>
        <span>전원 OFF</span>
      </div>
    </div>

    <div class="charger-grid">
      <button
        v-for="charger in filteredChargers"
        :key="getChargerId(charger)"
        type="button"
        class="charger-card"
        :class="statusClass(getChargerStatus(charger))"
        @click="$emit('detail-view', getChargerId(charger))"
      >
        <div class="charger-id">{{ getChargerId(charger) }}</div>

        <div class="charger-visual">
          <div
            v-if="getChargerStatus(charger) === 'RISK'"
            class="charger-icon risk"
          >
            <span class="icon-body"></span>
            <span class="icon-line"></span>
            <span class="icon-alert"></span>
          </div>

          <div
            v-else-if="getChargerStatus(charger) === 'POWER_OFF'"
            class="charger-icon power-off"
          >
            <span class="icon-body"></span>
            <span class="icon-line"></span>
            <span class="icon-power"></span>
          </div>

          <div
            v-else
            class="charger-icon"
            :class="statusClass(getChargerStatus(charger))"
          >
            <span class="icon-body"></span>
            <span class="icon-line"></span>
          </div>
        </div>

<div
  class="charger-status-text"
  :class="statusClass(getChargerStatus(charger))"
>
  {{ statusLabel(getChargerStatus(charger)) }}
</div>

        <div
          v-if="getChargerStatus(charger) === 'CHARGING'"
          class="charging-info"
        >
          <span class="charging-kwh">
            {{ formatChargeKwh(getCurrentChargeKwh(charger)) }}
          </span>
          <span class="charging-time">
            {{ formatChargingTime(getChargingMinutes(charger)) }}
          </span>
        </div>

        <div class="charger-meta">
          {{ getChargerType(charger) === 'FAST' ? '급속 충전기 | 50kW' : '완속 충전기 | 7kW' }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  chargerList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['detail-view'])

const selectedFloor = ref('B1')

const floorTabs = [
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'B3', label: 'B3' },
  { value: 'B4', label: 'B4' },
  { value: 'B5', label: 'B5' }
]

const floorMap = {
  B1: '1F',
  B2: '2F',
  B3: '3F',
  B4: '4F',
  B5: '5F'
}

const getChargerId = (item) => item?.evChargerId || item?.chargerId || ''
const getChargerType = (item) => item?.chargerType || item?.type || ''
const getChargerStatus = (item) => item?.chargerStatus || item?.status || ''

const filteredChargers = computed(() => {
  const targetFloor = floorMap[selectedFloor.value]

  return props.chargerList
    .filter((item) => getChargerId(item).startsWith(targetFloor))
    .sort((a, b) => getChargerId(a).localeCompare(getChargerId(b)))
    .slice(0, 3)
})

const statusLabel = (status) => {
  switch (status) {
    case 'STANDBY':
      return '대기 중'
    case 'CHARGING':
      return '충전 중'
    case 'CHECK':
    case 'FAULT':
      return '점검'
    case 'RISK':
      return '위험'
    case 'POWER_OFF':
      return '전원 OFF'
    default:
      return '-'
  }
}

const statusClass = (status) => {
  switch (status) {
    case 'STANDBY':
      return 'standby'
    case 'CHARGING':
      return 'charging'
    case 'CHECK':
    case 'FAULT':
      return 'check'
    case 'RISK':
      return 'risk'
    case 'POWER_OFF':
      return 'power-off'
    default:
      return 'standby'
  }
}

const getCurrentChargeKwh = (item) =>
  item?.currentChargeKwh ?? item?.current_charge_kwh ?? 0

const getChargingMinutes = (item) =>
  item?.chargingMinutes ?? item?.charging_minutes ?? 0

const formatChargeKwh = (value) => {
  const num = Number(value ?? 0)
  return `${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}kWh`
}

const formatChargingTime = (value) => {
  const minutes = Number(value ?? 0)

  if (!minutes || minutes < 0) return '0분'

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}시간 ${remainMinutes}분`
  }

  return `${remainMinutes}분`
}
</script>

<style scoped>
.charger-status-stats {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-title {
  margin: 0;
  margin-bottom: 20px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  white-space: nowrap;
}

.floor-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: nowrap;
}

.floor-tab {
  min-width: 62px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid #2b3553;
  border-radius: 5px;
  background: #11182c;
  color: #dbe4ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.floor-tab.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #dbe4ff;
  font-size: 13px;
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.standby {
  background: #22c55e;
}

.legend-dot.charging {
  background: #3b82f6;
}

.legend-dot.check {
  background: #f59e0b;
}

.legend-dot.risk {
  background: #ef4444;
}

.legend-dot.power-off {
  background: #94a3b8;
}

.charger-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.charger-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 270px;
  padding: 20px 18px;
  border: 1px solid #2b3553;
  border-radius: 10px;
  background: #0f172a;
  cursor: pointer;
  text-align: center;
}

.charger-card.standby {
  border-color: #22c55e;
}

.charger-card.charging {
  border-color: #3b82f6;
}

.charger-card.check {
  border-color: #f59e0b;
}

.charger-card.risk {
  border-color: #ef4444;
}

.charger-card.power-off {
  border-color: #94a3b8;
}

.charger-id {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.charger-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 34px 0 22px;
}

.charger-icon {
  position: relative;
  width: 74px;
  height: 90px;
  color: currentColor;
}

.icon-body {
  position: absolute;
  left: 12px;
  top: 8px;
  width: 36px;
  height: 54px;
  border: 4px solid currentColor;
  border-radius: 8px;
}

.icon-body::before {
  content: '';
  position: absolute;
  left: 5.3px;
  top: 8px;
  width: 14px;
  height: 8px;
  border: 2px solid currentColor;
  border-radius: 2px;
}

.icon-body::after {
  content: '';
  position: absolute;
  left: 11px;
  bottom: 9px;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.icon-line {
  position: absolute;
  right: 12px;
  top: 20px;
  width: 14px;
  height: 32px;
  border: 4px solid currentColor;
  border-left: none;
  border-radius: 0 10px 10px 0;
}

.icon-alert {
  position: absolute;
  right: 11px;
  bottom: 17px;
  width: 0;
  height: 0;
  border-left: 11px solid transparent;
  border-right: 11px solid transparent;
  border-bottom: 20px solid #ef4444;
}

.icon-alert::after {
  content: '!';
  position: absolute;
  left: -2px;
  top: 4px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
}

.icon-power {
  position: absolute;
  right: 8px;
  bottom: 12px;
  width: 22px;
  height: 22px;
  border: 4px solid currentColor;
  border-radius: 50%;
}

.icon-power::before {
  content: '';
  position: absolute;
  left: 5px;
  top: -9px;
  width: 4px;
  height: 12px;
  background: currentColor;
  border-radius: 2px;
}

.charger-icon.standby,
.charger-status-text.standby {
  color: #22c55e;
}

.charger-icon.charging,
.charger-status-text.charging {
  color: #3b82f6;
}

.charger-icon.check,
.charger-status-text.check {
  color: #f59e0b;
}

.charger-icon.risk,
.charger-status-text.risk {
  color: #ef4444;
}

.charger-icon.power-off,
.charger-status-text.power-off {
  color: #94a3b8;
}

.charger-status-text {
  font-size: 23px;
  font-weight: 700;
}

.charger-meta {
  margin-top: auto;
  padding-top: 22px;
  width: 100%;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  color: #e5e7eb;
  font-size: 15px;
  font-weight: 500;
}

.charging-info {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
}

.charging-kwh {
  font-size: 20px;
  color: #fbb900;
}

.charging-time {
  font-size: 18px;
  color: #cbd5e1;
}
</style>