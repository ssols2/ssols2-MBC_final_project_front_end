<template>
  <div class="charger-status-stats">
    <div class="header-row">
      <h3 class="card-title">EV 충전 스테이션 공간 관제</h3>

      <div class="floor-tabs">
        <button v-for="tab in floorTabs" :key="tab.value" type="button" class="floor-tab"
          :class="{ active: selectedFloor === tab.value }" @click="selectedFloor = tab.value">
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
      <button v-for="charger in filteredChargers" :key="getChargerId(charger)" type="button" class="charger-card"
        :class="statusClass(getChargerStatus(charger))" @click="$emit('detail-view', getChargerId(charger))">
        <div class="charger-id">{{ getChargerId(charger) }}</div>

        <!-- <div class="charger-visual">
          <div v-if="getChargerStatus(charger) === 'RISK'" class="charger-icon risk">
            <span class="icon-body"></span>
            <span class="icon-line"></span>
            <span class="icon-alert"></span>
          </div>

          <div v-else-if="getChargerStatus(charger) === 'POWER_OFF'" class="charger-icon power-off">
            <span class="icon-body"></span>
            <span class="icon-line"></span>
            <span class="icon-power"></span>
          </div>

          <div v-else class="charger-icon" :class="statusClass(getChargerStatus(charger))">
            <span class="icon-body"></span>
            <span class="icon-line"></span>
          </div>
        </div> -->


        <div class="charger-visual" :class="statusClass(getChargerStatus(charger))">
          <!-- 기본 충전기 본체 SVG -->
          <svg class="base-charger-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8h7" />
            <path d="M6 12h7" />
            <rect x="4" y="2" width="11" height="20" rx="2" />
            <path d="M15 14h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1" />
            <rect x="18" y="14" width="4" height="6" rx="1" />
          </svg>

          <!-- RISK 상태: 느낌표 경고 배지 -->
          <svg v-if="getChargerStatus(charger) === 'RISK'" class="status-badge-svg risk-badge" viewBox="0 0 24 24"
            fill="currentColor" stroke="none">
            <path d="M12 2L1 21h22M12 8v5M12 16h.01" stroke="#0f172a" stroke-width="3" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M12 2L1 21h22M12 8v5M12 16h.01" stroke="#ff0000" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>

          <!-- POWER_OFF 상태: 전원 버튼 배지 -->
          <svg v-else-if="getChargerStatus(charger) === 'POWER_OFF'" class="status-badge-svg power-badge"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
        </div>

        <div class="charger-status-text" :class="statusClass(getChargerStatus(charger))">
          {{ statusLabel(getChargerStatus(charger)) }}
        </div>

        <div class="charging-info" :class="{ 'is-empty': getChargerStatus(charger) !== 'CHARGING' }">
          <span class="charging-kwh">
            {{ getChargerStatus(charger) === 'CHARGING' ? formatChargeKwh(getCurrentChargeKwh(charger)) : '- kWh' }}
          </span>
          <span class="charging-time">
            {{ getChargerStatus(charger) === 'CHARGING' ? formatChargingTime(getChargingMinutes(charger)) : '- 분' }}
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
}

/* ── 1. 타이틀 및 층별 탭 ── */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
}

.card-title {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
}

.floor-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floor-tab {
  min-width: 62px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: 5px;
  background: transparent;
  color: rgba(245, 245, 245, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.floor-tab.active {
  background: rgba(130, 194, 227, 0.15);
  border-color: #82c2e3;
  color: #fff;
}

/* ── 2. 범례 (Legend) ── */
.legend-row {
  display: flex;
  justify-content: flex-start;
  gap: 14px;
  margin-bottom: 17px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(245, 245, 245, 0.6);
  font-size: 15px;
  font-weight: 400;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.standby {
  background: #00e676;
}

.legend-dot.charging {
  background: #7fc5ea;
}

.legend-dot.check {
  background: #fbb900;
}

.legend-dot.risk {
  background: #ff0000;
}

.legend-dot.power-off {
  background: rgba(245, 245, 245, 0.4);
}

/* ── 3. 충전기 상태 카드 그리드 ── */
.charger-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
  flex: 1;
}

.charger-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 17px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.3);
  cursor: pointer;
  transition: 0.2s;
}

.charger-card:hover {
  background: rgba(68, 77, 86, 0.3);
}

.charger-card.standby {
  border-color: rgba(0, 230, 118, 0.3);
}

.charger-card.charging {
  border-color: rgba(127, 197, 234, 0.3);
}

.charger-card.check {
  border-color: rgba(251, 185, 0, 0.3);
}

.charger-card.risk {
  border-color: rgba(255, 0, 0, 0.3);
}

.charger-card.power-off {
  border-color: rgba(245, 245, 245, 0.1);
  opacity: 0.7;
}

.charger-id {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
}

/* ── 4. 새로운 전문적인 충전기 SVG 스타일 ── */
.charger-visual {
 position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto 0 20px;
  color: currentColor;
}

/* 충전 중이 아닐 때는 값이 흐리게 보이도록 처리 */
.charging-info.is-empty {
  opacity: 0.3;
}

.base-charger-svg {
  width: 64px;
  height: 64px;
  color: inherit;
}

/* 경고 & 전원 뱃지 스타일 */
.status-badge-svg {
  position: absolute;
  right: -8px;
  bottom: 0px;
  width: 26px;
  height: 26px;
  background: #0f172a;
  /* 배경과 분리감 주입 */
  border-radius: 50%;
  padding: 2px;
}

.risk-badge {
  color: #ff0000;
}

.power-badge {
  color: rgba(245, 245, 245, 0.4);
}

/* 상태별 색상 통일 (아이콘 & 텍스트) */
.charger-visual.standby,
.charger-status-text.standby {
  color: #00e676;
}

.charger-visual.charging,
.charger-status-text.charging {
  color: #7fc5ea;
}

.charger-visual.check,
.charger-status-text.check {
  color: #fbb900;
}

.charger-visual.risk,
.charger-status-text.risk {
  color: #ff0000;
}

.charger-visual.power-off,
.charger-status-text.power-off {
  color: rgba(245, 245, 245, 0.4);
}

.charger-status-text {
  font-size: 20px;
  font-weight: 700;
}

/* ── 5. 하단 정보 ── */
.charging-info {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.charging-kwh {
  font-size: 20px;
  font-weight: 800;
  color: #fbb900;
}

.charging-time {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.charger-meta {
  margin-top: auto;
  padding-top: 17px;
  width: 100%;
  border-top: 1px solid rgba(245, 245, 245, 0.05);
  color: rgba(245, 245, 245, 0.6);
  font-size: 18px;
  font-weight: 600;
}
</style>