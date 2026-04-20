<template>
  <div class="monitor-wrapper">
    <section class="top-controls card">
      <div class="control-row-1">
        <h2 class="title">주차 모니터링</h2>

        <div class="right-tools">
          <div class="sort-box">
            <select v-model="sortOrder" class="sort-select">
              <option value="desc">최신순</option>
              <option value="asc">과거순</option>
            </select>
          </div>

          <div class="floor-tabs">
            <button v-for="tab in floorTabs" :key="tab" class="tab" :class="{ active: selectedFloor === tab }"
              @click="selectedFloor = tab">
              {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <div class="control-row-2">
        <div class="date-range">
          <input type="date" v-model="startDate" class="date-input" />
          <span class="dash">~</span>
          <input type="date" v-model="endDate" class="date-input" />
        </div>

        <div class="search-box">
          <div class="search-wrap">
            <input type="text" v-model="searchPlate" placeholder="차량번호를 입력하세요 (예: 12가)"
              @focus="searchDropdownOpen = searchResults.length > 0"
              @input="searchDropdownOpen = searchPlate.trim().length > 0" @keyup.enter="applySearch" />

            <div v-if="searchDropdownOpen && searchResults.length > 0" class="search-dropdown">
              <div v-for="(car, i) in searchResults" :key="`${car.plate}-${car.pos}-${i}`" class="search-result-item"
                @mousedown.prevent="applySearchResult(car)">
                <div class="result-plate">{{ car.plate }}</div>
                <div class="result-meta">
                  {{ car.member }} · {{ car.status }} · {{ car.pos }}
                </div>
              </div>
            </div>
          </div>

          <button class="btn-search" @click="applySearch">검색</button>
          <button class="btn-search" @click="fetchData">🔄 새로고침</button>
        </div>
      </div>
    </section>

    <section class="mid-analysis">
      <div class="card status-box">
        <h3 class="box-label">
          {{ appliedSearchKeyword ? `검색 결과 | ${appliedSearchKeyword}` : `주차 실시간 현황 | ${selectedFloor}` }}
        </h3>

        <div v-if="appliedSearchKeyword" class="search-mode-panel">
          <div v-if="appliedSearchResults.length > 0" class="search-mode-list">
            <div v-for="(car, i) in appliedSearchResults" :key="`${car.plate}-${car.pos}-${i}`" class="search-mode-item"
              @click="openDetailModal(car)">
              <div class="search-mode-row">
                <div class="search-mode-left">
                  <strong class="search-mode-plate">{{ car.plate }}</strong>

                  <span class="search-mode-dot"></span>

                  <span class="search-mode-member">
                    {{ car.member || '비회원' }}
                  </span>
                </div>

                <div class="search-mode-right">
                  {{ getParkingDurationText(car) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-search-box">
            검색 결과가 없습니다.
          </div>

          <div class="search-mode-actions">
            <button class="clear-search-btn" @click="clearAppliedSearch">
              검색 해제
            </button>
          </div>
        </div>

        <div v-else-if="selectedFloor === '전체'" class="gauge-list">
          <div v-for="f in floorStats" :key="f.id" class="gauge-row">
            <span class="f-name">{{ f.id }}</span>

            <div class="bar-track">
              <div class="bar-fill" :style="{
                width: f.rate + '%',
                background: f.color,
                minWidth: f.rate > 0 ? '20px' : '0px'
              }">
                <span v-if="f.rate > 0" class="rate-val">{{ f.rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="floor-map-container">
          <div class="parking-lot-map">
            <div class="map-row zone-a-row">
              <div v-for="i in 10" :key="'A' + i" class="map-spot"
                :class="[getSpotStatus('A' + i), { 'spot-highlight': highlightedSpotId === ('A' + i) }]"
                @click="handleSpotClick('A' + i)">
                A{{ i }}
              </div>
            </div>

            <div class="road-aisle"></div>

            <div class="map-island">
              <div class="map-row zone-b-row">
                <div v-for="i in 10" :key="'B' + i" class="map-spot"
                  :class="[getSpotStatus('B' + i), { 'spot-highlight': highlightedSpotId === ('B' + i) }]"
                  @click="handleSpotClick('B' + i)">
                  B{{ i }}
                </div>
              </div>

              <div class="island-divider"></div>

              <div class="map-row zone-c-row">
                <div v-for="i in 10" :key="'C' + i" class="map-spot"
                  :class="[getSpotStatus('C' + i), { 'spot-highlight': highlightedSpotId === ('C' + i) }]"
                  @click="handleSpotClick('C' + i)">
                  C{{ i }}
                </div>
              </div>
            </div>

            <div class="road-aisle"></div>

            <div class="map-row zone-d-row">
              <div v-for="i in 10" :key="'D' + i" class="map-spot"
                :class="[getSpotStatus('D' + i), { 'spot-highlight': highlightedSpotId === ('D' + i) }]"
                @click="handleSpotClick('D' + i)">
                D{{ i }}
              </div>
            </div>

            <div class="map-legend">
              <span class="l-item"><span class="l-box empty"></span> 빈자리</span>
              <span class="l-item"><span class="l-box occupied"></span> 주차중</span>
              <span class="l-item"><span class="l-box ev"></span> 전기차</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card analysis-panel">
        <h3 class="box-label">주차 가동성 및 점유 분석</h3>

        <div class="top-stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="s-title">주차 현황</span>
              <span class="trend up">{{ currentPercent }}% 점유 ▲</span>
            </div>
            <div class="stat-body">
              <span class="s-val text-yellow">{{ currentCount }}대</span>
              <span class="s-unit">(Cars)</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="s-title">빈자리 대수</span>
              <span class="trend down">-{{ currentPercent }}% ▼</span>
            </div>
            <div class="stat-body">
              <span class="s-val text-blue">{{ remainCount }}대</span>
              <span class="s-unit">(Cars)</span>
            </div>
          </div>
        </div>

        <div class="mid-stats-grid">
          <div class="donut-container">
            <div class="donut-chart-v3" :style="{
              background: `conic-gradient(#f8bc06 0% ${currentRate}%, #7fc4ea ${currentRate}% 100%)`
            }">
              <div class="donut-inner-v3">
                <span class="donut-title">전체 점유율:</span>
                <span class="donut-val">{{ currentRate }}%</span>
              </div>
            </div>
          </div>

          <div class="zone-bars-container">
            <h4 class="zone-title">구역별 실시간 가동률</h4>

            <div class="zone-item" v-for="zone in zoneStats" :key="zone.name">
              <span class="z-name">{{ zone.name }}</span>

              <div class="z-bar-track">
                <div class="z-bar-fill" :style="{
                  width: Math.min((zone.current / zone.total) * 100, 100) + '%',
                  background: zone.color
                }"></div>
              </div>

              <span class="z-val">{{ zone.current }}/{{ zone.total }}</span>
            </div>
          </div>
        </div>

        <div class="bottom-stats-grid">
          <div class="btm-stat-card">
            <span class="b-label">
              주차 점유율
              <strong class="text-yellow" style="margin-left: 5px">
                {{ currentRate }}%
              </strong>
            </span>
            <span class="trend up">+2% ▲</span>
          </div>

          <div class="btm-stat-card">
            <span class="b-label">
              차량 회전율
              <strong class="text-red" style="margin-left: 5px">{{ rotationRate }}회</strong>
            </span>
            <span class="trend up">+2% ▲</span>
          </div>
        </div>
      </div>
    </section>

    <section class="bottom-list card">
      <h3 class="box-label">
        주차 차량 리스트
        <span class="result-count">
          (검색 결과: {{ filteredVehicleList.length }}건)
        </span>
      </h3>

      <div class="table-scroll">
        <table class="db-table">
          <thead>
            <tr>
              <th>입차시간</th>
              <th>주차 위치</th>
              <th>회원</th>
              <th>차량번호</th>
              <th>체류시간</th>
              <th>상태</th>
              <th>처리담당자</th>
              <th>처리</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(car, i) in paginatedList" :key="`${car.plate}-${car.date}-${i}`" class="row-item"
              @click="openDetailModal(car)">
              <td>{{ getEntryDateTimeText(car) }}</td>
              <td class="parking-pos">{{ getDisplayParkingPos(car) }}</td>
              <td class="member-yn">{{ getMemberYn(car) }}</td>
              <td class="plate-num">{{ car.plate }}</td>
              <td>{{ getParkingDurationHms(car) }}</td>
              <td>
                <span class="list-status-wrap" :class="getListStatusInfo(car).cls">
                  <span class="list-status-dot"></span>
                  <span>{{ getListStatusInfo(car).text }}</span>
                </span>
              </td>
              <td>{{ getProcessedManager(car) }}</td>
              <td>
                <div class="row-actions">
                  <button class="action-btn edit" @click.stop="handleEditRow(car)">수정</button>
                  <button class="action-btn delete" @click.stop="handleDeleteRow(car)">삭제</button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredVehicleList.length === 0">
              <td colspan="8" class="empty-cell">
                <div class="empty-icon"></div>
                검색 조건에 일치하는 차량이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls" v-if="filteredVehicleList.length > 0">
        <button :disabled="currentPage === 1" @click="goPrevPage" class="p-btn">
          이전
        </button>
        <span class="p-info">{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="goNextPage" class="p-btn">
          다음
        </button>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="isDetailModalOpen" class="modal-overlay" @click.self="closeDetailModal">
        <div class="detail-modal-card">
          <button class="detail-close-btn" @click="closeDetailModal">✕</button>

          <div class="detail-modal-layout">
            <div class="detail-left-panel">
              <div class="detail-main-image-box">
                <img v-if="selectedCar && (selectedCar.parkedImg || selectedCar.fullImg)"
                  :key="selectedCar.parkedImg || selectedCar.fullImg"
                  :src="getImageUrl(selectedCar.fullImg || selectedCar.parkedImg)" class="detail-main-image"
                  @error="(e) => console.log('상세 메인 실패:', e.target.currentSrc, selectedCar)" />
                <div v-else class="detail-no-image">NO IMAGE</div>
              </div>

              <div class="detail-plate-preview-box">
                <img v-if="selectedCar && (selectedCar.violationImg || selectedCar.plateImg)"
                  :key="selectedCar.violationImg || selectedCar.plateImg"
                  :src="getImageUrl(selectedCar.plateImg || selectedCar.violationImg)" class="detail-plate-preview"
                  @error="(e) => console.log('상세 번호판 실패:', e.target.currentSrc, selectedCar)" />
                <div v-else class="detail-no-plate">확인중</div>
              </div>
            </div>

            <div class="detail-right-panel">
              <div class="detail-info-row">
                <div class="detail-info-label">국가</div>
                <div class="detail-info-value">{{ getDisplayCountry(selectedCar?.country) }}</div>
              </div>

              <div class="detail-info-row">
                <div class="detail-info-label">회원</div>
                <div class="detail-info-value">{{ getDisplayMemberText(selectedCar?.member) }}</div>
              </div>

              <div class="detail-info-row">
                <div class="detail-info-label">차량번호</div>
                <div class="detail-info-value detail-info-highlight">{{ selectedCar?.plate || '-' }}</div>
              </div>

              <div class="detail-info-row">
                <div class="detail-info-label">입차시간</div>
                <div class="detail-info-value">{{ selectedCar?.date }} {{ selectedCar?.inTime }}</div>
              </div>

              <div class="detail-info-row">
                <div class="detail-info-label">출차시간</div>
                <div class="detail-info-value">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Transition>
    <Transition name="fade">
      <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-card parking-edit-modal">
          <div class="parking-edit-top">
            <div class="parking-edit-main-image">
              <img v-if="editCar && (editCar.parkedImg || editCar.fullImg)"
                :src="getImageUrl(editCar.fullImg || editCar.parkedImg)" class="main-snap" />
              <div v-else class="no-image-box">NO IMAGE</div>
            </div>

            <div class="parking-edit-plate-box">
              <img v-if="editCar && (editCar.violationImg || editCar.plateImg)"
                :src="getImageUrl(editCar.plateImg || editCar.violationImg)" class="parking-edit-plate-image" />
              <div v-else class="parking-edit-plate-empty">확인중</div>
            </div>
          </div>

          <div class="modal-body parking-edit-body">
            <div class="parking-edit-grid">
              <div class="parking-edit-field">
                <label>회원</label>
                <input v-model="editForm.member" class="parking-edit-input" />
              </div>

              <div class="parking-edit-field parking-edit-field-full">
                <label>주차위치</label>
                <button class="parking-pos-picker-btn" @click="toggleEditPicker">
                  {{ getDisplayParkingPos({ pos: editForm.pos }) || '위치 선택' }}
                </button>
              </div>

              <div class="parking-edit-field parking-edit-field-full">
                <label>차량번호</label>
                <input v-model="editForm.plate" class="parking-edit-input" />
              </div>
            </div>

            <div v-if="editPickerOpen" class="parking-picker-wrap">
              <div class="parking-picker-tabs">
                <button v-for="tab in floorTabs.slice(1)" :key="tab" class="picker-tab"
                  :class="{ active: editSelectedFloor === tab }" @click="editSelectedFloor = tab">
                  {{ tab }}
                </button>
              </div>

              <div class="parking-picker-message" v-if="editPickerMessage">
                {{ editPickerMessage }}
              </div>

              <div class="parking-picker-map">
                <div class="map-row zone-a-row">
                  <div v-for="i in 10" :key="'EA' + i" class="map-spot picker-spot" :class="getEditSpotStatus('A' + i)"
                    @click.stop="selectEditSpot('A' + i)">
                    A{{ i }}
                  </div>
                </div>

                <div class="road-aisle"></div>

                <div class="map-island">
                  <div class="map-row zone-b-row">
                    <div v-for="i in 10" :key="'EB' + i" class="map-spot picker-spot"
                      :class="getEditSpotStatus('B' + i)" @click.stop="selectEditSpot('B' + i)">
                      B{{ i }}
                    </div>
                  </div>

                  <div class="island-divider"></div>

                  <div class="map-row zone-c-row">
                    <div v-for="i in 10" :key="'EC' + i" class="map-spot picker-spot"
                      :class="getEditSpotStatus('C' + i)" @click.stop="selectEditSpot('C' + i)">
                      C{{ i }}
                    </div>
                  </div>
                </div>

                <div class="road-aisle"></div>

                <div class="map-row zone-d-row">
                  <div v-for="i in 10" :key="'ED' + i" class="map-spot picker-spot" :class="getEditSpotStatus('D' + i)"
                    @click.stop="selectEditSpot('D' + i)">
                    D{{ i }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="parking-edit-actions">
            <button class="btn-edit-save" @click="handleEditSave">수정</button>
            <button class="btn-edit-delete" @click="handleDeleteRow(editCar)">삭제</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';

// ---------------------------------------------------------
// 1. 상태 관리
// ---------------------------------------------------------
const vehicleList = ref([]);
const searchPlate = ref('');          // 입력창에 치는 값
const appliedSearchKeyword = ref(''); // 실제 적용된 검색어
const searchDropdownOpen = ref(false); // 검색 결과 드롭다운 열림 여부
const highlightedSpotId = ref('');     // 클릭한 차량 자리 강조용 (예: A1)
const selectedSearchCar = ref(null);   // 클릭한 차량 정보
const getToday = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const getSpotCar = (spotId) => {
  if (selectedFloor.value === '전체') return null;

  const fullPos = `${selectedFloor.value}_${spotId}`;

  return vehicleList.value.find(
    (car) =>
      car.pos === fullPos &&
      String(car.rawStatus || '').toUpperCase() === 'PARKED'
  ) || null;
};

const handleSpotClick = (spotId) => {
  highlightedSpotId.value = spotId;

  const car = getSpotCar(spotId);
  if (car) {
    openDetailModal(car);
  }
};
const startDate = ref(getToday());
const endDate = ref(getToday());

const selectedFloor = ref('전체');
const floorTabs = ['전체', 'B1', 'B2', 'B3', 'B4', 'B5'];

const isDetailModalOpen = ref(false);
const isEditModalOpen = ref(false);

const selectedCar = ref(null);
const editCar = ref(null);

const editForm = ref({
  member: '',
  pos: '',
  plate: ''
});

const editPickerOpen = ref(false);
const editPickerMessage = ref('');
const editSelectedFloor = ref('B1');

const currentPage = ref(1);
const itemsPerPage = 8;
const sortOrder = ref('desc');

let refreshTimer = null;

const rowUiState = ref({});
const currentLoginUser = ref(''); // 나중에 로그인 사용자명 연결
// ---------------------------------------------------------
// 2. 공통 함수
// ---------------------------------------------------------

const snapshotVersion = ref(0);

const getImageUrl = (img) => {
  if (!img) return '';
  return `http://localhost:9000/snapshots/${encodeURIComponent(img)}?v=${snapshotVersion.value}`;
};
const convertPosToAlpha = (pos) => {
  if (!pos || !pos.includes('_') || pos.startsWith('불법')) return pos;

  try {
    const parts = pos.split('_'); // ['B1', '11']
    const floor = parts[0];       // 'B1'
    const rowCol = parts[1];      // '11' 또는 '110'

    const rowNum = parseInt(rowCol.substring(0, 1)); // 첫 번째 숫자 (행: 1, 2, 3, 4)
    const colNum = rowCol.substring(1);              // 나머지 숫자 (열: 1~10)

    // 숫자 1 -> A, 2 -> B 변환
    const rowAlpha = String.fromCharCode(64 + rowNum);

    return `${floor}_${rowAlpha}${colNum}`; // 결과: B1_A1
  } catch (e) {
    return pos;
  }
};

const convertPosToNumeric = (pos) => {
  if (!pos || !pos.includes('_') || pos.startsWith('불법')) return pos;

  try {
    const [floor, alphaPos] = pos.split('_'); // B1, A1
    const rowAlpha = alphaPos.substring(0, 1).toUpperCase(); // A
    const colNum = alphaPos.substring(1); // 1, 10

    const rowNum = rowAlpha.charCodeAt(0) - 64; // A->1, B->2
    return `${floor}_${rowNum}${colNum}`; // B1_11
  } catch (e) {
    return pos;
  }
};
const getKorStatus = (status) => {
  if (!status) return '데이터없음';

  const s = String(status).toUpperCase();

  if (s === 'PARKED') return '주차완료';
  if (s === 'MOVING') return '이동중';
  if (s === 'ENTERING') return '입차중';
  if (s === 'EXITED') return '출차완료';

  return s;
};

const getStatusClass = (car) => {
  if (!car || !car.rawStatus) return 'bg-gray';

  const s = String(car.rawStatus).toUpperCase();

  if (s === 'PARKED') return 'bg-green';
  if (s === 'MOVING' || s === 'ENTERING') return 'bg-blue';
  if (s === 'EXITED') return 'bg-gray';

  return 'bg-gray';
};

// 날짜 + 시간 안전 변환
const getDateTimeValue = (car) => {
  const date = car?.date || getToday();
  const time = car?.inTime && car.inTime !== '-' ? car.inTime : '00:00:00';
  return new Date(`${date} ${time}`).getTime();
};
const getParkingDurationText = (car) => {
  if (!car) return '';

  const status = String(car.rawStatus || '').toUpperCase();

  // 주차중이 아니면 기존 상태 문구 위주로
  if (status === 'EXITED') return '출차완료';
  if (status === 'MOVING') return '현재 이동중';
  if (status === 'ENTERING') return '현재 입차중';
  if (status !== 'PARKED') return car.status || '상태확인중';

  const baseDate = car?.date || getToday();
  const baseTime = car?.inTime && car.inTime !== '-' ? car.inTime : '00:00:00';
  const enteredAt = new Date(`${baseDate}T${baseTime}`);

  if (Number.isNaN(enteredAt.getTime())) {
    return '현재 주차중';
  }

  const diffMs = Date.now() - enteredAt.getTime();

  if (diffMs < 0) {
    return '현재 주차중';
  }

  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  if (days > 0) {
    return `현재 ${days}일 ${hours}시간 ${String(mins).padStart(2, '0')}분 주차중`;
  }

  if (hours > 0) {
    return `현재 ${hours}시간 ${String(mins).padStart(2, '0')}분 주차중`;
  }

  return `현재 ${mins}분 주차중`;
};

const getParkingDurationHms = (car) => {
  if (!car) return '00:00:00';

  const baseDate = car?.date || getToday();
  const baseTime = car?.inTime && car.inTime !== '-' ? car.inTime : '00:00:00';
  const enteredAt = new Date(`${baseDate}T${baseTime}`);

  if (Number.isNaN(enteredAt.getTime())) return '00:00:00';

  let diffSec = Math.floor((Date.now() - enteredAt.getTime()) / 1000);
  if (diffSec < 0) diffSec = 0;

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
};
const getOccupancyGradient = (percent) => {
  if (percent >= 85) {
    return 'linear-gradient(90deg, #5d0d12 0%, #c8161d 70%, #e4474d 100%)'; // 빨강
  }
  if (percent >= 45) {
    return 'linear-gradient(90deg, #5a4308 0%, #b68a12 70%, #e0b323 100%)'; // 노랑
  }
  return 'linear-gradient(90deg, #0f4d24 0%, #178a3b 70%, #25c35a 100%)';   // 초록
};

const getOccupancyMainColor = (percent) => {
  if (percent >= 85) return '#c8161d';
  if (percent >= 45) return '#f8bc06';
  return '#22c55e';
};

const getDonutStyle = (percent) => {
  return {
    background: `conic-gradient(${getOccupancyMainColor(percent)} 0% ${percent}%, #7fc4ea ${percent}% 100%)`
  };
};
// ---------------------------------------------------------
// 3. 데이터 조회
// ---------------------------------------------------------
const fetchData = async () => {
  try {
    const response = await axios.get('http://localhost:9000/api/parking/status');
    const data = response?.data ?? {};
    const rawList = Array.isArray(data.vehicleList) ? data.vehicleList : [];

    // 1차: 기존 완전일치 키
    const prevMap = new Map(
      vehicleList.value.map((v) => [
        `${v.plate}|${v.date}|${v.inTime}|${v.pos}`,
        v
      ])
    );

    // 2차: 번호판/위치가 바뀌어도 이어붙일 수 있게 날짜+시간 키
    const prevTimeMap = new Map(
      vehicleList.value.map((v) => [
        `${v.date}|${v.inTime}`,
        v
      ])
    );

    vehicleList.value = rawList.map((car) => {
      const rawTime = car.entryTime || '';
      const parts = rawTime.split(' ');
      const datePart = parts[0] || getToday();
      const timePart = parts[1] || '-';

      const displayPos = convertPosToAlpha(car.location);

      const rowKey = `${car.vehicleNum || '번호판미식별'}|${datePart}|${timePart}|${displayPos}`;
      const timeKey = `${datePart}|${timePart}`;

      const prev = prevMap.get(rowKey) || prevTimeMap.get(timeKey);

      const rawStatus = car.status || prev?.rawStatus || '';
      const processStatus = car.processStatus || prev?.processStatus || '';
      const processedBy = car.processedBy || prev?.processedBy || '';

      return {
        date: datePart,
        pos: displayPos,
        plate: car.vehicleNum || prev?.plate || '번호판미식별',
        country: car.country || prev?.country || '대한민국',
        type: car.type || prev?.type || '일반',
        member: car.member || prev?.member || '비회원',
        inTime: timePart,
        stay: car.duration || prev?.stay || '-',

        // 응답이 비어 오면 이전 값 유지
        fullImg: car.fullImg || prev?.fullImg || '',
        plateImg: car.plateImg || prev?.plateImg || '',
        parkedImg: car.parkedImg || prev?.parkedImg || '',
        violationImg: car.violationImg || prev?.violationImg || '',

        status: getKorStatus(rawStatus),
        rawStatus: rawStatus,

        // 리스트 상태/담당자도 같이 보관
        processStatus: processStatus,
        processedBy: processedBy
      };
    });
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
    vehicleList.value = [];
  }
};
// ---------------------------------------------------------
// 4. 계산된 속성
// ---------------------------------------------------------
const searchResults = computed(() => {
  const keyword = searchPlate.value.replace(/\s+/g, '').toLowerCase();

  if (!keyword) return [];

  return [...vehicleList.value]
    .filter((car) =>
      String(car.plate || '')
        .replace(/\s+/g, '')
        .toLowerCase()
        .includes(keyword)
    )
    .sort((a, b) => getDateTimeValue(b) - getDateTimeValue(a))
    .slice(0, 8);
});

const appliedSearchResults = computed(() => {
  const keyword = appliedSearchKeyword.value.replace(/\s+/g, '').toLowerCase();
  if (!keyword) return [];

  let list = [...vehicleList.value];

  // 검색 결과 패널은 번호판 기준으로만 보여주기
  list = list.filter((car) =>
    String(car.plate || '')
      .replace(/\s+/g, '')
      .toLowerCase()
      .includes(keyword)
  );

  const order = sortOrder.value === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    const timeA = getDateTimeValue(a);
    const timeB = getDateTimeValue(b);
    return (timeA - timeB) * order;
  });

  return list;
});

const filteredVehicleList = computed(() => {
  let list = [...vehicleList.value];

  // 1) 날짜 필터
  if (startDate.value && endDate.value) {
    list = list.filter((car) => car.date >= startDate.value && car.date <= endDate.value);
  }

  // 2) 층별 필터
  if (selectedFloor.value !== '전체') {
    list = list.filter((car) => String(car.pos || '').startsWith(selectedFloor.value));
  }

  // 3) 정렬
  const order = sortOrder.value === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    const timeA = getDateTimeValue(a);
    const timeB = getDateTimeValue(b);
    return (timeA - timeB) * order;
  });

  return list;
});
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredVehicleList.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredVehicleList.value.length / itemsPerPage));
});

// 2. 현재 화면에 필터링된 리스트 중 '주차완료' 상태인 차들만 카운트
const currentCount = computed(() => {
  // filteredVehicleList는 이미 층별/번호별 필터가 적용된 상태입니다.
  return filteredVehicleList.value.filter(
    (car) => car.rawStatus.toUpperCase() === 'PARKED'
  ).length;
});

const totalCapacity = 200;

// 3. 남은 자리수 (해당 층 정원 - 현재 층 주차 대수)
const remainCount = computed(() => {
  return Math.max(0, currentCapacity.value - currentCount.value);
});

// 4. 점유율 계산 (현재 대수 / 현재 정원)
const currentRate = computed(() => {
  if (currentCapacity.value === 0) return 0;
  return Math.round((currentCount.value / currentCapacity.value) * 100);
});

const currentPercent = computed(() => currentRate.value);
const rotationRate = computed(() => {
  if (currentCapacity.value <= 0 || currentCount.value <= 0) return '0.0';
  return (currentCount.value / currentCapacity.value).toFixed(1);
});
const floorStats = computed(() => {
  return floorTabs.slice(1).map((id) => {
    const count = filteredVehicleList.value.filter((car) => {
      return (
        String(car.pos || '').startsWith(id) &&
        String(car.rawStatus).toUpperCase() === 'PARKED'
      );
    }).length;

    const rate = Math.round((count / 40) * 100);

    return {
      id,
      count,
      rate,
      color: getOccupancyGradient(rate)
    };
  });
});
const zoneStats = computed(() => {
  const stats = { A: 0, B: 0, C: 0, D: 0 };

  filteredVehicleList.value.forEach((car) => {
    if (
      car.rawStatus.toUpperCase() === 'PARKED' &&
      car.pos.includes('_')
    ) {
      const zoneStr = car.pos.split('_')[1];
      const zone = zoneStr ? zoneStr.charAt(0).toUpperCase() : null;
      if (zone && stats[zone] !== undefined) {
        stats[zone]++;
      }
    }
  });

  return Object.entries(stats).map(([name, count]) => {
    const total = selectedFloor.value === '전체' ? 50 : 10;
    const rate = Math.round((count / total) * 100);

    return {
      name: `${name}구역`,
      current: count,
      total,
      color: getOccupancyGradient(rate)
    };
  });
});
const applySearch = () => {
  appliedSearchKeyword.value = searchPlate.value.trim();
  searchDropdownOpen.value = false;

  selectedSearchCar.value = null;
  highlightedSpotId.value = '';

  currentPage.value = 1;
};


const applySearchResult = (car) => {
  searchPlate.value = car.plate;
  appliedSearchKeyword.value = car.plate;
  searchDropdownOpen.value = false;

  // 예전 맵 강조 흔적 제거
  selectedSearchCar.value = null;
  highlightedSpotId.value = '';

  currentPage.value = 1;
};

const clearAppliedSearch = () => {
  searchPlate.value = '';
  appliedSearchKeyword.value = '';
  searchDropdownOpen.value = false;

  selectedSearchCar.value = null;
  highlightedSpotId.value = '';
};
const getRowKey = (car) => {
  return `${car.date}|${car.inTime}|${car.pos}|${car.plate}`;
};



const getProcessedManager = (car) => {
  return car?.processedBy || rowUiState.value[getRowKey(car)]?.manager || '';
};



const getEntryDateTimeText = (car) => {
  if (!car) return '-';
  return `${car.date || '-'} ${car.inTime || '-'}`;
};

const getDisplayParkingPos = (car) => {
  return String(car?.pos || '-').replace('_', ' ');
};
const getDisplayCountry = (country) => {
  const c = String(country || '').toUpperCase();

  if (c === 'KOR' || c === 'UNK' || c === '대한민국') return '대한민국';
  if (c === 'CHN' || c === 'CHINA') return '중국';
  if (c === 'EUR' || c === 'EUROPE') return '유럽';
  if (c === 'IND' || c === 'INDIA') return '인도';
  if (c === 'BRA' || c === 'BRAZIL') return '브라질';

  return country;
};

const getDisplayMemberText = (member) => {
  const m = String(member || '').trim();

  if (!m) return '비회원';
  if (m === 'N' || m.toUpperCase() === 'NO') return '비회원';
  if (m === 'Y' || m.toUpperCase() === 'YES') return '회원';

  return m;
};
const getMemberYn = (car) => {
  return String(car?.member || '') === '회원' ? 'Y' : 'N';
};

const getListStatusInfo = (car) => {
  const dbStatus = String(car?.processStatus || '').trim();
  if (dbStatus === '수정') {
    return { text: '수정', cls: 'list-status-edit' };
  }

  const rowState = rowUiState.value[getRowKey(car)];
  if (rowState?.status === '수정') {
    return { text: '수정', cls: 'list-status-edit' };
  }

  return { text: '정상', cls: 'list-status-ok' };
};

const handleEditRow = (car) => {
  openEditModal(car);
};
const handleEditSave = async () => {
  if (!editCar.value) return;

  const newPlate = editForm.value.plate?.trim() || editCar.value.plate;
  const newPos = editForm.value.pos || editCar.value.pos;
  const newMember = editForm.value.member || editCar.value.member;
  const manager = currentLoginUser.value || '';

  try {
    await axios.put('http://localhost:9000/api/parking/edit', {
      oldVehicleNum: editCar.value.plate,
      vehicleNum: newPlate,
      location: convertPosToNumeric(newPos),
      member: newMember,
      status: 'PARKED',
      processStatus: '수정',
      processedBy: manager
    });

    const oldKey = getRowKey(editCar.value);

    vehicleList.value = vehicleList.value.map((car) => {
      if (
        car.plate === editCar.value.plate &&
        car.date === editCar.value.date &&
        car.inTime === editCar.value.inTime
      ) {
        const updated = {
          ...car,
          plate: newPlate,
          pos: newPos,
          member: newMember,
          rawStatus: car.rawStatus || 'PARKED',
          status: getKorStatus(car.rawStatus || 'PARKED'),
          processStatus: '수정',
          processedBy: manager
        };

        const newKey = getRowKey(updated);
        rowUiState.value[newKey] = {
          status: '수정',
          manager: manager
        };
        delete rowUiState.value[oldKey];

        return updated;
      }
      return car;
    });

    if (
      selectedCar.value &&
      selectedCar.value.plate === editCar.value.plate &&
      selectedCar.value.date === editCar.value.date &&
      selectedCar.value.inTime === editCar.value.inTime
    ) {
      selectedCar.value = {
        ...selectedCar.value,
        plate: newPlate,
        pos: newPos,
        member: newMember,
        rawStatus: selectedCar.value.rawStatus || 'PARKED',
        status: getKorStatus(selectedCar.value.rawStatus || 'PARKED'),
        processStatus: '수정',
        processedBy: manager
      };
    }

    // await fetchData();
    closeEditModal();
  } catch (error) {
    console.error('수정 저장 실패:', error);
    alert('수정 저장 실패');
  }
};

const getEditSpotStatus = (spotId) => {
  const fullPos = `${editSelectedFloor.value}_${spotId}`;

  const occupiedCar = vehicleList.value.find((car) => {
    return (
      car.pos === fullPos &&
      String(car.rawStatus || '').toUpperCase() === 'PARKED'
    );
  });

  const zone = spotId.substring(0, 1).toUpperCase();
  const num = parseInt(spotId.substring(1));
  const isEvZone = zone === 'D' && num >= 8 && num <= 10;

  if (occupiedCar) {
    return occupiedCar.type === '전기' ? 'ev-occupied' : 'occupied';
  }

  return isEvZone ? 'ev-empty' : 'empty';
};

const selectEditSpot = (spotId) => {
  const status = getEditSpotStatus(spotId);

  if (status === 'occupied' || status === 'ev-occupied') {
    editPickerMessage.value = '이미 주차된 공간입니다.';
    return;
  }

  editForm.value.pos = `${editSelectedFloor.value}_${spotId}`;
  editPickerMessage.value = `${editSelectedFloor.value}_${spotId} 선택 완료`;
  editPickerOpen.value = false;
};

// ---------------------------------------------------------
// 5. 화면 동작
// ---------------------------------------------------------
const getSpotStatus = (spotId) => {
  if (selectedFloor.value === '전체') return 'empty';

  const fullPos = `${selectedFloor.value}_${spotId}`;
  const car = vehicleList.value.find(
    (c) => c.pos === fullPos && String(c.rawStatus || '').toUpperCase() === 'PARKED'
  );

  const zone = spotId.substring(0, 1).toUpperCase();
  const num = parseInt(spotId.substring(1), 10);
  const isEvZone = zone === 'D' && num >= 8 && num <= 10;

  // 차가 들어가면 전기차칸이어도 그냥 주차중 색(노랑)으로
  if (car) return 'occupied';

  // 비어 있을 때만 전기차칸은 하늘색 테두리
  return isEvZone ? 'ev-empty' : 'empty';
};
const getPosFloor = (pos) => {
  const p = String(pos || '');
  if (!p.includes('_')) return 'B1';
  return p.split('_')[0];
};
const openDetailModal = (car) => {
  const latest = vehicleList.value.find((v) =>
    v.plate === car.plate &&
    v.date === car.date &&
    v.inTime === car.inTime &&
    v.pos === car.pos
  );

  selectedCar.value = { ...(latest || car) };
  snapshotVersion.value = Date.now();
  isDetailModalOpen.value = true;
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedCar.value = null;
};

const openEditModal = (car) => {
  editCar.value = { ...car };
  snapshotVersion.value = Date.now();
  editForm.value = {
    member: car?.member || '',
    pos: car?.pos || '',
    plate: car?.plate || ''
  };
  editSelectedFloor.value = getPosFloor(car?.pos);
  editPickerOpen.value = false;
  editPickerMessage.value = '';
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editCar.value = null;
  editPickerOpen.value = false;
  editPickerMessage.value = '';
};
const toggleEditPicker = () => {
  editPickerOpen.value = !editPickerOpen.value;
  editPickerMessage.value = '';
};
const goPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
// 1. 현재 선택된 층에 따른 총 수용량 (전체면 200, 아니면 층별 40)
const currentCapacity = computed(() => {
  return selectedFloor.value === '전체' ? 200 : 40;
});
// 검색/필터 바뀌면 1페이지로 이동
watch([startDate, endDate, selectedFloor, sortOrder], () => {
  currentPage.value = 1;
});
// totalPages 줄어들었는데 현재 페이지가 더 크면 보정
watch(totalPages, (newVal) => {
  if (currentPage.value > newVal) {
    currentPage.value = newVal;
  }
});
watch(vehicleList, (newList) => {
  if (!isDetailModalOpen.value || !selectedCar.value) return;

  const latest = newList.find((v) =>
    v.plate === selectedCar.value.plate &&
    v.date === selectedCar.value.date &&
    v.inTime === selectedCar.value.inTime &&
    v.pos === selectedCar.value.pos
  );

  if (latest) {
    selectedCar.value = { ...latest };
    snapshotVersion.value = Date.now();
  }
});
onMounted(() => {
  fetchData();
  refreshTimer = setInterval(fetchData, 5000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<style scoped>
/* ── 1. CSS 변수 및 기본 컨테이너 설정 (기존 :root, body 병합) ── */
.monitor-wrapper {
  /* 다크모드 컬러 변수 */
  --bg-main: #010409;
  --bg-card: #0d1117;
  --bg-sub: #161b22;
  --text-main: #e6edf3;
  --text-sub: #8b949e;
  --border: #30363d;
  --accent-blue: #58a6ff;
  --accent-yellow: #f8bc06;
  --accent-red: #f85149;
  --accent-green: #3fb950;

  /* Body 대체 스타일 */
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;

  /* 기존 컨테이너 스타일 */
  padding: 10px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-x: hidden;
  zoom: 0.82;
}

.monitor-wrapper *,
.monitor-wrapper *::before,
.monitor-wrapper *::after {
  box-sizing: inherit;
}

/* ── 2. 커스텀 스크롤바 (해당 컴포넌트 내부만 적용) ── */
.monitor-wrapper ::-webkit-scrollbar { width: 8px; height: 8px; }
.monitor-wrapper ::-webkit-scrollbar-track { background: var(--bg-card); }
.monitor-wrapper ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
.monitor-wrapper ::-webkit-scrollbar-thumb:hover { background: #484f58; }

/* ── 3. 공통 유틸리티 (상태 뱃지, 페이지네이션) ── */
.bg-blue { background: #054ada !important; color: #fff; }
.bg-green { background: #238636 !important; color: #fff; }
.bg-gray { background: #4b5563 !important; color: #fff; }

.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 20px; padding: 15px 0; border-top: 1px solid var(--border); background: var(--bg-card); }
.p-btn { background: var(--bg-sub); border: 1px solid var(--border); color: var(--text-main); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.p-btn:hover:not(:disabled) { background: #30363d; border-color: #8b949e; }
.p-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.p-info { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }

/* ── 4. 카드 및 상단 컨트롤 영역 ── */
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
.title { margin: 0; font-size: 1.25rem; font-weight: 600; }
.box-label { margin-top: 0; margin-bottom: 20px; font-size: 1.05rem; font-weight: 600; border-bottom: 1px solid var(--border); padding-bottom: 12px; }

.text-yellow { color: var(--accent-yellow); }
.text-blue { color: var(--accent-blue); }
.text-red { color: var(--accent-red); }
.trend.up { color: var(--accent-green); font-size: 0.85rem; font-weight: 600; }
.trend.down { color: var(--accent-red); font-size: 0.85rem; font-weight: 600; }

.control-row-1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
.right-tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.sort-select, .date-input, .search-box input { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 8px 12px; border-radius: 6px; outline: none; font-family: inherit; }
.sort-select:focus, .date-input:focus, .search-box input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 1px var(--accent-blue); }
.date-input { color-scheme: dark; }

.floor-tabs { display: flex; gap: 6px; }
.tab { background: var(--bg-sub); border: 1px solid var(--border); color: var(--text-sub); padding: 6px 16px; cursor: pointer; border-radius: 6px; font-weight: 600; transition: 0.2s; }
.tab:hover { background: #30363d; }
.tab.active { background: var(--accent-blue); color: #fff; border-color: var(--accent-blue); }

.control-row-2 { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.date-range { display: flex; align-items: center; gap: 10px; }

/* ── 5. 검색 영역 ── */
.search-box { display: flex; flex: 1 1 420px; gap: 8px; min-width: 0; }
.search-wrap { position: relative; flex: 1; }
.search-box input { width: 100%; box-sizing: border-box; }
.search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); z-index: 30; max-height: 320px; overflow-y: auto; }
.search-result-item { padding: 12px 14px; border-bottom: 1px solid var(--border); cursor: pointer; }
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: var(--bg-sub); }
.result-plate { font-size: 1rem; font-weight: bold; color: var(--text-main); }
.result-meta { margin-top: 4px; font-size: 0.85rem; color: var(--text-sub); }

.btn-search { background: var(--bg-sub); border: 1px solid var(--border); padding: 0 16px; border-radius: 6px; color: var(--text-main); cursor: pointer; font-weight: 600; }
.btn-search:hover { background: #30363d; }

.search-mode-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.search-mode-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.search-mode-item { background: var(--bg-sub); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; cursor: pointer; }
.search-mode-item:hover { border-color: var(--text-sub); }
.search-mode-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.search-mode-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.search-mode-plate { font-size: 1.05rem; font-weight: 700; color: var(--text-main); }
.search-mode-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-blue); }
.search-mode-member { font-size: 0.9rem; color: var(--text-sub); }
.search-mode-right { font-size: 0.92rem; color: var(--text-sub); text-align: right; }
.search-mode-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.clear-search-btn { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.empty-search-box { flex: 1; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-sub); }

/* ── 6. 중간 통계 및 맵 레이아웃 ── */
.mid-analysis { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; width: 100%; align-items: stretch; }
.status-box, .analysis-panel { width: 100%; min-width: 0; display: flex; flex-direction: column; }

.gauge-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.gauge-row { display: flex; align-items: center; gap: 16px; }
.f-name { width: 36px; font-weight: 700; font-size: 1.15rem; color: #ffffff; }
.bar-track { flex: 1; height: 58px; background: #141b22; border-radius: 8px; overflow: hidden; border: 1px solid #2b3640; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02); }
.bar-fill { height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 14px; font-size: 1.05rem; font-weight: 800; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.rate-val { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

.floor-map-container { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.parking-lot-map { width: 100%; max-width: 500px; margin: 0 auto; background: linear-gradient(180deg, #353b43 0%, #2b3139 100%); border-radius: 8px; border: 2px solid #8a9098; padding: 12px 14px; display: flex; flex-direction: column; justify-content: center; gap: 8px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
.map-row { display: grid; grid-template-columns: repeat(10, 1fr); width: 72%; margin: 0 auto; height: 56px; gap: 6px; }
.map-spot { cursor: pointer; width: 100%; min-width: 0; height: 100%; display: flex; align-items: flex-end; justify-content: center; font-size: 0.44rem; font-weight: 700; border-radius: 4px; color: rgba(255,255,255,0.88); border: 1px solid rgba(255,255,255,0.16); transition: 0.2s; box-sizing: border-box; padding-bottom: 4px; letter-spacing: -0.2px; background: rgba(255,255,255,0.03); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03); }
.road-aisle { width: 72%; margin: 0 auto; height: 18px; position: relative; display: flex; align-items: center; }
.road-aisle::after { content: ""; width: 100%; border-top: 1px dashed rgba(255,255,255,0.25); }
.map-island { display: flex; flex-direction: column; gap: 10px; }
.island-divider { height: 8px; background: transparent; margin: 0; }

.map-spot.empty { background: linear-gradient(180deg, #178a3b 0%, #22b14c 100%); border-color: #36d56b; color: #ecfff2; }
.map-spot.occupied { background: linear-gradient(180deg, #a9820f 0%, #d4a51d 100%); border-color: #f0c33c; color: #fff7d8; }
.map-spot.ev-empty { background: rgba(18, 27, 36, 0.88); border: 2px solid #8fd0f1; color: #d9f3ff; }
.map-spot.ev-occupied { background: linear-gradient(180deg, #a9820f 0%, #d4a51d 100%); border-color: #f0c33c; color: #fff7d8; }
.spot-highlight { outline: 2px solid var(--accent-blue); outline-offset: 2px; box-shadow: 0 0 10px rgba(88, 166, 255, 0.4); }

.map-legend { margin-top: 10px; display: flex; justify-content: center; gap: 20px; padding: 10px; background: var(--bg-card); border-radius: 6px; }
.l-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-sub); }
.l-box { width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--border); }
.l-box.empty { background: linear-gradient(180deg, #178a3b 0%, #22b14c 100%); border-color: #36d56b; }
.l-box.occupied { background: linear-gradient(180deg, #a9820f 0%, #d4a51d 100%); border-color: #f0c33c; }
.l-box.ev { background: rgba(18, 27, 36, 0.88); border-color: #8fd0f1; }

/* ── 7. 우측 분석 패널 (도넛/바 차트) ── */
.top-stats-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: var(--bg-main); border-radius: 8px; padding: 16px; border: 1px solid var(--border); }
.stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.s-title { color: var(--text-sub); font-size: 0.9rem; font-weight: 600; }
.stat-body { display: flex; align-items: baseline; gap: 6px; }
.s-val { font-size: 1.75rem; font-weight: bold; color: var(--text-main); }
.s-unit { color: var(--text-sub); font-size: 0.9rem; }

.mid-stats-grid { display: grid; grid-template-columns: 190px minmax(0, 1fr); align-items: center; gap: 20px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 20px 0; margin-bottom: 16px; }
.donut-container { display: flex; justify-content: center; align-items: center; }
.donut-chart-v3 { width: 180px; height: 180px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(0, 0, 0, 0.35); }
.donut-inner-v3 { width: 124px; height: 124px; background: #0f141a; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.55); border: 1px solid #24303a; }
.donut-title { font-size: 1rem; color: var(--text-sub); margin-bottom: 6px; }
.donut-val { font-size: 2.1rem; font-weight: 800; color: var(--accent-yellow); }

.zone-bars-container { min-width: 0; }
.zone-title { margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
.zone-item { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.z-name { width: 45px; font-size: 0.85rem; color: var(--text-sub); }
.z-bar-track { flex: 1; height: 8px; background: var(--bg-main); border-radius: 4px; border: 1px solid var(--border); overflow: hidden; }
.z-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.z-val { width: 50px; font-size: 0.85rem; color: var(--text-main); text-align: right; }

.bottom-stats-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.btm-stat-card { display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 14px 16px; border-radius: 8px; border: 1px solid var(--border); }
.b-label { color: var(--text-sub); font-size: 0.9rem; font-weight: 600; }

/* ── 8. 하단 리스트 영역 ── */
.bottom-list { display: flex; flex-direction: column; padding: 20px; }
.result-count { font-size: 0.85rem; font-weight: normal; color: var(--text-sub); margin-left: 10px; }
.table-scroll { max-height: 350px; overflow-y: auto; }
.db-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: center; }
.db-table thead { position: sticky; top: 0; background: var(--bg-card); z-index: 10; }
.db-table th { padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-sub); font-weight: 600; }
.db-table td { padding: 14px 10px; border-bottom: 1px solid var(--border); }

.row-item { cursor: pointer; transition: 0.15s; }
.row-item:hover { background: var(--bg-sub); }
.plate-num { color: var(--text-main); font-weight: bold; }
.parking-pos { color: var(--text-main); font-weight: 600; }
.member-yn { font-weight: 600; color: var(--text-sub); }

.list-status-wrap { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.list-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.list-status-ok { color: var(--accent-green); }
.list-status-ok .list-status-dot { background: var(--accent-green); }
.list-status-edit { color: var(--accent-yellow); }
.list-status-edit .list-status-dot { background: var(--accent-yellow); }

.row-actions { display: flex; justify-content: center; gap: 8px; }
.action-btn { min-width: 44px; height: 26px; padding: 0 10px; border-radius: 4px; background: transparent; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.action-btn.edit { border: 1px solid var(--border); color: var(--text-main); }
.action-btn.edit:hover { background: var(--bg-sub); border-color: var(--text-sub); }
.action-btn.delete { border: 1px solid rgba(248, 81, 73, 0.4); color: var(--accent-red); }
.action-btn.delete:hover { background: rgba(248, 81, 73, 0.1); }
.empty-cell { padding: 60px; color: var(--text-sub); text-align: center; }

/* ── 9. 모달창 공통 ── */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(1, 4, 9, 0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.detail-modal-card { width: 760px; max-width: 92vw; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5); }
.detail-close-btn { position: absolute; top: 12px; right: 16px; z-index: 5; width: 32px; height: 32px; border: none; border-radius: 6px; background: var(--bg-sub); color: var(--text-sub); font-size: 16px; cursor: pointer; transition: 0.2s; }
.detail-close-btn:hover { background: #30363d; color: var(--text-main); }

.detail-modal-layout { display: grid; grid-template-columns: 310px 1fr; min-height: 285px; }
.detail-left-panel { display: grid; grid-template-rows: 215px 82px; background: var(--bg-main); border-right: 1px solid var(--border); }
.detail-main-image-box { overflow: hidden; background: #000; }
.detail-main-image { width: 100%; height: 100%; object-fit: cover; }
.detail-no-image { width: 100%; height: 100%; color: var(--text-sub); display: flex; align-items: center; justify-content: center; }
.detail-plate-preview-box { padding: 8px; border-top: 1px solid var(--border); }
.detail-plate-preview { width: 100%; height: 100%; object-fit: contain; }
.detail-no-plate { width: 100%; height: 100%; color: var(--text-sub); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }

.detail-right-panel { display: flex; flex-direction: column; }
.detail-info-row { display: grid; grid-template-columns: 120px 1fr; min-height: 57px; border-bottom: 1px solid var(--border); }
.detail-info-row:last-child { border-bottom: none; }
.detail-info-label { display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: var(--text-sub); background: var(--bg-sub); }
.detail-info-value { display: flex; align-items: center; padding: 0 20px; font-size: 1rem; font-weight: 600; color: var(--text-main); }
.detail-info-highlight { color: var(--accent-blue); font-size: 1.1rem; }

/* ── 10. 수정 모달창 ── */
.parking-edit-modal { width: 520px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5); }
.parking-edit-top { display: grid; grid-template-columns: 1fr 1fr; height: 160px; border-bottom: 1px solid var(--border); }
.parking-edit-main-image { background: #000; overflow: hidden; border-top-left-radius: 12px; }
.main-snap { width: 100%; height: 100%; object-fit: cover; }
.parking-edit-plate-box { background: var(--bg-main); display: flex; align-items: center; justify-content: center; border-left: 1px solid var(--border); border-top-right-radius: 12px; }
.parking-edit-plate-image { width: 100%; height: 100%; object-fit: contain; }

.parking-edit-body { padding: 20px; }
.parking-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.parking-edit-field { display: flex; flex-direction: column; gap: 8px; }
.parking-edit-field-full { grid-column: 1 / 3; }
.parking-edit-field label { font-size: 0.9rem; color: var(--text-sub); font-weight: 600; }
.parking-edit-input, .parking-pos-picker-btn { height: 42px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); padding: 0 12px; font-size: 0.95rem; text-align: left; transition: 0.2s; }
.parking-pos-picker-btn { cursor: pointer; }
.parking-pos-picker-btn:hover, .parking-edit-input:focus { border-color: var(--text-sub); }

.parking-picker-wrap { margin-top: 16px; padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); }
.parking-picker-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.picker-tab { min-width: 50px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-sub); cursor: pointer; font-weight: 600; }
.picker-tab.active { background: var(--accent-blue); border-color: var(--accent-blue); color: #fff; }
.parking-picker-message { margin-bottom: 12px; color: var(--accent-yellow); font-size: 0.9rem; font-weight: 600; }
.parking-picker-map { background: var(--bg-card); border-radius: 8px; padding: 16px; border: 1px solid var(--border); }
.picker-spot { cursor: pointer; }
.picker-spot:hover { outline: 2px solid var(--text-main); outline-offset: -2px; }

.parking-edit-actions { display: flex; gap: 12px; padding: 0 20px 20px 20px; }
.btn-edit-save, .btn-edit-delete { flex: 1; height: 44px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-edit-save { background: var(--accent-blue); border: none; color: #fff; }
.btn-edit-save:hover { background: #318bf0; }
.btn-edit-delete { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn-edit-delete:hover { background: var(--bg-sub); }

/* ── 11. 애니메이션 및 반응형 ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 1500px) {
  .monitor-wrapper { zoom: 0.82; }
  .mid-analysis { grid-template-columns: 1fr; }
}
</style>