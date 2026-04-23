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
        <h3 class="section-title">상세 결제 및 할인 로그</h3>
        <div class="right-controls">
          <div class="search-wrapper">
            <input type="text" placeholder="차량번호 검색..." class="search-input" v-model="searchQuery" />
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
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
        <button class="page-arrow" @click="prevPage" :disabled="currentPage === 1">&lt;</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-arrow" @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { paymentApi } from '@/api/payment/stats.js'
import * as echarts from 'echarts'

// 오늘 날짜를 YYYY-MM-DD 형태로 가져오는 함수
const getTodayStr = () => new Date().toISOString().split('T')[0]

// 상태 관리
const startDate = ref(getTodayStr()) // 접속 시 오늘 날짜로 자동 지정
const endDate = ref(getTodayStr())   // 접속 시 오늘 날짜로 자동 지정
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const analysisData = ref({})
const logItems = ref([])
const totalLogCount = ref(0)
const totalPages = computed(() => Math.ceil(totalLogCount.value / itemsPerPage.value) || 1)

// 차트 Ref
const payTypeChartRef = ref(null)
const methodChartRef = ref(null)
const customerChartRef = ref(null)
let charts = []

// 데이터 로드
const fetchData = async () => {
  try {
    const [ratioRes, logRes] = await Promise.all([
      paymentApi.getAnalysisRatios(startDate.value, endDate.value),
      paymentApi.getPaymentLogs(startDate.value, endDate.value, (currentPage.value - 1) * itemsPerPage.value, itemsPerPage.value)
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

// 도넛 차트 공통 옵션 생성기
// PaymentAnalysisTab.vue 108라인 근처 수정
const getDoughnutOption = (name, data, colors) => ({
  tooltip: { trigger: 'item' },
  legend: { 
    bottom: '2%', // 레전드 위치 살짝 조정
    left: 'center', 
    textStyle: { color: '#a1a1aa', fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10
  },
  series: [{
    name: name,
    type: 'pie',
    radius: ['35%', '60%'], // 레이블 공간 확보를 위해 반지름 살짝 축소
    avoidLabelOverlap: true, // 레이블 겹침 방지
    itemStyle: { borderRadius: 8, borderColor: '#1e1e2d', borderWidth: 2 },
    
    // [수정] 레이블 상시 노출 설정
    label: { 
      show: true, 
      position: 'outside', 
      formatter: '{b}\n({d}%)', // 항목명과 퍼센트 표시
      color: '#cbd5e1',
      fontSize: 11
    },
    labelLine: { // 레이블 연결선 설정
      show: true,
      length: 10,
      length2: 10,
      lineStyle: { color: '#3f3f46' }
    },
    emphasis: { 
      label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#fff' } 
    },
    data: data.map((item, idx) => ({ 
      ...item, 
      itemStyle: { color: colors[idx] } 
    }))
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

const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; fetchData(); } }
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; fetchData(); } }

onMounted(() => {
  fetchData()
  window.addEventListener('resize', () => charts.forEach(c => c.resize()))
})
</script>

<style scoped>
.payment-analysis-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  background-color: #12121c;
  color: #f4f4f5;
}

/* 3단 도넛 그리드 */
.ratio-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.ratio-card {
  background: #1e1e2d;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.fail-badge {
  font-size: 12px;
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.chart-box {
  flex: 1;
  width: 100%;
}

/* 테이블 스타일 (탭 1 재활용) */
.table-section {
  background: #1e1e2d;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px;
  border-bottom: 1px solid #3f3f46;
  text-align: left;
  font-size: 14px;
}

.data-table th {
  color: #a1a1aa;
  background: #2a2a3c;
}

/* 배지 및 도트 */
.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.bg-blue {
  background: #003a8c;
  color: #bae7ff;
}

.bg-gray {
  background: #262626;
  color: #8c8c8c;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot-green {
  background: #52c41a;
  box-shadow: 0 0 8px #52c41a;
}

.dot-red {
  background: #ff4d4f;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

.page-arrow {
  background: #2a2a3c;
  border: 1px solid #3f3f46;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.page-arrow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>