<template>
  <div class="payment-analysis-tab">

    <section class="ratio-dashboard">
      <div class="ratio-card">
        <div class="card-header">
          <h4 class="card-title">결제 방식 비율</h4>
          <span class="fail-badge">자동결제 실패율 {{ analysisData.payment_ratio?.auto_pay_fail_rate || 0 }}%</span>
        </div>
        <div class="chart-box" ref="payTypeChartRef"></div>
      </div>

      <div class="ratio-card">
        <div class="card-header">
          <h4 class="card-title">사전 결제 수단</h4>
        </div>
        <div class="chart-box" ref="methodChartRef"></div>
      </div>

      <div class="ratio-card">
        <div class="card-header">
          <h4 class="card-title">고객 유형 비율</h4>
        </div>
        <div class="chart-box" ref="customerChartRef"></div>
      </div>
    </section>

    <section class="table-section">
      <div class="section-header">
        <!-- 왼쪽: 타이틀 + 필터 그룹 -->
        <div class="header-left">
          <h3 class="section-title">상세 결제 및 할인 로그</h3>
          <select v-model="sortOrder" class="filter-select">
            <option value="desc">최신순</option>
            <option value="asc">과거순</option>
          </select>
          <select v-model="customerFilter" class="filter-select">
            <option value="">고객구분 (전체)</option>
            <option value="회원">회원</option>
            <option value="비회원">비회원</option>
          </select>
          <select v-model="discountFilter" class="filter-select">
            <option value="">할인여부 (전체)</option>
            <option value="applied">할인 적용</option>
            <option value="none">미적용</option>
          </select>
        </div>

        <!-- 오른쪽: 검색창 유지 -->
        <div class="header-right">
          <div class="search-wrapper">
            <input type="text" placeholder="차량번호 검색..." class="search-input" v-model="searchQuery"
              @keyup.enter="handleSearch" />
            <span class="search-icon" @click="handleSearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>결제 일시</th>
              <th>차량 번호</th>
              <th>고객 구분</th>
              <th>발생 요금 (주차/EV)</th>
              <th>할인 내역</th>
              <th>최종 결제액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!logItems || logItems.length === 0">
              <td colspan="7" class="empty-message">데이터가 없습니다</td>
            </tr>
            <tr v-for="(item, index) in logItems" :key="index">
              <td>{{ item.pay_date }}</td>
              <td class="text-white font-bold">{{ item.vehicle_num }}</td>
              <td>
                <span :class="['badge', item.customer_type === '회원' ? 'bg-blue' : 'bg-gray']">
                  {{ item.customer_type }}
                </span>
              </td>
              <td>₩{{ (item.parking_fee + item.ev_charging_fee).toLocaleString() }}</td>
              <td class="text-orange">{{ item.discount_details }}</td>
              <td class="text-yellow font-bold">₩{{ (item.final_amount || 0).toLocaleString() }}</td>
              <td>
                <span :class="['status-dot', item.status === '완료' ? 'dot-green' : 'dot-red']"></span>
                {{ item.status }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">‹</button>
        
        <button 
          v-for="p in pageNumbers" 
          :key="p" 
          class="page-btn" 
          :class="{ active: p === currentPage }"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>

        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">›</button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineProps, watch } from 'vue'
import { paymentApi } from '@/api/payment/stats.js'
import * as echarts from 'echarts'

// ── [1] 부모 데이터 수신 및 감지 (Props & Watch) ──
const props = defineProps({
  startDate: String,
  endDate: String
})

// 부모 날짜 변경 시 데이터 다시 불러오기
watch(() => [props.startDate, props.endDate], () => {
  fetchData()
})

// ── [2] 상태 관리 (State) ──
const searchQuery = ref('')
const customerFilter = ref('') // 고객 구분 (전체, 회원, 비회원 등)
const discountFilter = ref('') // 할인 여부 (전체, 할인적용, 미적용)
const sortOrder = ref('desc')   // 최신순/과거순

const currentPage = ref(1)
const itemsPerPage = ref(10)

const analysisData = ref({})
const logItems = ref([])
const totalLogCount = ref(0)
const totalPages = computed(() => Math.ceil(totalLogCount.value / itemsPerPage.value) || 1)

const pageNumbers = computed(() => {
  const range = []
  for (let i = 1; i <= totalPages.value; i++) {
    range.push(i)
  }
  return range
})

const goToPage = (page) => {
  currentPage.value = page
  fetchData()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchData()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchData()
  }
}

// 차트 Ref
const payTypeChartRef = ref(null)
const methodChartRef = ref(null)
const customerChartRef = ref(null)
let charts = []

// ── [3] 데이터 로드 ──
const fetchData = async () => {
  try {
    const [ratioRes, logRes] = await Promise.all([
      paymentApi.getAnalysisRatios(props.startDate, props.endDate),
      paymentApi.getPaymentLogs(
        props.startDate,
        props.endDate,
        (currentPage.value - 1) * itemsPerPage.value,
        itemsPerPage.value,
        searchQuery.value,
        sortOrder.value,      // 정렬 추가
        customerFilter.value, // 고객필터 추가
        discountFilter.value  // 할인필터 추가
      )
    ])

    analysisData.value = ratioRes.data
    logItems.value = logRes.data.items
    totalLogCount.value = logRes.data.total_count

    await nextTick()
    renderCharts()
  } catch (error) {
    console.error("데이터 로드 실패", error)
  }
}

// ── [4] 사용자 인터랙션 핸들러 ──
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 모든 필터와 정렬 변경 감지 시 즉시 새로고침
watch([customerFilter, discountFilter, sortOrder], () => handleSearch())
watch(searchQuery, (newVal) => { if (!newVal) handleSearch(); })
watch(() => [props.startDate, props.endDate], () => fetchData())

// ── [5] 차트 렌더링 (ECharts 설정) ──
const getDoughnutOption = (name, data, colors) => ({
  tooltip: { trigger: 'item' },
  legend: {
    bottom: '5%', // 범례 위치 하단으로 더 내림
    left: 'center',
    textStyle: { color: 'rgba(245, 245, 245, 0.6)', fontSize: 12 },
    itemGap: 15
  },
  series: [{
    name: name,
    type: 'pie',
    center: ['50%', '42%'], // 차트 중심을 위로 올려 하단 여백 확보
    radius: ['40%', '65%'], // 반지름을 살짝 줄여 짤림 공간 확보
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#1e1e2d', borderWidth: 2 },
    label: {
      show: true,
      position: 'outside',
      formatter: '{b}\n{d}%',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
      overflow: 'none',
      ellipsis: ''
    },
    labelLine: {
      show: true,
      length: 12, // 연결선 길이 조정으로 공간 확보
      length2: 8,
      lineStyle: { color: 'rgba(255,255,255,0.2)' }
    },
    data: data.map((item, idx) => ({ ...item, itemStyle: { color: colors[idx] } }))
  }],
  backgroundColor: 'transparent'
})

const renderCharts = () => {
  // 기존 차트 해제
  charts.forEach(c => c.dispose())
  charts = []

  // 1. 결제 방식 차트
  const payTypeChart = echarts.init(payTypeChartRef.value)
  payTypeChart.setOption(getDoughnutOption('결제 방식', [
    { value: analysisData.value.payment_ratio?.auto_pay_count, name: '사전(자동)' },
    { value: analysisData.value.payment_ratio?.manual_pay_count, name: '현장(수동)' }
  ], ['#82c2e3', '#3f3f46']))
  charts.push(payTypeChart)

  // 2. 결제 수단 차트
  const methodChart = echarts.init(methodChartRef.value)
  methodChart.setOption(getDoughnutOption('결제 수단', [
    { value: analysisData.value.payment_ratio?.auto_pay_card_count, name: '신용카드' },
    { value: analysisData.value.payment_ratio?.auto_pay_bank_count, name: '계좌이체' }
  ], ['#fadb14', '#faad14']))
  charts.push(methodChart)

  // 3. 고객 유형 차트
  const customerChart = echarts.init(customerChartRef.value)
  customerChart.setOption(getDoughnutOption('고객 유형', [
    { value: analysisData.value.customer_ratio?.registered_mem_count, name: '등록 회원' },
    { value: analysisData.value.customer_ratio?.unregistered_mem_count, name: '미등록 회원' },
    { value: analysisData.value.customer_ratio?.non_mem_on_site_count, name: '비회원' }
  ], ['#82c2e3', '#fa8c16', '#3f3f46']))
  charts.push(customerChart)
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', () => charts.forEach(c => c.resize()))
})
</script>

<style scoped>
.payment-analysis-tab {
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

.payment-analysis-tab::-webkit-scrollbar {
  width: 10px;
}

.payment-analysis-tab::-webkit-scrollbar-thumb {
  background: #444D56;
  border-radius: 4px;
}

/* 상단 대시보드 */
.ratio-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 17px;
}

.ratio-card {
  background: rgba(68, 77, 86, 0.3);
  border-radius: 10px;
  padding: 17px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  height: 360px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.fail-badge {
  position: absolute;
  top: 17px;
  right: 17px;
  font-size: 13px;
  color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 5px;
  font-weight: 800;
}

.chart-box {
  flex: 1;
  width: 100%;
  margin-top: 10px;
}

/* ── 하단 섹션── */
/* 테이블 섹션: 하단 공간이 비어 보이지 않도록 최소 높이 설정 */
.table-section {
  background: rgba(68, 77, 86, 0.3);
  border-radius: 10px;
  padding: 17px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  display: flex;
  flex-direction: column;
  gap: 17px;
  min-height: 550px;
}

.empty-message {
  padding: 60px !important;
  /* 공간 더 넉넉하게 */
  color: rgba(245, 245, 245, 0.4) !important;
  font-weight: 400 !important;
  /* border-bottom: none !important; */
}

/* 테이블 컨테이너를 가변적으로 늘려 페이지네이션을 하단에 고정 */
.table-container {
  width: 100%;
  overflow-x: auto;
  flex: 1;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
  padding: 17px 0 10px;
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
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  margin-right: 8px;
}

/* 셀렉트박스 */
.filter-select {
  background-color: #444d5650;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #f5f5f5;
  height: 28px;
  padding: 0 12px;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.filter-select option {
  background-color: #444D56;
  color: #f5f5f5;
  padding: 10px;
}

.filter-select:hover {
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

.badge {
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
}

.bg-blue {
  background: #1e3a2f;
  color: #82c2e3;
}

.bg-gray {
  background: #3b2a1a;
  color: #fbb900;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot-green {
  background: #00e676;
  box-shadow: 0 0 8px rgba(0, 230, 118, 0.5);
}

.dot-red {
  background: #ff0000;
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
.page-info {
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

.page-arrow:hover:not(:disabled) {
  border-color: #82c2e3;
  color: #82c2e3;
}

.page-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  border: none;
  color: #fff;
  cursor: default;
}

.text-white {
  color: #fff;
}

.text-orange,
.text-yellow {
  color: #fbb900;
}

.font-bold {
  font-weight: 700;
}
</style>