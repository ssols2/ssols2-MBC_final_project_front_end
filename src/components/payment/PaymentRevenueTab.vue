<template>
  <div class="payment-revenue-tab">
    
    <div class="filter-header">
      <div class="date-picker-wrapper">
        <input type="date" v-model="startDate" class="date-input" @change="fetchData" />
        <span class="date-separator">-</span>
        <input type="date" v-model="endDate" class="date-input" @change="fetchData" />
        <button class="calendar-icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>
    </div>

    <section class="summary-dashboard">
      <div class="summary-card">
        <div class="card-title">총 매출</div>
        <div class="card-value">
          <h2>₩{{ (summaryData?.total_revenue || 0).toLocaleString() }}</h2>
          <span v-if="summaryData?.trends?.total !== undefined" 
                :class="['trend', summaryData.trends.total >= 0 ? 'up' : 'down']">
            {{ summaryData.trends.total > 0 ? '+' : '' }}{{ summaryData.trends.total }}% 
            <svg v-if="summaryData.trends.total >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 16H4z"/></svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20L4 4h16z"/></svg>
          </span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-title">주차 수익</div>
        <div class="card-value">
          <h2>₩{{ (summaryData?.parking_revenue || 0).toLocaleString() }}</h2>
          <span v-if="summaryData?.trends?.parking !== undefined" 
                :class="['trend', summaryData.trends.parking >= 0 ? 'up' : 'down']">
            {{ summaryData.trends.parking > 0 ? '+' : '' }}{{ summaryData.trends.parking }}% 
            <svg v-if="summaryData.trends.parking >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 16H4z"/></svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20L4 4h16z"/></svg>
          </span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: getRatio(summaryData?.parking_revenue, summaryData?.total_revenue) + '%' }"></div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-title">충전 수익</div>
        <div class="card-value">
          <h2>₩{{ (summaryData?.ev_charging_revenue || 0).toLocaleString() }}</h2>
          <span v-if="summaryData?.trends?.ev !== undefined" 
                :class="['trend', summaryData.trends.ev >= 0 ? 'up' : 'down']">
            {{ summaryData.trends.ev > 0 ? '+' : '' }}{{ summaryData.trends.ev }}% 
            <svg v-if="summaryData.trends.ev >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 16H4z"/></svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20L4 4h16z"/></svg>
          </span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: getRatio(summaryData?.ev_charging_revenue, summaryData?.total_revenue) + '%' }"></div>
        </div>
      </div>

      <div class="summary-card highlight-card">
        <div class="card-title">할인 적용 건수 및 금액</div>
        <div class="discount-details">
          <div class="detail-row">
            <span class="label text-orange">건수</span>
            <strong class="value">{{ summaryData?.discount_count || 0 }}건</strong>
          </div>
          <div class="detail-row">
            <span class="label text-red">감면액</span>
            <strong class="value text-white">₩{{ (summaryData?.discount_amount || 0).toLocaleString() }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="chart-section">
      
      <div class="section-header">
        <div class="header-left">
          <h3 class="section-title">매출 추이 그래프</h3>
          <div class="view-type-toggle">
            <button :class="{ active: viewType === 'day' }" @click="changeViewType('day')">일별</button>
            <button :class="{ active: viewType === 'week' }" @click="changeViewType('week')">주별</button>
            <button :class="{ active: viewType === 'month' }" @click="changeViewType('month')">월별</button>
          </div>
        </div>
        <div class="header-right total-stats">
          <span class="stat-label">총 매출액:</span> 
          <strong class="stat-value text-blue">₩{{ (chartSummary?.total_revenue || 0).toLocaleString() }}</strong>
          <span class="divider">|</span>
          <span class="stat-label">총 거래건수:</span> 
          <strong class="stat-value">{{ (chartSummary?.total_count || 0).toLocaleString() }}건</strong>
        </div>
      </div>

      <div class="chart-body-wrapper">
        
        <div class="chart-canvas-area" ref="revenueChartRef">
          <div v-if="!chartData || chartData.length === 0" class="empty-message">데이터를 불러오는 중입니다</div>
        </div>

        <div class="chart-side-panel">
          <div class="side-card">
            <div class="card-title">객단가 (차량당 수익)</div>
            <div class="card-value text-yellow">
              ₩{{ (chartSummary?.revenue_per_car || 0).toLocaleString() }}
            </div>
          </div>
          <div class="side-card">
            <div class="card-title">
              {{ viewType === 'day' ? '일평균' : viewType === 'week' ? '주간 평균' : '월간 평균' }} 매출
            </div>
            <div class="card-value text-blue">
              ₩{{ (chartSummary?.avg_revenue || 0).toLocaleString() }}
            </div>
          </div>
        </div>

      </div>
    </section>

    <section class="table-section">
      <div class="section-header">
        <div class="left-controls">
          <h3 class="section-title">상세 정산 내역</h3>
          <select class="sort-select" v-model="sortOrder">
            <option value="desc">최신순</option>
            <option value="asc">과거순</option>
          </select>
        </div>
        <div class="right-controls">
          <div class="search-wrapper">
            <input type="text" placeholder="Search..." class="search-input" v-model="searchQuery" />
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
          <button class="excel-btn" @click="downloadExcel">
            <span class="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span> 
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>정산 일자</th>
              <th>결제 건수</th>
              <th>총 발생 금액(주차+충전)</th>
              <th>할인 감면액</th>
              <th>최종 금액 (₩)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!tableItems || tableItems.length === 0">
              <td colspan="5" class="empty-message">정산 내역이 없습니다</td>
            </tr>
            <tr v-for="(item, index) in tableItems" :key="index">
              <td>{{ item.settlement_date }}</td>
              <td>{{ item.payment_count }}건</td>
              <td>₩ {{ (item.total_generated || 0).toLocaleString() }}</td>
              <td class="text-red">₩ {{ (item.discount_total || 0).toLocaleString() }}</td>
              <td class="text-yellow">₩ {{ (item.final_amount || 0).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="page-arrow" @click="prevPage" :disabled="currentPage === 1">&lt;</button>
        <button 
          v-for="page in totalPages" 
          :key="page" 
          :class="['page-num', { active: currentPage === page }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button class="page-arrow" @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { paymentApi } from '@/api/payment/stats.js'
import * as echarts from 'echarts'

// ── [1] 상태 관리 (State) ──
// 검색 필터 및 뷰 타입
const startDate = ref('2026-03-01')
const endDate = ref('2026-04-18')
const viewType = ref('day') // day, week, month

// 테이블 정렬 및 페이징
const sortOrder = ref('desc')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// 백엔드 응답 데이터 그릇
const summaryData = ref({})
const tableItems = ref([])
const totalTableCount = ref(0)

// 차트 원본 데이터와 우측 패널 통계 데이터를 분리해서 담을 그릇
const chartData = ref([])
const chartSummary = ref({
  total_revenue: 0,
  total_count: 0,
  avg_revenue: 0,
  revenue_per_car: 0
})

// 총 페이지 수 계산 (데이터가 0개면 1페이지로 고정)
const totalPages = computed(() => Math.ceil(totalTableCount.value / itemsPerPage.value) || 1)

// ECharts 인스턴스 관리를 위한 참조
const revenueChartRef = ref(null)
let chartInstance = null


// ── [2] 핵심 계산 로직 (Utils) ──
// 프로그레스 바를 위한 실제 비율 계산 함수 (0 ~ 100%)
const getRatio = (target, total) => {
  if (!total || total === 0) return 0
  const ratio = (target / total) * 100
  return Math.min(Math.round(ratio), 100)
}


// ── [3] API 데이터 패칭 (Fetch) ──
// 상단 요약 카드 데이터 가져오기
const fetchSummary = async () => {
  try {
    const res = await paymentApi.getRevenueSummary(startDate.value, endDate.value)
    summaryData.value = res.data
    
    // 백엔드에서 trends(증감률) 데이터가 안 올 경우를 대비한 안전 장치
    if (!summaryData.value.trends) {
      summaryData.value.trends = { total: 0, parking: 0, ev: 0 } 
    }
  } catch (error) {
    console.error("요약 데이터를 불러오는데 실패했습니다", error)
  }
}

// 중앙 그래프 데이터 가져오기 및 렌더링
const fetchChart = async () => {
  try {
    // 백엔드에서 통합 DTO 받아옴
    const res = await paymentApi.getRevenueChart(viewType.value, startDate.value, endDate.value)
    
    // 보따리 내용물을 프론트엔드 그릇에 알맞게 분배
    chartData.value = res.data.graph_data
    chartSummary.value = {
      total_revenue: res.data.total_revenue,
      total_count: res.data.total_count,
      avg_revenue: res.data.avg_revenue,
      revenue_per_car: res.data.revenue_per_car
    }
    
    // 데이터 갱신 후 DOM이 준비되면 차트 그리기
    await nextTick()
    renderChart()
  } catch (error) {
    console.error("그래프 데이터를 불러오는데 실패했습니다", error)
  }
}

// 하단 테이블 데이터 가져오기 (페이징 포함)
const fetchTable = async () => {
  try {
    const skip = (currentPage.value - 1) * itemsPerPage.value
    const res = await paymentApi.getRevenueTable(startDate.value, endDate.value, skip, itemsPerPage.value)
    tableItems.value = res.data.items
    totalTableCount.value = res.data.total_count
  } catch (error) {
    console.error("테이블 데이터를 불러오는데 실패했습니다", error)
  }
}


// ── [4] ECharts 렌더링 함수 ──
const renderChart = () => {
  if (!revenueChartRef.value) return
  
  // 이미 그려진 차트가 없다면 초기화
  if (!chartInstance) {
    chartInstance = echarts.init(revenueChartRef.value)
  }

  // 백엔드에서 받은 chartData를 ECharts 규격으로 분리
  const labels = chartData.value.map(item => item.label)
  const parkingValues = chartData.value.map(item => item.parking_amount)
  const evValues = chartData.value.map(item => item.ev_amount)

  // viewType에 따라 차트 종류(line/bar) 동적 결정
  const seriesType = viewType.value === 'day' ? 'line' : 'bar'

  // 이미지 설계서와 똑같은 파란색/노란색 그래프 옵션
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { 
      data: ['주차비 매출', '충전비 매출'],
      textStyle: { color: '#a1a1aa' }
    },
    xAxis: { 
      type: 'category', 
      data: labels,
      axisLabel: { color: '#a1a1aa' }
    },
    yAxis: { 
      type: 'value',
      axisLabel: { color: '#a1a1aa' },
      splitLine: { lineStyle: { color: '#3f3f46' } }
    },
    series: [
      { 
        name: '주차비 매출', 
        type: seriesType, 
        data: parkingValues, 
        itemStyle: { color: '#82c2e3' }, // 설계서의 파란색
        smooth: true // 꺾은선일 경우 부드러운 곡선 처리
      },
      { 
        name: '충전비 매출', 
        type: seriesType, 
        data: evValues, 
        itemStyle: { color: '#fadb14' }, // 설계서의 노란색
        smooth: true
      }
    ],
    backgroundColor: 'transparent'
  }

  // strue 옵션을 주어 이전 차트의 잔상을 완벽히 지우고 새로 그림
  chartInstance.setOption(option, true)
}


// ── [5] 사용자 인터랙션 핸들러 ──
// 날짜가 바뀌었을 때 전체 리로드
const fetchData = () => {
  currentPage.value = 1
  fetchSummary()
  fetchChart()
  fetchTable()
}

// 뷰 타입(일/주/월)이 바뀌었을 때 그래프만 리로드
const changeViewType = (type) => {
  viewType.value = type
  fetchChart()
}

// 페이징 이동
const goToPage = (page) => {
  currentPage.value = page
  fetchTable()
}
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchTable()
  }
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchTable()
  }
}

// 엑셀 다운로드 (기능 연동용 껍데기)
const downloadExcel = () => {
  alert("엑셀 다운로드 API를 연결해주세요")
}

// ── [6] 라이프사이클 ──
onMounted(() => {
  fetchData() // 화면이 켜지자마자 데이터 세팅 시작
  
  // 브라우저 크기가 바뀔 때 차트도 같이 반응형으로 줄어들게 만듦
  window.addEventListener('resize', () => {
    if (chartInstance) chartInstance.resize()
  })
})
</script>

<style scoped>
/* ── 1. 전체 탭 컨테이너 (부모 영역 침범 방지) ── */
.payment-revenue-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%; /* 부모의 main 영역 높이를 100% 채움 */
  overflow-y: auto; /* 내용이 길어져도 내부에서만 스크롤 됨 */
  padding: 16px;
  color: #f4f4f5;
  background-color: #12121c; /* 세련된 다크 배경 */
}

/* ── 2. 최상단: 날짜 필터 (우측 정렬) ── */
.filter-header {
  display: flex;
  justify-content: flex-end;
}
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e1e2d;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #3f3f46;
}
.date-input {
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  font-family: inherit;
}
.calendar-icon-btn {
  background: none;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* ── 3. 상단: 요약 카드 4종 (Grid로 1:1:1:1 분할) ── */
.summary-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.summary-card {
  background: #1e1e2d;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.card-title {
  font-size: 14px;
  color: #a1a1aa;
  font-weight: 600;
}
.card-value {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.card-value h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}
.trend.up { color: #ff4d4f; }
.trend.down { color: #3b82f6; }

/* 프로그레스 바 디자인 */
.progress-bar {
  width: 100%;
  height: 6px;
  background: #3f3f46;
  border-radius: 3px;
  overflow: hidden;
  margin-top: auto;
}
.progress-bar .fill {
  height: 100%;
  background: #82c2e3; /* 파란색 포인트 */
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* ── 4. 중앙: 매출 추이 그래프 영역 ── */
.chart-section {
  background: #1e1e2d;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

/* 차트 본문: 좌측 그래프(3) vs 우측 패널(1) 비율 분할 */
.chart-body-wrapper {
  display: flex;
  gap: 24px;
  height: 350px; /* 그래프 영역 고정 높이 */
}
.chart-canvas-area {
  flex: 3;
  background: #2a2a3c; /* 차트 배경을 살짝 다르게 주어 입체감 부여 */
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.chart-side-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.side-card {
  flex: 1;
  background: #2a2a3c;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.side-card .card-title {
  font-size: 15px;
}
.side-card .card-value {
  font-size: 22px;
  font-weight: 700;
}

/* ── 5. 하단: 상세 정산 내역 요약 테이블 ── */
.table-section {
  background: #1e1e2d;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th, .data-table td {
  padding: 16px;
  border-bottom: 1px solid #3f3f46;
}
.data-table th {
  color: #a1a1aa;
  font-weight: 600;
  background: #2a2a3c;
}
.data-table tr:hover {
  background: #2a2a3c;
}

/* 유틸리티 및 텍스트 컬러 */
.text-blue { color: #82c2e3; }
.text-yellow { color: #fadb14; }
.text-orange { color: #faad14; }
.text-red { color: #ff4d4f; }
.text-white { color: #ffffff; }
</style>