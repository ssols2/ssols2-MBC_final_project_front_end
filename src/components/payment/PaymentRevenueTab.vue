<template>
  <div class="payment-revenue-tab">

    <section class="summary-dashboard">
      <div class="summary-card">
        <div class="card-title">총 매출</div>
        <div class="card-value">
          <h2>₩{{ (summaryData?.total_revenue || 0).toLocaleString() }}</h2>
          <span v-if="summaryData?.trends?.total !== undefined"
            :class="['trend', summaryData.trends.total >= 0 ? 'up' : 'down']">
            {{ summaryData.trends.total > 0 ? '+' : '' }}{{ summaryData.trends.total }}%
            <svg v-if="summaryData.trends.total >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 16H4z" />
            </svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20L4 4h16z" />
            </svg>
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
            <svg v-if="summaryData.trends.parking >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 16H4z" />
            </svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20L4 4h16z" />
            </svg>
          </span>
        </div>
        <div class="progress-bar">
          <div class="fill"
            :style="{ width: getRatio(summaryData?.parking_revenue, summaryData?.total_revenue) + '%' }"></div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-title">충전 수익</div>
        <div class="card-value">
          <h2>₩{{ (summaryData?.ev_charging_revenue || 0).toLocaleString() }}</h2>
          <span v-if="summaryData?.trends?.ev !== undefined"
            :class="['trend', summaryData.trends.ev >= 0 ? 'up' : 'down']">
            {{ summaryData.trends.ev > 0 ? '+' : '' }}{{ summaryData.trends.ev }}%
            <svg v-if="summaryData.trends.ev >= 0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 16H4z" />
            </svg>
            <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20L4 4h16z" />
            </svg>
          </span>
        </div>
        <div class="progress-bar">
          <div class="fill"
            :style="{ width: getRatio(summaryData?.ev_charging_revenue, summaryData?.total_revenue) + '%' }"></div>
        </div>
      </div>

      <div class="summary-card highlight-card">
        <div class="card-title">진료 연동 할인 건수 및 금액</div>
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

        <div class="chart-canvas-area">
          <div v-if="!chartData || chartData.length === 0" class="empty-message">
            데이터를 불러오는 중입니다
          </div>

          <div v-else ref="revenueChartRef" style="width: 100%; height: 100%;"></div>
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
            <input type="text" placeholder="Search..." class="search-input" v-model="searchQuery"
              @keyup.enter="handleSearch" />
            <span class="search-icon" @click="handleSearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
          <!-- <button class="excel-btn" @click="downloadExcel">
            <span class="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span>
            엑셀 다운로드
          </button> -->
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>정산 일자</th>
              <th>결제 건수</th>
              <th>총 발생 금액(주차+충전)</th>
              <th>할인 감면액(진료 연동)</th>
              <th>최종 금액 (₩)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!tableItems || tableItems.length === 0">
              <td colspan="5" class="empty-message">정산 내역이 없습니다</td>
            </tr>
            <tr v-for="(item, index) in tableItems" :key="index">
              <td>{{ formatDate(item.settlement_date) }}</td>
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
        <button v-for="page in totalPages" :key="page" :class="['page-num', { active: currentPage === page }]"
          @click="goToPage(page)">
          {{ page }}
        </button>
        <button class="page-arrow" @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      </div>
    </section>

  </div>
</template>

<script setup>
// nextTick: 뷰(Vue)가 화면(HTML)을 다 그릴 때까지 기다리는 타이머 -> DOM 업데이트가 끝날 때까지 기다린 후 차트 등을 렌더링
// defineProps: 부모 컴포넌트가 던져주는 데이터를 받기 위해 열어둔 입
import { ref, computed, onMounted, nextTick, defineProps, watch } from 'vue'
import { paymentApi } from '@/api/payment/stats.js'
import * as echarts from 'echarts' // echarts: 데이터를 예쁜 그래프로 그려주는 차트 라이브러리

// ── [1] 부모 데이터 수신 및 감지 (Props & Watch) ──

const props = defineProps({
  startDate: String,
  endDate: String
})

// 부모가 주는 날짜가 바뀌면 즉시 감지해서 화면 데이터를 다시 불러옴
watch(() => [props.startDate, props.endDate], () => {
  fetchData()
})


// ── [2] 상태 관리 (State) ──
// 날짜 포맷 함수 (YYYY-MM-DD HH:mm:ss)
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr // 날짜 형식이 아니면 그대로 반환

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일`
}

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


// ── [3] 핵심 계산 로직 (Utils) ──
// 프로그레스 바를 위한 실제 비율 계산 함수 (0 ~ 100%)
const getRatio = (target, total) => {
  if (!total || total === 0) return 0
  const ratio = (target / total) * 100
  return Math.min(Math.round(ratio), 100)
}


// ── [4] API 데이터 패칭 (Fetch) ──

// 상단 요약 카드 데이터 가져오기
const fetchSummary = async () => {
  try {
    const res = await paymentApi.getRevenueSummary(props.startDate, props.endDate)
    summaryData.value = res.data

    if (!summaryData.value.trends) {
      summaryData.value.trends = { total: 0, parking: 0, ev: 0 }
    }
  } catch (error) {
    console.error("요약 데이터를 불러오는데 실패했습니다", error)
  }
}

// 중앙 그래프 데이터 가져오기 및 렌더링
// 중앙 그래프 데이터 가져오기 및 렌더링
const fetchChart = async () => {
  try {
    // 시작일과 종료일이 같은 '하루 조회' 상태라면 viewType을 hour로 전환
    let requestViewType = viewType.value
    if (props.startDate === props.endDate && viewType.value === 'day') {
      requestViewType = 'hour'
    }

    const res = await paymentApi.getRevenueChart(requestViewType, props.startDate, props.endDate)

    chartData.value = res.data.graph_data
    chartSummary.value = {
      total_revenue: res.data.total_revenue,
      total_count: res.data.total_count,
      avg_revenue: res.data.avg_revenue,
      revenue_per_car: res.data.revenue_per_car
    }

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
    // API에 searchQuery.value 와 sortOrder.value 파라미터를 추가해서 백엔드로 넘겨줌
    const res = await paymentApi.getRevenueTable(
      props.startDate,
      props.endDate,
      skip,
      itemsPerPage.value,
      searchQuery.value, // 검색어 전달
      sortOrder.value    // 정렬 기준 전달 ('desc' or 'asc')
    )
    tableItems.value = res.data.items
    totalTableCount.value = res.data.total_count
  } catch (error) {
    console.error("테이블 데이터를 불러오는데 실패했습니다", error)
  }
}

// ── [5] ECharts 렌더링 함수 ──
const renderChart = () => {
  if (!revenueChartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(revenueChartRef.value)
  }

  const labels = chartData.value.map(item => item.label)
  const parkingValues = chartData.value.map(item => item.parking_amount)
  const evValues = chartData.value.map(item => item.ev_amount)

  const seriesType = viewType.value === 'day' ? 'line' : 'bar'

  const option = {
    grid: {
      top: '60px',    // 범례(Legend) 공간 확보
      left: '15px',   // 왼쪽 여백 최소화
      right: '25px',  // 오른쪽 여백 최소화
      bottom: '10px', // 아래쪽 여백 최소화
      containLabel: true // 숫자가 박스 밖으로 나가지 않게 자동으로 잡아줌
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['주차비 매출', '충전비 매출'],
      textStyle: { color: '#a1a1aa' },
      top: '10px' // 범례 위치 살짝 조정
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#a1a1aa' },
      boundaryGap: viewType.value === 'day' ? false : true // 축 선이 끝까지 닿도록
    },
    yAxis: {
      type: 'value',
      // 0부터 시작해서 데이터 최댓값보다 살짝 높게 자동으로 잡음
      min: 0,
      // 데이터가 아예 없을 때를 대비해 기본 스케일을 100만 원으로 설정 (선택사항)
      minInterval: 100000,

      axisLabel: {
        color: '#a1a1aa',
        // 숫자가 커지면 읽기 편하게 1,000단위 쉼
        formatter: (value) => {
          if (value >= 10000) {
            return (value / 10000).toLocaleString() + '만'; // 1000000 -> 100만
          }
          return value.toLocaleString();
        }
      },
      splitLine: {
        lineStyle: { color: '#3f3f46' }
      }
    },
    series: [
      {
        name: '주차비 매출',
        type: seriesType,
        data: parkingValues,
        itemStyle: { color: '#82c2e3' },
        smooth: true,
        // 추가: 영역 색상 채우기 (선 그래프일 때 더 꽉 차 보임)
        areaStyle: viewType.value === 'day' ? { opacity: 0.1 } : null
      },
      {
        name: '충전비 매출',
        type: seriesType,
        data: evValues,
        itemStyle: { color: '#fadb14' },
        smooth: true,
        areaStyle: viewType.value === 'day' ? { opacity: 0.1 } : null
      }
    ],
    backgroundColor: 'transparent'
  }

  chartInstance.setOption(option, true)
}


// ── [6] 사용자 인터랙션 핸들러 ──
// 검색 실행 함수 (엔터키 or 돋보기 클릭 시)
const handleSearch = () => {
  currentPage.value = 1 // 검색 시 무조건 1페이지로 리셋
  fetchTable()
}

// 검색어를 싹 지웠을 때 자동으로 전체 목록 복구
watch(searchQuery, (newVal) => {
  if (!newVal) {
    handleSearch()
  }
})

// 정렬 기준(최신순/과거순)이 바뀌면 즉시 목록 다시 불러오기
watch(sortOrder, () => {
  handleSearch()
})

const fetchData = () => {
  currentPage.value = 1
  fetchSummary()
  fetchChart()
  fetchTable()
}

const changeViewType = (type) => {
  viewType.value = type
  fetchChart()
}

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

// const downloadExcel = () => {
//   alert("엑셀 다운로드 API를 연결해주세요")
// }

// ── [7] 라이프사이클 ──
onMounted(() => {
  fetchData()

  window.addEventListener('resize', () => {
    if (chartInstance) chartInstance.resize()
  })
})
</script>

<style scoped>
.payment-revenue-tab {
  display: flex;
  flex-direction: column;
  gap: 17px;
  height: 100%;
  overflow-y: auto;
  padding: 0 4px;
  color: #f5f5f5;
  background-color: transparent;
  font-family: 'Pretendard', sans-serif;
}

.payment-revenue-tab::-webkit-scrollbar {
  width: 10px;
}

.payment-revenue-tab::-webkit-scrollbar-thumb {
  background: #444D56;
  border-radius: 4px;
}

/* 상단 요약 카드 */
.summary-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 17px;
}

.summary-card {
  background: rgba(68, 77, 86, 0.3);
  padding: 28px 22px;
  border-radius: 10px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.card-title {
  font-size: 20px;
  color: #fff;
  font-weight: 600;
  margin: 0;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-value h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #f5f5f5;
}

.trend {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend.up {
  color: #ff0000;
}

.trend.down {
  color: #82c2e3;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(245, 245, 245, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: auto;
}

.progress-bar .fill {
  height: 100%;
  background: #82c2e3;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.discount-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 16px;
  color: rgba(245, 245, 245, 0.6);
}

.value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* 중앙: 차트 섹션 */
.chart-section {
  background: rgba(68, 77, 86, 0.3);
  padding: 17px;
  border-radius: 10px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 17px;
}

.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

/* 일/주/월별 탭 버튼 */
.view-type-toggle {
  display: flex;
  gap: 8px;
}

.view-type-toggle button {
  height: 28px;
  padding: 0 14px;
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: 999px;
  /* 완전 둥근 알약 형태 */
  background: transparent;
  color: rgba(245, 245, 245, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.view-type-toggle button:hover {
  border-color: #82c2e3;
  color: #82c2e3;
}

.view-type-toggle button.active {
  border-color: #82c2e3;
  background: rgba(130, 194, 227, 0.15);
  color: #fff;
}

.total-stats {
  font-size: 18px;
  color: rgba(245, 245, 245, 0.6);
}

.stat-label {
  color: rgba(245, 245, 245, 0.6);
}

.stat-value {
  font-weight: 600;
  font-size: 18px;
  color: #f5f5f5;
}

.stat-value.text-blue {
  color: #82c2e3;
}

.divider {
  color: rgba(245, 245, 245, 0.1);
  margin: 0 8px;
}

.chart-body-wrapper {
  display: flex;
  gap: 17px;
  height: 350px;
}

.chart-canvas-area {
  flex: 4;
  background: rgba(68, 77, 86, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-side-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.side-card {
  flex: 1;
  background: rgba(68, 77, 86, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 17px;
}

.side-card .card-value {
  font-size: 24px;
  font-weight: 700;
}

/* ── 하단: 테이블 섹션 ── */
.table-section {
  background: rgba(68, 77, 86, 0.3);
  padding: 17px;
  border-radius: 10px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 정렬 셀렉트 박스 */
.sort-select {
  background-color: #444d5650;
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

.sort-select option {
  background-color: #444D56;
  color: #f5f5f5;
  padding: 10px;
}

.sort-select:hover {
  border-color: #82c2e3;
}

/* 검색창 */
.search-wrapper {
  display: flex;
  align-items: center;
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 5px;
  padding: 8px 12px;
}

.search-input {
  background: transparent;
  border: none;
  color: #f5f5f5;
  outline: none;
  width: 180px;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(245, 245, 245, 0.6);
}

.search-icon {
  color: rgba(245, 245, 245, 0.6);
  cursor: pointer;
}

/* 테이블 스타일 */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.data-table th {
  padding: 17px 10px;
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
  color: rgba(245, 245, 245, 0.6);
  font-size: 16px;
  font-weight: 600;
}

.data-table td {
  padding: 17px 10px;
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
  color: #f5f5f5;
  font-size: 16px;
  font-weight: 500;
}

.empty-message {
  padding: 40px !important;
  color: rgba(245, 245, 245, 0.6) !important;
  font-weight: 400 !important;
}

.text-blue {
  color: #82c2e3;
}

.text-yellow,
.text-orange {
  color: #fbb900;
}

.text-red {
  color: #ff0000;
}

.text-white {
  color: #fff;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 17px;
  margin-bottom: 17px;
}

.page-arrow,
.page-num {
  background: transparent;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: rgba(245, 245, 245, 0.6);
  min-width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-arrow:hover:not(:disabled),
.page-num:hover:not(:disabled) {
  border-color: #82c2e3;
  color: #82c2e3;
}

.page-num.active {
  background: #82c2e3;
  border-color: #82c2e3;
  color: #000;
}

.page-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>