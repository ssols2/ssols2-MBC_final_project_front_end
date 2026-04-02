<template>
    <div class="control-container">

        <div class="page-header">
            <div class="header-title-area">
                <h2 class="page-title">출입 차량 관리</h2>
                <div class="tab-group">
                    <button class="tab-btn" :class="{ active: activeTab === 'log' }" @click="activeTab = 'log'">
                        입출차 로그
                    </button>
                    <button class="tab-btn" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
                        주차 예측 통계
                    </button>
                </div>
            </div>
        </div>

        <div v-show="activeTab === 'log'" class="tab-content">
            <div class="filter-bar">
                <div class="date-range">
                    <input type="text" class="date-input" value="26.02.13 - 26.03.13" readonly />
                    <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="search-box">
                    <input type="text" placeholder="차량번호 검색(예: 12가 4567)" />
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>

            <div class="placeholder-box">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#3f3f46" stroke-width="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p>입출차 로그 데이터 연동 준비 중입니다.</p>
            </div>
        </div>

        <div v-show="activeTab === 'stats'" class="tab-content">

            <div class="stats-header-bar">
                <div class="date-range">
                    <input type="date" v-model="startDate" :max="maxAllowedDate" class="date-input"
                        @change="fetchShortData" />
                    <span class="date-sep">-</span>
                    <input type="date" v-model="endDate" :max="maxAllowedDate" class="date-input"
                        @change="fetchShortData" />
                </div>

                <button class="info-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    주차 예측 데이터
                </button>
            </div>

            <div class="chart-row">
                <div class="chart-card">
                    <div class="card-title-wrap">
                        <h3 class="card-title">AI 단기 혼잡도 예측 <span class="sub-text">(시간별, ~Today ~ D+3)</span></h3>
                        <div class="legend-custom">
                            <span class="l-item"><span class="legend-line dashed-mainblue"></span>실제 입차 대수</span>
                            <span class="l-item"><span class="legend-line dashed-blue"></span>AI 예상 대수</span>
                        </div>
                    </div>
                    <div class="chart-wrap">
                        <div v-if="shortLoading" class="chart-loading">데이터 불러오는 중...</div>
                        <canvas ref="shortChartRef" :style="{ opacity: shortLoading ? 0 : 1 }"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="card-title-wrap">
                        <h3 class="card-title">AI 중기 혼잡도 예측 <span class="sub-text">(요일별, D+4 ~ D+11)</span></h3>
                        <div class="legend-custom">
                            <span class="l-item"><span class="legend-line dashed-og"></span>예측 주차 대수</span>
                        </div>
                    </div>
                    <div class="chart-wrap">
                        <div v-if="midLoading" class="chart-loading">데이터 불러오는 중...</div>
                        <canvas ref="midChartRef" :style="{ opacity: midLoading ? 0 : 1 }"></canvas>
                    </div>
                </div>
            </div>

            <div class="table-card">
                <div class="table-header">
                    <div class="th-left">
                        <h3 class="card-title">기간별 입차 기록</h3>
                        <span class="record-count">전체({{ filteredTableData.length }})</span>
                        <select v-model="congestionFilter" class="dark-select">
                            <option value="">혼잡도 (전체)</option>
                            <option value="여유">🟢 여유</option>
                            <option value="보통">🟡 보통</option>
                            <option value="혼잡">🔴 혼잡</option>
                            <option value="만차주의">⚫ 만차주의</option>
                        </select>
                    </div>
                    <div class="th-right">
                        <select v-model="sortOrder" class="dark-select plain">
                            <option value="desc">최신순</option>
                            <option value="asc">오래된순</option>
                        </select>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="dark-table">
                        <thead>
                            <tr>
                                <th>일시</th>
                                <th>예측 주차대수</th>
                                <th>실제 입차 대수</th>
                                <th>오차 (정확도)</th>
                                <th>혼잡도</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="shortLoading">
                                <td colspan="5" class="empty-msg">데이터 불러오는 중...</td>
                            </tr>
                            <tr v-else-if="filteredTableData.length === 0">
                                <td colspan="5" class="empty-msg">데이터가 없습니다.</td>
                            </tr>
                            <tr v-for="(row, idx) in pagedTableData" :key="idx">
                                <td>{{ row.datetime }}</td>
                                <td class="text-blue">{{ row.predicted }}대</td>
                                <td class="text-blue">{{ row.actual != null ? row.actual + '대' : '-' }}</td>
                                <td>
                                    <span v-if="row.actual != null" :class="errorClass(row)">{{ errorLabel(row)
                                        }}</span>
                                    <span v-else class="text-gray">-</span>
                                </td>
                                <td>
                                    <span class="status-dot" :class="congestionBadgeClass(row.congestionLabel)"></span>
                                    <span :class="congestionBadgeClass(row.congestionLabel, true)">{{
                                        row.congestionLabel }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="page-btn" @click="goToPage(1)" :disabled="currentPage === 1">«</button>
                    <button class="page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">‹</button>
                    <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }"
                        @click="goToPage(p)">
                        {{ p }}
                    </button>
                    <button class="page-btn" @click="goToPage(currentPage + 1)"
                        :disabled="currentPage === totalPages">›</button>
                    <button class="page-btn" @click="goToPage(totalPages)"
                        :disabled="currentPage === totalPages">»</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import axios from 'axios'

// ── 날짜 유틸 ────────────────────────────────────────────────
const getTodayString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const getDaysLaterString = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatLocalDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']
const getDowLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return `${dateStr.slice(5)} (${DOW_KO[d.getDay()]})`
}

// ── 상태 ─────────────────────────────────────────────────────
const activeTab = ref('stats')
const startDate = ref(getTodayString())
const endDate = ref(getTodayString())
const maxAllowedDate = ref(getDaysLaterString(2))

const shortChartRef = ref(null)
const midChartRef = ref(null)
let shortChartInstance = null
let midChartInstance = null

const shortData = ref([])
const midData = ref([])
const shortLoading = ref(false)
const midLoading = ref(false)

// 테이블 상태
const tableData = ref([])
const congestionFilter = ref('')
const sortOrder = ref('desc')
const currentPage = ref(1)
const rowsPerPage = 10

// ── 혼잡도 (200대 기준) ────────────────────────────────────────
const MAX_CARS = 200
const getCongestionLabel = (actual) => {
    if (actual == null) return '-'
    const pct = (actual / MAX_CARS) * 100
    if (pct >= 100) return '만차주의'
    if (pct >= 80) return '혼잡'
    if (pct >= 50) return '보통'
    return '여유'  // 0% 이상 50% 미만
}
// UI 맞춤용 CSS 변환
const congestionBadgeClass = (label, isText = false) => {
    if (label === '만차주의') return isText ? 'text-dark' : 'bg-dark'
    if (label === '혼잡') return isText ? 'text-red' : 'bg-red'
    if (label === '보통') return isText ? 'text-yellow' : 'bg-yellow'
    if (label === '여유') return isText ? 'text-green' : 'bg-green'
    return isText ? 'text-gray' : 'bg-gray'
}

// ── 오차 표시 ─────────────────────────────────────────────────
const errorLabel = (row) => {
    const diff = row.predicted - row.actual
    const sign = diff >= 0 ? '+' : ''
    const pct = row.actual > 0
        ? Math.round(100 - (Math.abs(diff) / row.actual) * 100)
        : null
    return pct != null
        ? `${sign}${diff}대 (${pct}%)`
        : `${sign}${diff}대`
}
const errorClass = (row) => {
    const diff = row.predicted - row.actual
    const pct = row.actual > 0 ? (Math.abs(diff) / row.actual) * 100 : 0
    if (pct <= 10) return 'error-good'
    if (pct <= 20) return 'error-ok'
    return 'error-bad'
}

// ── 필터 & 정렬 & 페이지네이션 ───────────────────────────────
// const filteredTableData = computed(() => {
//     let rows = congestionFilter.value
//         ? tableData.value.filter(r => r.congestionLabel === congestionFilter.value)
//         : [...tableData.value]

//     rows.sort((a, b) =>
//         sortOrder.value === 'desc'
//             ? b.datetime.localeCompare(a.datetime)
//             : a.datetime.localeCompare(b.datetime)
//     )
//     return rows
// })
const filteredTableData = computed(() => {
    // 1. 일단 원본 데이터 복사
    let rows = [...tableData.value]

    // 2. 혼잡도 필터 적용 (값이 있을 때만)
    if (congestionFilter.value) {
        rows = rows.filter(r => r.congestionLabel === congestionFilter.value)
    }

    // 3. 정렬 적용
    rows.sort((a, b) => {
        return sortOrder.value === 'desc'
            ? b.datetime.localeCompare(a.datetime)
            : a.datetime.localeCompare(b.datetime)
    })

    return rows
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTableData.value.length / rowsPerPage)))
const pagedTableData = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage
    return filteredTableData.value.slice(start, start + rowsPerPage)
})
const pageNumbers = computed(() => {
    const total = totalPages.value
    const cur = currentPage.value
    const range = []
    const left = Math.max(1, cur - 2)
    const right = Math.min(total, cur + 2)
    for (let i = left; i <= right; i++) range.push(i)
    return range
})

const goToPage = (p) => {
    if (p < 1 || p > totalPages.value) return
    currentPage.value = p
}

watch([congestionFilter, sortOrder], () => { currentPage.value = 1 })

// ── 테이블 데이터 빌드 ────────────────────────────────────────
const buildTableData = (dbData, start, end) => {
    const [sy, sm, sd] = start.split('-').map(Number)
    const [ey, em, ed] = end.split('-').map(Number)
    const cursor = new Date(sy, sm - 1, sd)
    const endD = new Date(ey, em - 1, ed)

    const dates = []
    while (cursor <= endD) {
        dates.push(formatLocalDate(cursor))
        cursor.setDate(cursor.getDate() + 1)
    }

    const now = new Date()
    const todayStr = formatLocalDate(now)
    const endIsFuture = end > todayStr

    let ceilTime = '99:99'
    if (!endIsFuture) {
        const nowH = now.getHours()
        const nowM = now.getMinutes()
        let ceilH = nowH
        let ceilM
        if (nowM < 30) {
            ceilM = 30
        } else {
            ceilM = 0
            ceilH = nowH + 1
        }
        ceilTime = ceilH >= 24
            ? '99:99'
            : `${String(ceilH).padStart(2, '0')}:${String(ceilM).padStart(2, '0')}`
    }

    const rows = []
    dates.forEach(date => {
        dbData.forEach(item => {
            if (!endIsFuture && date === todayStr && item.time > ceilTime) return
            const predicted = item.predictedCars ?? 0
            const actual = item.actualCars ?? null
            rows.push({
                datetime: `${date} ${item.time}`,
                predicted,
                actual,
                congestionLabel: getCongestionLabel(actual),
            })
        })
    })
    return rows
}

// ── [좌] 초단기/단기 선 그래프 ────────────────────────────────
const fetchShortData = async () => {
    if (startDate.value > endDate.value) {
        alert('시작일은 종료일보다 이전이어야 합니다.')
        return
    }
    if (endDate.value > maxAllowedDate.value) {
        alert('시간대별 단기 예측은 최대 3일(72시간)까지만 조회 가능합니다.')
        endDate.value = maxAllowedDate.value
        return
    }
    shortLoading.value = true
    try {
        const res = await axios.get('http://localhost:8080/dashBoard/parkingChart/short', {
            params: { startDate: startDate.value, endDate: endDate.value }
        })
        shortData.value = res.data

        const allSlots = []
        for (let h = 0; h < 24; h++) {
            allSlots.push(`${String(h).padStart(2, '0')}:00`)
            allSlots.push(`${String(h).padStart(2, '0')}:30`)
        }
        const predList = new Array(48).fill(null)
        const actualList = new Array(48).fill(null)
        res.data.forEach(item => {
            const idx = allSlots.indexOf(item.time)
            if (idx !== -1) {
                predList[idx] = item.predictedCars
                actualList[idx] = item.actualCars
            }
        })

        if (shortChartInstance) shortChartInstance.destroy()
        shortChartInstance = new Chart(shortChartRef.value, {
            type: 'line',
            data: {
                labels: allSlots,
                datasets: [
                    {
                        label: '예측 주차대수',
                        data: predList,
                        borderColor: '#82c2e3',
                        backgroundColor: 'rgba(79,134,247,0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 2,
                        borderWidth: 2,
                    },
                    {
                        label: '실제 주차대수',
                        data: actualList,
                        borderColor: '#005baa',
                        backgroundColor: 'rgba(52,196,139,0.06)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 2,
                        borderWidth: 2,
                        borderDash: [5, 3],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                //plugins: { legend: { position: 'top' } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}대`
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '주차 대수 (대)', color: '#f5f5f5a9' }, ticks: { stepSize: 5, color: '#f5f5f5a9' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { ticks: { maxTicksLimit: 12, color: '#f5f5f5a9', } },
                },
            },
        })

        tableData.value = buildTableData(res.data, startDate.value, endDate.value)
        currentPage.value = 1

    } catch (e) {
        console.error('[ShortTerm] 차트 데이터 로드 실패', e)
    } finally {
        shortLoading.value = false
    }
}

// ── [우] 중기 막대 그래프 ──────────────────────────────────────
const fetchMidData = async () => {
    midLoading.value = true
    try {
        const res = await axios.get('http://localhost:8080/dashBoard/parkingChart/mid')
        midData.value = res.data
        const labels = res.data.map(d => getDowLabel(d.date))
        const predList = res.data.map(d => d.predictedCars)

        if (midChartInstance) midChartInstance.destroy()
        midChartInstance = new Chart(midChartRef.value, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '예측 주차대수',
                    data: predList,
                    backgroundColor: '#fbb900', // 시안 반영 옐로우
                    borderRadius: 4,
                    barPercentage: 0.5,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `예측 주차대수: ${ctx.parsed.y}대`
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '주차 대수 (대)', color: '#f5f5f5a9' }, ticks: { stepSize: 5, color: '#f5f5f5a9' } },
                    x: { title: { display: true, text: '예측 날짜', color: '#f5f5f5a9' }, ticks: { maxTicksLimit: 12, color: '#f5f5f5a9' } },
                },
            },
        })
    } catch (e) {
        console.error('[MidTerm] 차트 데이터 로드 실패', e)
    } finally {
        midLoading.value = false
    }
}

// ── 생명주기 및 탭 감시 ──────────────────────────────────────
onMounted(() => {
    if (activeTab.value === 'stats') {
        fetchShortData()
        fetchMidData()
    }
})

onUnmounted(() => {
    if (shortChartInstance) shortChartInstance.destroy()
    if (midChartInstance) midChartInstance.destroy()
})

watch(activeTab, (newTab) => {
    if (newTab === 'stats') {
        // 탭 이동 시 캔버스 렌더링을 기다린 후 데이터 로드
        setTimeout(() => {
            fetchShortData()
            fetchMidData()
        }, 100)
    }
})
</script>

<style scoped>
.control-container {
    width: 100%;
    height: 100vh;
    overflow-y: auto;       
    overflow-x: hidden;     
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 22px;
    background-color: #000;
    color: #f5f5f5;
    box-sizing: border-box; /* 패딩이 너비 잡아먹는 거 방지 */
}

.control-container::-webkit-scrollbar {
    width: 10px;
}

.control-container::-webkit-scrollbar-track {
    background: transparent;
}

.control-container::-webkit-scrollbar-thumb {
    background: #444D56;
    border-radius: 4px;
}

.control-container::-webkit-scrollbar-thumb:hover {
    background: #4f5963;
}

/* 상단 헤더 & 탭 */
.page-header {
    margin-bottom: 17px;
}

.header-title-area {
    display: flex;
    align-items: center;
    gap: 20px;
}

.page-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
}

.tab-group {
    display: flex;
    background: #27272a;
    /* 시안 1번 탭 배경 */
    border-radius: 8px;
    padding: 4px;
}

.tab-btn {
    padding: 6px 16px;
    border: none;
    background: transparent;
    color: #a1a1aa;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    transition: 0.2s;
}

.tab-btn.active {
    background: #3b82f6;
    /* 포인트 블루 */
    color: #fff;
}

/* 탭 1 (로그) - 시안 1번 상단 바 */
.filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.date-range,
.search-box {
    display: flex;
    align-items: center;
    background: #18181b;
    border: 1px solid #3f3f46;
    border-radius: 6px;
    padding: 8px 12px;
}

.date-input {
    background: transparent;
    border: none;
    color: #d4d4d8;
    font-size: 14px;
    outline: none;
    width: 140px;
}

.search-box input {
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
    width: 200px;
    font-size: 14px;
}

.search-box input::placeholder {
    color: #52525b;
}

.calendar-icon,
.search-icon {
    width: 16px;
    height: 16px;
    color: #a1a1aa;
    cursor: pointer;
}

/* 탭 1 - 미구현 안내박스 */
.placeholder-box {
    background: #18181b;
    border: 1px dashed #3f3f46;
    border-radius: 12px;
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #71717a;
    gap: 16px;
    font-size: 15px;
}

/* 탭 2 (통계) - 시안 5번 상단 바 */
.stats-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.date-sep {
    color: #52525b;
    margin: 0 8px;
}

.info-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #d4d4d8;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
}

/* 탭 2 - 차트 레이아웃 */
.chart-row {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 20px;
    margin-bottom: 20px;
    width: 100%;  
}

.chart-card {
    background: #18181b;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #27272a;
    min-width: 0;      
}

.card-title-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.card-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
}

.sub-text {
    font-size: 13px;
    color: #a1a1aa;
    font-weight: 400;
    margin-left: 6px;
}

/* 커스텀 범례 */
.legend-custom {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: #f5f5f5a9;
}

.l-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.legend-line.dashed-mainblue {
    display: inline-block;
    width: 30px;
    height: 15px;
    background-color: rgba(79, 134, 247, 0.1);
    border: 2px dashed #005baa;
    border-radius: 2px;
}

/* 예상 대수 점선 */
.legend-line.dashed-blue {
    display: inline-block;
    width: 30px;
    height: 15px;
    background-color: rgba(79, 134, 247, 0.1);
    border: 2px dashed #82c2e3;
    border-radius: 2px;
}

.legend-line.dashed-og {
    display: inline-block;
    width: 30px;
    height: 15px;
    background-color: rgba(79, 134, 247, 0.1);
    border: 2px dashed #fbb900;
    border-radius: 2px;
}

.chart-wrap {
    position: relative;
    height: 300px;
}

.chart-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717a;
}

/* 탭 2 - 테이블 레이아웃 */
.table-card {
    background: #18181b;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #27272a;
    width: 100%;         
    min-width: 0;         
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.th-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.record-count {
    background: #27272a;
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 12px;
    color: #a1a1aa;
}

.dark-select {
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #d4d4d8;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    outline: none;
}

.dark-select.plain {
    background: transparent;
    border: none;
}

.table-responsive {
    width: 100%;
    overflow-x: auto;       /* 화면이 작아지면 테이블 안에서만 가로 스크롤 생김 */
}

.dark-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.dark-table th {
    background: #1f1f23;
    color: #a1a1aa;
    font-weight: 600;
    padding: 14px;
    text-align: center;
    border-bottom: 1px solid #27272a;
}

.dark-table td {
    padding: 14px;
    text-align: center;
    border-bottom: 1px solid #27272a;
    color: #e4e4e7;
}

.empty-msg {
    padding: 40px !important;
    color: #52525b !important;
}

/* 데이터 텍스트 색상 */
.text-blue {
    color: #82c2e3;
}

.text-gray {
    color: #52525b;
}

.error-good {
    color: #22c55e;
}

.error-ok {
    color: #eab308;
}

.error-bad {
    color: #ef4444;
}

/* 혼잡도 상태 */
.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}

.bg-green {
    background: #22c55e;
}

.text-green {
    color: #22c55e;
}

.bg-yellow {
    background: #eab308;
}

.text-yellow {
    color: #eab308;
}

.bg-red {
    background: #ef4444;
}

.text-red {
    color: #ef4444;
}

.bg-dark {
    background: #71717a;
}

.text-dark {
    color: #71717a;
}

.bg-gray {
    background: #3f3f46;
}

.text-gray {
    color: #a1a1aa;
}

/* 페이지네이션 */
.pagination {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 22px;
    margin-bottom: 22px;
}

.page-btn {
    background: transparent;
    border: 1px solid #3f3f46;
    color: #a1a1aa;
    min-width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
}

.page-btn:hover:not(:disabled) {
    border-color: #82c2e3;
    color: #82c2e3;
}

.page-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
}

.page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* ── 달력 커스텀 CSS ───────────────────────────── */
.date-range {
    display: flex;
    align-items: center;
    background-color: #18181b; /* 다크 배경 */
    border: 1px solid #27272a; /* 테두리 */
    border-radius: 8px;
    padding: 6px 12px;
    width: 270px;
    gap: 4px;
}

.date-input {
    background: transparent;
    border: none;
    color: #e4e4e7;
    font-size: 13px;
    outline: none;
    cursor: pointer;
    width: 105px;
    font-family: inherit;
}

/* 브라우저 기본 달력 아이콘 밝게 (반전) */
.date-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.5;
    cursor: pointer;
}

.date-sep {
    color: #52525b;
    font-size: 13px;
}

/* 시안용 우측 아이콘 */
.calendar-icon {
    width: 14px;
    height: 14px;
    color: #71717a;
    margin-left: auto;
}

/* 탭 2 상단 바 정렬 유지 */
.stats-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>