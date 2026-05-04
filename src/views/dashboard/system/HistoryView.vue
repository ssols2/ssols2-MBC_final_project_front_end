<template>
  <div class="history-container">
    <header class="view-header">
      <h3 class="view-title">통합 알림 및 장애 이력</h3>

      <div class="filter-bar history-glass">
        <!-- 1. 유형 필터 (전체/EV/OCR) -->
        <div class="filter-group">
          <label>알림 유형</label>
          <select v-model="filterType" class="admin-select type-select">
            <option value="ALL">전체 유형</option>
            <option value="EV">EV 예지보전</option>
            <option value="OCR">OCR 차량관제</option>
          </select>
        </div>

        <!-- 2. EV 전용 필터 (유형이 ALL이거나 EV일 때만 표시) -->
        <template v-if="filterType === 'ALL' || filterType === 'EV'">
          <div class="filter-group">
            <label>층별(EV)</label>
            <select v-model="filterFloor" class="admin-select">
              <option value="ALL">전체 층</option>
              <option value="1F">1F</option>
              <option value="2F">2F</option>
              <option value="3F">3F</option>
              <option value="4F">4F</option>
              <option value="5F">5F</option>
            </select>
          </div>
          <div class="filter-group">
            <label>상태(EV)</label>
            <select v-model="filterEvStatus" class="admin-select">
              <option value="ALL">전체 상태</option>
              <option value="RISK">위험(RISK)</option>
              <option value="CHECK">점검(CHECK)</option>
              <option value="FAULT">고장(FAULT)</option>
            </select>
          </div>
        </template>

        <!-- 3. OCR 전용 필터 (유형이 ALL이거나 OCR일 때만 표시) -->
        <template v-if="filterType === 'ALL' || filterType === 'OCR'">
          <div class="filter-group">
            <label>확인(OCR)</label>
            <select v-model="filterOcrProcess" class="admin-select">
              <option value="ALL">전체</option>
              <option value="PENDING">미확인</option>
              <option value="DONE">확인완료</option>
            </select>
          </div>
        </template>

        <!-- 검색창 -->
        <div class="search-group">
          <input type="text" v-model="searchQuery" placeholder="기기 ID 또는 내용 검색..." class="admin-input" />
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>
    </header>

    <div class="table-container history-glass custom-scroll">
      <table class="admin-list-table">
        <thead>
          <tr>
            <th style="width: 180px;">발생 일시</th>
            <th style="width: 120px;">기기/차량 ID</th>
            <th style="width: 120px;">유형</th>
            <th>장애 및 이상 징후 상세 내역</th>
            <th style="width: 120px;">처리 상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-row">데이터를 불러오는 중입니다...</td>
          </tr>
          <tr v-else-if="paginatedLogs.length === 0">
            <td colspan="5" class="empty-row">조회된 이력이 없습니다</td>
          </tr>
          <!-- 페이지네이션이 적용된 paginatedLogs 사용 -->
          <tr v-for="(log, index) in paginatedLogs" :key="index" @click="goToDetail(log)">
            <td class="time-col">{{ log.time }}</td>
            <td class="id-col">{{ log.chargerId }}</td>
            <td>
              <span :class="['type-badge', log.type === 'ev' ? log.status.toLowerCase() : 'ocr']">
                {{ log.typeLabel }}
              </span>
            </td>
            <td class="content-col">{{ log.content }}</td>
            <td>
              <span :class="['process-badge', log.processStatus.toLowerCase()]">
                {{ log.processLabel }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. 하단 페이지네이션 -->
    <footer class="history-footer">
      <span class="total-count">검색 결과: <strong>{{ filteredLogs.length }}</strong>건</span>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-nav" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">‹</button>
        <button v-for="p in visiblePages" :key="p" class="page-number" :class="{ active: currentPage === p }"
          @click="changePage(p)">
          {{ p }}
        </button>
        <button class="page-nav" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">›</button>
      </div>

      <span class="update-info">마지막 동기화: {{ lastSyncTime }}</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const evLogs = ref([])
const lastSyncTime = ref('-')
const loading = ref(false)

// 🚨 필터 상태 변수
const filterType = ref('ALL')
const filterFloor = ref('ALL')
const filterEvStatus = ref('ALL')
const filterOcrProcess = ref('ALL')
const searchQuery = ref('')

// 페이지네이션 변수
const currentPage = ref(1)
const itemsPerPage = 10

// 실시간 동기화 타이머
let syncTimer = null

// 실시간 데이터 페칭 및 가공
const fetchEvLogs = async () => {
  loading.value = evLogs.value.length === 0
  try {
    // 1. [수정] EV 실제 장애 이력(DB) 가져오기 (파이썬 8003 포트 API 사용)
    let realEvLogs = []
    try {
      const evRes = await axios.get('http://localhost:8003/issue-log', { params: { limit: 500 } })
      realEvLogs = evRes.data.map(r => {
        const floor = r.ev_charger_id ? r.ev_charger_id.split('-')[0] : 'ALL'

        let pLabel = '미처리'
        let pStatus = 'PENDING'
        if (r.process_status === 'DONE') {
          pLabel = '조치완료'
          pStatus = 'DONE'
        } else if (r.process_status === 'IN_PROGRESS' || r.process_status === 'REQUESTED') {
          pLabel = '점검중'
          pStatus = 'IN_PROGRESS'
        } else if (r.process_status === 'STATUS_UPDATED') {
          pLabel = '상태업데이트'
          pStatus = 'UPDATED'
        }

        return {
          id: `ev-${r.ev_issue_log_id}`,
          time: r.occurred_time ? r.occurred_time.replace('T', ' ').substring(0, 19) : '',
          timestamp: new Date(r.occurred_time).getTime(),
          chargerId: r.ev_charger_id,
          floor: floor,
          status: r.issue_status, // RISK, CHECK, FAULT
          type: 'ev',
          typeLabel: '예지보전',
          content: r.detail_content || '이상 징후 감지',
          processStatus: pStatus,
          processLabel: pLabel
        }
      })
    } catch (e) { console.error('EV 이력 로드 실패:', e) }

    // 2. OCR 저정확도 로그 가져오기
    let realOcrLogs = []
    try {
      const ocrRes = await axios.get('http://localhost:8080/parking-log/logs')

      // 정확도 85% 미만 필터링
      const ocrIssues = ocrRes.data.filter(log => log.ocrAccuracy > 0 && log.ocrAccuracy < 85)

      // LocalStorage에서 읽음(확인완료) 처리된 내역 가져오기
      const savedOcrAlerts = JSON.parse(localStorage.getItem('readOcrAlerts') || '[]')
      const readOcrSet = new Set(savedOcrAlerts)

      realOcrLogs = ocrIssues.map(log => {
        const logId = `ocr-${log.parkingLogId}`
        const isRead = readOcrSet.has(logId) // Set에 있으면 확인완료

        return {
          id: logId,
          time: log.entryTime ? log.entryTime.replace('T', ' ').substring(0, 19) : '',
          timestamp: log.entryTime ? new Date(log.entryTime).getTime() : 0,
          chargerId: log.vehicleNum,
          floor: 'ALL',
          status: 'OCR',
          type: 'ocr',
          typeLabel: 'OCR인식',
          content: `번호판 오인식 위험: 정확도 ${Math.round(log.ocrAccuracy)}%`,
          processStatus: isRead ? 'DONE' : 'PENDING',
          processLabel: isRead ? '확인완료' : '미확인'
        }
      })
    } catch (e) { console.error('OCR 이력 로드 실패:', e) }

    // 3. 합쳐서 최신순 정렬
    evLogs.value = [...realEvLogs, ...realOcrLogs].sort((a, b) => b.timestamp - a.timestamp)
    lastSyncTime.value = new Date().toLocaleTimeString()

  } catch (e) {
    console.error('이력 통합 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

// 동적 필터링 적용 로직
const filteredLogs = computed(() => {
  return evLogs.value.filter(log => {
    // 1. 알림 유형 필터
    if (filterType.value !== 'ALL' && log.type !== filterType.value.toLowerCase()) return false

    // 2. EV 전용 필터
    if (filterType.value === 'ALL' || filterType.value === 'EV') {
      if (log.type === 'ev') {
        if (filterFloor.value !== 'ALL' && log.floor !== filterFloor.value) return false
        if (filterEvStatus.value !== 'ALL' && log.status !== filterEvStatus.value) return false
      }
    }

    // 3. OCR 전용 필터
    if (filterType.value === 'ALL' || filterType.value === 'OCR') {
      if (log.type === 'ocr') {
        if (filterOcrProcess.value !== 'ALL' && log.processStatus !== filterOcrProcess.value) return false
      }
    }

    // 4. 검색 필터
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchId = log.chargerId?.toLowerCase().includes(q)
      const matchContent = log.content?.toLowerCase().includes(q)
      if (!matchId && !matchContent) return false
    }

    return true
  })
})

// 페이지네이션 로직
const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / itemsPerPage)))
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredLogs.value.slice(start, start + itemsPerPage)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const arr = []
  const left = Math.max(1, cur - 2)
  const right = Math.min(total, left + 4)
  for (let i = left; i <= right; i++) arr.push(i)
  return arr
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// 필터 변경 시 무조건 1페이지로 리셋
watch([filterType, filterFloor, filterEvStatus, filterOcrProcess, searchQuery], () => {
  currentPage.value = 1
})

// 클릭 시 상세 화면으로 이동
const goToDetail = (log) => {
  if (log.type === 'ev') {
    router.push({ path: '/dashboard/ev-infra', query: { tab: 'predictive', chargerId: log.chargerId } })
  } else if (log.type === 'ocr') {
    // 목록에서 클릭해서 이동해도 자동으로 읽음 처리됨
    const savedOcrAlerts = JSON.parse(localStorage.getItem('readOcrAlerts') || '[]')
    const readOcrSet = new Set(savedOcrAlerts)
    readOcrSet.add(log.id)
    localStorage.setItem('readOcrAlerts', JSON.stringify([...readOcrSet]))

    router.push({ path: '/dashboard/vehicle-control', query: { search: log.chargerId } })
  }
}

onMounted(() => {
  fetchEvLogs()
  // 15초마다 실시간 동기화
  syncTimer = setInterval(fetchEvLogs, 15000)
})

onUnmounted(() => {
  if (syncTimer) clearInterval(syncTimer)
})
</script>

<style scoped>
/* 통합 알림 및 장애 이력 CSS */
.history-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 17px;
  /* 17px 규격 적용 */
  padding: 0 4px;
  box-sizing: border-box;
  color: #f5f5f5;
  font-family: 'Pretendard', sans-serif;
}

.view-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-title {
  border-left: 5px solid #82c2e3;
  padding-left: 17px;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

/* 필터바 영역 */
.filter-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 17px;
  box-sizing: border-box;
  flex-wrap: wrap;
  background: rgba(68, 77, 86, 0.3) !important;
  border: 1px solid rgba(245, 245, 245, 0.08) !important;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-size: 18px;
  color: rgba(245, 245, 245, 0.6);
  font-weight: 500;
}

.admin-select {
  background: #444D56;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #fff;
  padding: 6px 12px;
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  font-size: 16px;
}

.search-group {
  margin-left: auto;
  position: relative;
  width: 280px;
}

.admin-input {
  width: 100%;
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #fff;
  padding: 8px 12px 8px 35px;
  border-radius: 5px;
  font-size: 16px;
  outline: none;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(245, 245, 245, 0.4);
}

/* 테이블 영역 */
.table-container {
  width: 100%;
  background: rgba(68, 77, 86, 0.3) !important;
  border: 1px solid rgba(245, 245, 245, 0.08) !important;
  border-radius: 10px;
  overflow: hidden;
  max-height: calc(100vh - 280px);
}

.admin-list-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.admin-list-table th {
  background: rgba(15, 23, 42, 0.4);
  padding: 17px 10px;
  text-align: center;
  font-size: 18px;
  color: rgba(245, 245, 245, 0.6);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.admin-list-table td {
  padding: 17px 10px;
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
  font-size: 16px;
  font-weight: 500;
  color: #f5f5f5;
}

.admin-list-table tbody tr:hover {
  background: rgba(130, 194, 227, 0.1);
}

.id-col {
  font-weight: 700;
  color: #82c2e3;
}

/* 배지 스타일 */
.type-badge {
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  min-width: 70px;
}

.type-badge.risk,
.type-badge.fault {
  background: rgba(255, 0, 0, 0.1);
  color: #ff0000;
  border: 1px solid #ff0000;
}

.type-badge.check {
  background: rgba(251, 185, 0, 0.1);
  color: #fbb900;
  border: 1px solid #fbb900;
}

.type-badge.ocr {
  background: rgba(130, 194, 227, 0.1);
  color: #82c2e3;
  border: 1px solid #82c2e3;
}

.process-badge {
  padding: 4px 12px;
  font-size: 14px;
  border-radius: 5px;
  background: rgba(245, 245, 245, 0.1);
  color: rgba(245, 245, 245, 0.6);
  font-weight: 600;
}

.process-badge.done {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.process-badge.in_progress {
  background: rgba(251, 185, 0, 0.2);
  color: #fbb900;
}

.process-badge.updated {
  background: rgba(130, 194, 227, 0.2);
  color: #82c2e3;
}

/* 페이지네이션 */
.history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px;
}

.pagination {
  display: flex;
  gap: 6px;
}

.page-nav,
.page-number {
  background: transparent;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: rgba(245, 245, 245, 0.6);
  width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
}

.page-number.active {
  background: #82c2e3;
  border-color: #82c2e3;
  color: #000;
}
</style>