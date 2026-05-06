<template>
    <div class="control-container">

        <div class="tab-content">

            <div class="stats-header-bar">
                <div class="relative-box">
                    <!-- 클릭하면 달력 열리는 박스 -->
                    <div class="date-trigger-box" @click="isCalendarOpen = true">
                        <span class="date-text">{{ startDate }} ~ {{ endDate }}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>

                    <!-- 공통 달력 컴포넌트 -->
                    <DatePopup :visible="isCalendarOpen" :start-date="startDate" :end-date="endDate"
                        :max-date="maxAllowedDate" @close="isCalendarOpen = false" @apply="handleDateApply" />
                </div>

                <div class="info-wrapper">
                    <button class="info-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        주차 예측 데이터 안내
                    </button>

                    <!-- 호버 시 나타날 안내 박스 -->
                    <div class="info-tooltip">
                        AI 주차 예측 모델은 <strong>기상 상태, 대기질 정보, 공휴일 여부,
                            진료 예약 현황</strong>을 종합적으로 분석하여 산출된 신뢰도 높은 데이터입니다.
                    </div>
                </div>
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
import DatePopup from '@/components/DatePopup.vue'

const getTodayStr = () => new Date().toISOString().split('T')[0]

const isCalendarOpen = ref(false)
const startDate = ref(getTodayStr())
const endDate = ref(getTodayStr())

const handleDateApply = (dates) => {
    startDate.value = dates.startDate
    endDate.value = dates.endDate
    isCalendarOpen.value = false
    fetchShortData()
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

const activeTab = ref('stats')
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

// ── [우] 중기 막대 그래프 (요일 및 공휴일 색상 적용) ────────────────
const fetchMidData = async () => {
    midLoading.value = true
    try {
        const res = await axios.get('http://localhost:8080/dashBoard/parkingChart/mid')
        midData.value = res.data

        const labels = []         // X축에 표시될 글씨 (날짜, 공휴일명)
        const labelColors = []    // X축 글씨 색상 (빨강, 파랑, 회색)
        const predList = []

        res.data.forEach(d => {
            predList.push(d.predictedCars)

            const dateObj = new Date(d.date + 'T00:00:00')
            const day = dateObj.getDay() // 0: 일요일, 6: 토요일
            const baseLabel = getDowLabel(d.date) // 예: "03-13 (수)"

            // 1. 일요일 또는 공휴일 (빨간색)
            if (d.isHoliday || day === 0) {
                labelColors.push('#ef4444') // 다크모드용 밝은 빨강

                if (d.holidayName) {
                    // 배열로 넣으면 Chart.js가 자동으로 두 줄로 줄바꿈 처리해 줍니다!
                    labels.push([baseLabel, `[${d.holidayName}]`])
                } else {
                    labels.push(baseLabel) // 단순 일요일일 경우
                }
            }
            // 2. 토요일 (파란색)
            else if (day === 6) {
                labelColors.push('#60a5fa') // 다크모드용 밝은 파랑
                labels.push(baseLabel)
            }
            // 3. 평일 (회색/흰색 - 다크모드 기준)
            else {
                labelColors.push('#d4d4d8') // 다크모드 기본 글씨색
                labels.push(baseLabel)
            }
        })

        if (midChartInstance) midChartInstance.destroy()
        midChartInstance = new Chart(midChartRef.value, {
            type: 'bar',
            data: {
                labels: labels, // 가공된 라벨 배열 투입
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
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '주차 대수 (대)', color: '#f5f5f5a9' },
                        ticks: { stepSize: 5, color: '#f5f5f5a9' }
                    },
                    x: {
                        title: { display: true, text: '예측 날짜', color: '#f5f5f5a9' },
                        ticks: {
                            maxTicksLimit: 12,
                            color: labelColors, // ✨ 여기에 지정한 색상 배열을 투입!
                            font: {
                                size: 12
                            }
                        }
                    },
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
/* Container & Layout */
.control-container {
    width: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 17px;
    background-color: transparent;
    color: #f5f5f5;
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

/* Header & Calendar */
.stats-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 17px;
    position: relative;
    z-index: 9999;
}

.relative-box {
    position: relative;
    z-index: 9999;
}

:deep(.date-popup-layer) {
    left: 0 !important;
    right: auto !important;
}

.date-trigger-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(68, 77, 86, 0.3);
    padding: 8px 16px;
    border-radius: 5px;
    border: 1px solid rgba(245, 245, 245, 0.1);
    cursor: pointer;
    transition: 0.2s;
}

.date-trigger-box:hover {
    border-color: #82c2e3;
}

.date-text {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
}

.calendar-icon {
    width: 18px;
    height: 18px;
    color: rgba(245, 245, 245, 0.6);
    flex-shrink: 0;
}

.info-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(68, 77, 86, 0.3);
    border: 1px solid rgba(245, 245, 245, 0.1);
    color: #fff;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
}

.info-btn:hover {
    border-color: #82c2e3;
    color: #82c2e3;
}

.info-wrapper {
    position: relative;
    display: inline-block;
}

/* 안내 박스 기본 스타일  */
.info-tooltip {
    position: absolute;
    ;
    right: 0;
    width: 303px;
    background: #1f1f23;
    border: 1px solid rgba(245, 245, 245, 0.15);
    padding: 12px 16px;
    border-radius: 8px;
    color: rgba(245, 245, 245, 0.8);
    font-size: 15px;
    line-height: 1.6;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
}

/* 강조 텍스트 (기상, 대기질 등) */
.info-tooltip strong {
    color: #82c2e3;
    /* 메인 포인트 블루 컬러 */
    font-weight: 600;
}

/* 호버 시 나타나는 효과 */
.info-wrapper:hover .info-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(-5px);
    /* 살짝 위로 떠오르는 느낌 */
}

/* 툴팁 아래 꼬리 (말풍선 느낌) */
.info-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 20px;
    border-width: 8px;
    border-style: solid;
    border-color: #1f1f23 transparent transparent transparent;
}

/* Chart Cards */
.chart-row {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 17px;
    margin-bottom: 17px;
    width: 100%;
}

.chart-card {
    background: rgba(68, 77, 86, 0.3);
    border-radius: 10px;
    padding: 17px;
    border: 1px solid rgba(245, 245, 245, 0.08);
    min-width: 0;
}

.card-title-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 17px;
}

.card-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    color: #fff;
}

.sub-text {
    font-size: 13px;
    color: rgba(245, 245, 245, 0.6);
    font-weight: 400;
    margin-left: 6px;
}

.legend-custom {
    display: flex;
    gap: 15px;
    font-size: 13px;
    color: rgba(245, 245, 245, 0.6);
}

.l-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.legend-line.dashed-mainblue {
    display: inline-block;
    width: 30px;
    height: 12px;
    border: 2px dashed rgba(245, 245, 245, 0.6);
    border-radius: 2px;
}

.legend-line.dashed-blue {
    display: inline-block;
    width: 30px;
    height: 12px;
    border: 2px dashed #82c2e3;
    border-radius: 2px;
}

.legend-line.dashed-og {
    display: inline-block;
    width: 30px;
    height: 12px;
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
    color: rgba(245, 245, 245, 0.6);
}

/* Table Area */
.table-card {
    background: rgba(68, 77, 86, 0.3);
    border-radius: 10px;
    padding: 17px;
    border: 1px solid rgba(245, 245, 245, 0.08);
    width: 100%;
    min-width: 0;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 17px;
}

.th-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.record-count {
    height: 28px;
    padding: 0 12px;
    background: rgba(130, 194, 227, 0.15);
    border: 1px solid #82c2e3;
    color: #fff;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.dark-select {
    background-color: #444D56;
    border: 1px solid rgba(245, 245, 245, 0.1);
    color: #f5f5f5;
    padding: 0 12px;
    height: 28px;
    border-radius: 20px;
    font-size: 13px;
    font-family: 'Pretendard', sans-serif;
    outline: none;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.dark-select option {
    background-color: #444D56;
    color: #f5f5f5;
    padding: 10px;
}

.dark-select.plain {
    background: transparent;
    border: none;
}

.table-responsive {
    width: 100%;
    overflow-x: auto;
}

.dark-table {
    width: 100%;
    border-collapse: collapse;
}

.dark-table th {
    background: transparent;
    color: rgba(245, 245, 245, 0.6);
    font-size: 14px;
    font-weight: 600;
    padding: 17px 10px;
    text-align: center;
    border-bottom: 1px solid rgba(245, 245, 245, 0.1);
    white-space: nowrap;
}

.dark-table td {
    padding: 17px 10px;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    border-bottom: 1px solid rgba(245, 245, 245, 0.05);
    color: #f5f5f5;
    white-space: nowrap;
}

.empty-msg {
    padding: 40px !important;
    color: rgba(245, 245, 245, 0.6) !important;
    font-weight: 400 !important;
}

/* Colors & Badges */
.text-blue {
    color: #82c2e3;
}

.text-gray {
    color: rgba(245, 245, 245, 0.6);
}

.error-good {
    color: #82c2e3;
}

.error-ok {
    color: #fbb900;
}

.error-bad {
    color: #ff0000;
}

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
    background: #fbb900;
}

.text-yellow {
    color: #fbb900;
}

.bg-red {
    background: #ff0000;
}

.text-red {
    color: #ff0000;
}

.bg-dark {
    background: rgba(245, 245, 245, 0.6);
}

.text-dark {
    color: rgba(245, 245, 245, 0.6);
}

.bg-gray {
    background: rgba(68, 77, 86, 0.3);
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 17px;
    margin-bottom: 17px;
}

.page-btn {
    background: transparent;
    border: 1px solid rgba(245, 245, 245, 0.1);
    color: rgba(245, 245, 245, 0.6);
    min-width: 32px;
    height: 32px;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.2s;
}

.page-btn:hover:not(:disabled) {
    border-color: #82c2e3;
    color: #82c2e3;
}

.page-btn.active {
    background: #82c2e3;
    border-color: #82c2e3;
    color: #000;
}

.page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
</style>