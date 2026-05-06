<template>
  <div class="parking-map-container">

    <header class="map-header">
      <div class="header-left">
        <h2 class="page-title">주차장 현황 맵</h2>

        <div class="legend-group">
          <div class="legend-item">
            <span class="legend-dot empty"></span>
            <span class="legend-label">빈 자리</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot parked"></span>
            <span class="legend-label">주차중</span>
          </div>
          <div class="legend-item">
            <svg class="ev-icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span class="legend-label">충전기 구역</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <select v-model.number="selectedFloor" class="admin-select floor-select">
          <option v-for="f in [1, 2, 3, 4, 5]" :key="f" :value="f">지하 {{ f }}층</option>
        </select>
      </div>
    </header>

    <div class="floor-nav-bar">
      <!-- 윗층 이동 버튼 -->
      <button v-if="selectedFloor > 1" type="button" class="nav-btn" @click="selectedFloor--">
        <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
        지하 {{ selectedFloor - 1 }}층으로 이동
      </button>

      <!-- 1층 전용 입구 표시 -->
      <div v-else class="entrance-info">
        <svg class="entrance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
        </svg>
        PARKING ENTRANCE (입구)
      </div>

      <!-- 현위치 표시 (정중앙) -->
      <div class="current-floor-display">
        <span class="lbl">현위치</span>
        <strong class="val">B{{ selectedFloor }}F</strong>
      </div>

      <!-- 아랫층 이동 버튼 -->
      <button v-if="selectedFloor < 5" type="button" class="nav-btn" @click="selectedFloor++">
        지하 {{ selectedFloor + 1 }}층으로 이동
        <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </button>
      <div v-else class="nav-btn disabled">
        더 이상 내려갈 수 없습니다
        <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>

    <!-- 주차 자리 그리드 (4행 × 10열) -->
    <div class="parking-grid-wrapper layout-card">
      <div v-for="row in 4" :key="row" class="parking-row">
        <button v-for="col in 10" :key="col" type="button" class="parking-spot-unit" :class="{
          'is-parked': spotAt(row, col)?.isParked,
          'has-ev': spotAt(row, col)?.hasEvCharger,
        }" @click="openModal(spotAt(row, col))">
          <span class="spot-id-label">{{ rowLabel(row) }}-{{ col }}</span>
          <svg v-if="spotAt(row, col)?.hasEvCharger" class="ev-indicator-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <div v-if="spotAt(row, col)?.isParked" class="car-light"></div>
        </button>
      </div>
    </div>

    <!-- 차량 정보 모달 -->
    <div v-if="modalSpot" class="modal-overlay-custom" @click.self="closeModal">
      <div class="glass-panel modal-box-custom fade-in">
        <header class="modal-header-custom">
          <h3>{{ rowLabel(modalSpot.parkingRow) }}-{{ modalSpot.parkingColumn }} 구역 상세</h3>
          <span class="floor-badge">B{{ modalSpot.parkingFloor }}F</span>
        </header>

        <!-- 주차된 칸을 눌렀을 때 -->
        <template v-if="modalSpot.isParked">
          <div class="info-row-custom"><span class="label">차량 번호</span><span class="value highlight">{{
            modalSpot.vehicleNum || '-' }}</span></div>
          <div class="info-row-custom"><span class="label">등록 국가</span><span class="value">{{
            countryLabel(modalSpot.licensePlateCountry) }}</span></div>
          <div class="info-row-custom"><span class="label">입차 시간</span><span class="value">{{
            formatEntryTime(modalSpot.entryTime) }}</span></div>
          <div class="info-row-custom"><span class="label">누적 주차</span><span class="value text-blue">{{ parkingDuration
          }}</span></div>
          <div class="info-row-custom"><span class="label">회원 구분</span>
            <span :class="['badge-ui', modalSpot.isMember ? 'member' : 'guest']">
              {{ modalSpot.isMember ? '정회원' : '비회원' }}
            </span>
          </div>
        </template>

        <!-- 비어있는 칸을 눌렀을 때 -->
        <template v-else>
          <div class="empty-spot-msg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
            </svg>
            <p>현재 비어있는 주차 구역입니다</p>
          </div>
        </template>
      </div>

      <button class="close-action-btn" @click="closeModal">정보 창 닫기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getAllParkingSpots } from '@/api/dashboard/parkingMap.js';

const spots = ref([]);
const selectedFloor = ref(1);
const modalSpotId = ref(null);
const now = ref(Date.now());

let pollIntervalId = null;
let timerIntervalId = null;

const COUNTRY_LABEL = {
  KOR: '대한민국',
  BRA: '브라질',
  CHN: '중국',
  EUR: '유럽',
  IND: '인도',
};

const refresh = async () => {
  try {
    const res = await getAllParkingSpots();
    spots.value = res.data;
  } catch (e) {
    console.error('주차장 정보 조회 실패:', e);
  }
};

const rowLabel = (row) => String.fromCharCode(64 + row);

const spotAt = (row, col) => {
  return spots.value.find(s =>
    s.parkingFloor === selectedFloor.value &&
    s.parkingRow === row &&
    s.parkingColumn === col
  );
};

// 모달이 열린 자리 (spots 배열에서 실시간 참조 → 폴링 시 자동 갱신)
const modalSpot = computed(() => {
  if (modalSpotId.value == null) return null;
  return spots.value.find(s => s.spotId === modalSpotId.value);
});

// 모달이 열려있는 동안 그 자리가 출차되면 자동 닫기
watch(modalSpot, (s) => {
  if (modalSpotId.value != null && (!s || !s.isParked)) {
    modalSpotId.value = null;
  }
});

const openModal = (spot) => {
  if (!spot || !spot.isParked) return;
  modalSpotId.value = spot.spotId;
};

const closeModal = () => {
  modalSpotId.value = null;
};

const formatEntryTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR');
};

// 주차 시간 (실시간 - now가 1초마다 갱신되므로 자동 재계산)
const parkingDuration = computed(() => {
  if (!modalSpot.value?.entryTime) return '-';
  const entry = new Date(modalSpot.value.entryTime).getTime();
  const diffSec = Math.floor((now.value - entry) / 1000);
  if (diffSec < 0) return '-';

  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  if (h > 0) return `${h}시간 ${m}분 ${s}초`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
});

const countryLabel = (code) => COUNTRY_LABEL[code] || code || '-';

onMounted(() => {
  refresh();
  // 자리 정보 폴링 (3초마다) - 새 입차/출차/회원 상태 변경 반영
  pollIntervalId = setInterval(refresh, 3000);
  // 주차 시간 실시간 갱신용 타이머 (1초마다 now만 갱신)
  timerIntervalId = setInterval(() => { now.value = Date.now(); }, 1000);
});

onUnmounted(() => {
  if (pollIntervalId) clearInterval(pollIntervalId);
  if (timerIntervalId) clearInterval(timerIntervalId);
});
</script>

<style scoped>
/* 1. 전체 컨테이너 및 헤더 */
.parking-map-container {
  display: flex;
  flex-direction: column;
  gap: 17px;
  min-height: 100%; 
  color: var(--text-primary);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 5px solid var(--accent-blue);
  padding-left: 17px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 17px;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
}

/* 2. 상단 범례 및 현위치 배지 */
.legend-group {
  display: flex;
  gap: 17px;
  background: var(--bg-card);
  padding: 8px 17px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.empty {
  background: transparent;
  border: 2px solid var(--text-secondary);
}

.legend-dot.parked {
  background: var(--accent-blue);
  box-shadow: 0 0 6px var(--accent-blue);
}

.ev-icon.mini {
  width: 14px;
  height: 14px;
  color: var(--color-yellow);
}

/* 3. 층 선택 셀렉트 박스 */
.admin-select.floor-select {
  appearance: none;
  background-color: var(--bg-card);
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  padding: 0 34px 0 17px;
  height: 36px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  outline: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  transition: all 0.2s ease;
  box-shadow: var(--glass-shadow);
}

.admin-select.floor-select:hover {
  border-color: var(--accent-blue);
}

.admin-select.floor-select option {
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-weight: 600;
}

/* 4. 엘리베이터 패널형 버튼 바 */
.floor-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 17px;
  width: 100%;
}

.nav-btn, .entrance-info {
  flex: 1; 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 42px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  box-shadow: var(--glass-shadow);
  transition: all 0.2s ease;
}

.nav-btn:hover:not(.disabled) {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: var(--hover-bg);
  transform: translateY(-2px);
}

.nav-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: transparent;
  color: var(--text-secondary);
}

.nav-arrow {
  width: 18px;
  height: 18px;
}

.current-floor-display {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 42px;
  background: var(--bg-main);
  border: 2px solid var(--accent-blue);
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.current-floor-display .lbl {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 700;
  margin-bottom: -2px;
}

.current-floor-display .val {
  font-size: 18px;
  color: var(--accent-blue);
  font-weight: 900;
  letter-spacing: 1px;
}

.entrance-info {
  color: var(--color-green);
  background: rgba(34, 197, 94, 0.05);
  border: 1.5px solid var(--color-green);
  cursor: default;
}

.entrance-icon {
  width: 20px;
  height: 20px;
}

/* 5. 메인 주차장 맵 */
.parking-grid-wrapper.layout-card {
  padding: 34px; 
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--glass-shadow);
  display: flex;
  flex-direction: column;
  position: relative;
  /* 하단 여백 강제 적용 */
  margin-bottom: 17px; 
}

.parking-row {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 17px;
}

.parking-row:nth-child(1),
.parking-row:nth-child(3) {
  margin-bottom: 17px;
}

.parking-row:nth-child(2) {
  margin-bottom: 110px; 
  position: relative;
}

.parking-row:nth-child(2)::before {
  content: "";
  position: absolute;
  bottom: -55px;
  left: 0;
  width: 100%;
  border-bottom: 4px dashed var(--border-color);
}

.parking-row:nth-child(2)::after {
  content: "MAIN DRIVEWAY";
  position: absolute;
  bottom: -72px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 26px;
  font-weight: 900;
  color: var(--text-secondary);
  letter-spacing: 24px;
  opacity: 0.2;
  pointer-events: none;
  white-space: nowrap;
}

.parking-spot-unit {
  aspect-ratio: 1.1 / 1;
  background: var(--bg-main); 
  border: 1px solid var(--border-color);
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.parking-spot-unit:hover {
  background: var(--hover-bg);
  border-color: var(--text-secondary); 
  transform: translateY(-2px);
  z-index: 10;
}

.parking-spot-unit.is-parked {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.parking-spot-unit.is-parked:hover {
  filter: brightness(1.1);
  border-color: var(--accent-blue);
}

.spot-id-label {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-secondary);
  z-index: 2;
}

.is-parked .spot-id-label {
  color: #ffffff;
}

/* 전기차 구역 표시 */
.parking-spot-unit.has-ev {
  background-color: rgba(251, 185, 0, 0.12) !important; 
  border: 1.5px solid rgba(251, 185, 0, 0.6) !important;
  border-bottom: 4px solid var(--color-yellow) !important;
}

.parking-spot-unit.has-ev:hover {
  border-color: var(--color-yellow) !important;
}

.parking-spot-unit.has-ev.is-parked {
  background-color: var(--color-yellow) !important;
  border-color: var(--color-yellow) !important;
  box-shadow: 0 4px 10px rgba(251, 185, 0, 0.2) !important;
}

.parking-spot-unit.has-ev.is-parked:hover {
  filter: brightness(1.1);
}

.parking-spot-unit.has-ev.is-parked .spot-id-label {
  color: #000000;
}

.parking-spot-unit.has-ev.is-parked .ev-indicator-svg {
  color: #000000 !important;
}

.ev-indicator-svg {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  color: var(--color-yellow);
  display: block !important;
}

.car-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

/* 6. 차량 정보 팝업 모달 */
.modal-overlay-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box-custom {
  width: 100%;
  max-width: 380px;
  padding: 25px;
  background: var(--bg-card); 
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--glass-shadow);
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-group h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.floor-badge {
  background: var(--accent-blue);
  color: #ffffff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 800;
  display: inline-block;
  width: fit-content;
}

.close-x {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 22px;
  cursor: pointer;
  transition: 0.2s;
}

.close-x:hover {
  color: var(--text-primary);
  transform: scale(1.1);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-row-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-row-custom .label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.info-row-custom .value {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}

.info-row-custom .value.highlight {
  color: var(--accent-blue);
  font-size: 20px;
  font-weight: 900;
}

.badge-ui {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
}

.badge-ui.member {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-green);
  border: 1px solid var(--color-green);
}

.badge-ui.guest {
  background: rgba(250, 140, 22, 0.1);
  color: var(--color-orange);
  border: 1px solid var(--color-orange);
}

.time-val {
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  color: var(--text-primary);
}

.empty-spot-msg {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
}

.empty-spot-msg svg {
  width: 36px;
  height: 36px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-spot-msg p {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.close-action-btn {
  margin-top: 20px;
  width: 100%;
  padding: 12px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.close-action-btn:hover {
  background: var(--hover-bg);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>