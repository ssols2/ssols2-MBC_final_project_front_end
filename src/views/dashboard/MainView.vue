<template>
  <div class="dashboard-main-container">
    <header class="overview-header">
      <div class="header-left">
        <h2 class="page-title">Overview</h2>
      </div>

      <div class="header-right relative-box">
        <div class="date-trigger-box" @click="isCalendarOpen = true">
          <span class="date-text">{{ startDate }} ~ {{ endDate }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>

        <DatePopup :visible="isCalendarOpen" :start-date="startDate" :end-date="endDate" @close="isCalendarOpen = false"
          @apply="handleDateApply" />
      </div>
    </header>

    <section class="top-grid">
      <div class="glass-card sales-status" @click="goPage('/dashboard/payment')">
        <h3 class="card-title">금일 총 매출</h3>
        <div class="chart-content" v-if="revenueData">
          <div class="sales-info">
            <h2>₩ {{ revenueData.today_revenue.toLocaleString() }}</h2>

            <ul class="sales-legend">
              <li class="pre-pay">사전 결제 {{ revenueData.pre_payment_count || 0 }}건</li>
              <li class="on-site-pay">현장 결제 {{ revenueData.on_site_payment_count || 0 }}건</li>
            </ul>

            <div class="discount-badge">
              진료 할인 적용 건수 {{ revenueData.total_discount_count || 0 }}건
            </div>
          </div>

          <div class="chart-container" style="position: relative; width: 115px; height: 115px;">
            <canvas ref="revenueChartRef"></canvas>
            <div class="donut-inner-text">총 {{ (revenueData.pre_payment_count || 0) + (revenueData.on_site_payment_count
              || 0) }}건</div>
          </div>
        </div>
      </div>



      <div class="glass-card visitor-ratio" @click="goPage('/dashboard/vehicle-control')">
        <h3 class="card-title">회원/비회원 방문 비율</h3>

        <div class="chart-content ratio-content" v-if="logData">

          <div class="chart-container glowing-donut" style="position: relative; width: 160px; height: 160px;">
            <canvas ref="memberChartRef"></canvas>

            <div class="donut-inner-center">
              <div class="inner-main">
                {{ logData.memberCount }}<span class="inner-slash"> / {{ logData.totalCount }}</span>
              </div>
              <div class="inner-sub">
                ({{ logData.totalCount > 0 ? Math.round((logData.memberCount / logData.totalCount) * 100) : 0 }}%)
              </div>
            </div>
          </div>

          <div class="ratio-info-area">
            <ul class="ratio-legend-list">
              <li class="member-dot">회원 방문</li>
              <li class="non-member-dot">전체 방문</li>
            </ul>

            <hr class="ratio-divider" />

            <div class="ratio-emphasis">
              <strong>{{ logData.memberCount }}</strong><span class="unit">명 회원</span>
            </div>

            <div class="ratio-badge">
              비회원 {{ logData.nonMemberCount }}명
            </div>
          </div>

        </div>
      </div>

      <div class="glass-card entry-prediction" @click="goPage('/dashboard/vehicle-control')">
        <div class="card-header-flex">
          <h3 class="card-title" style="margin-bottom: 0;">예상 주차 대수</h3>
          <div class="status-badge">AI 실시간 분석중</div>
        </div>

        <div class="chart-placeholder"
          style="position: relative; flex: 1; min-height: 180px; width: 100%; margin-top: -5px;">
          <canvas ref="predictionChartRef"></canvas>
        </div>
      </div>
    </section>

    <section class="middle-grid mt-20">
      <div class="glass-card ev-status-alert" @click="goPage('/dashboard/ev-infra')">
        <h3 class="card-title">EV 충전기 현황 및 알림</h3>
        <div class="chart-content"><span style="color: #a1a1aa">내일 API 연동 예정</span></div>
      </div>

      <div class="glass-card stay-time" @click="goPage('/vehicle-control/logs')">
        <h3 class="card-title">요일별 평균 체류시간</h3>
        <div class="chart-placeholder" style="height: 250px; width: 100%;">
          <canvas ref="stayTimeChartRef"></canvas>
        </div>
      </div>
    </section>

    <section class="bottom-grid mt-20" @click="goPage('/dashboard/vehicle-control')">
      <div class="glass-card table-section">
        <h3 class="card-title">최근 입출차 현황</h3>
        <table class="admin-table">
          <thead>
            <tr>
              <th>차량번호</th>
              <th>회원여부</th>
              <th>입차시간</th>
              <th>출차시간</th>
              <th>정확도(국가|OCR)</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logData.recentLogs.length === 0">
              <td colspan="7">데이터가 없습니다</td>
            </tr>
            <tr v-for="log in logData.recentLogs" :key="log.parkingLogId">
              <td style="color: #82c2e3">{{ log.vehicleNum }}</td>
              <td>{{ log.isMember ? '회원' : '비회원' }}</td>
              <td>{{ formatTime(log.entryTime) }}</td>
              <td>{{ log.exitTime ? formatTime(log.exitTime) : '-' }}</td>

              <td>{{ Math.round(log.countryAccuracy || 0) }}% | {{ Math.round(log.ocrAccuracy || 0) }}%</td>

              <td style="font-weight: 600; color: #ffeb3b;">
                {{ calculateRealTimeFee(log) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { useRouter } from 'vue-router'
import DatePopup from '@/components/DatePopup.vue'

// [달력]
// 오늘 날짜 기본 세팅 함수
const getTodayStr = () => new Date().toISOString().split('T')[0]

const currentTab = ref('revenue')

// 달력 제어용 상태 변수들
const isCalendarOpen = ref(false)
const startDate = ref(getTodayStr())
const endDate = ref(getTodayStr())

// 달력 팝업에서 '적용' 버튼 눌렀을 때 실행될 함수
const handleDateApply = (dates) => {
  startDate.value = dates.startDate
  endDate.value = dates.endDate
}

const router = useRouter()

const goPage = (path) => {
  router.push(path)
}

// ===== 1. 변수 세팅 =====
const revenueData = ref({
  today_revenue: 0,
  parking_revenue: 0,
  ev_charging_revenue: 0,
  total_discount: 0
})
const logData = reactive({ totalCount: 0, memberCount: 0, nonMemberCount: 0, recentLogs: [] })
const reservationCount = ref(0) // 메인 예약 건수 변수 추가

// 차트 Refs
const memberChartRef = ref(null)
const predictionChartRef = ref(null)
const stayTimeChartRef = ref(null)
const revenueChartRef = ref(null)

// ===== 2. 유틸 함수 =====
const formatTime = (dt) => {
  if (!dt) return ''
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
// const getTodayStr = () => {
//   const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// ===== 3. API 호출 및 데이터 가공 =====

// A. 요금 매출 조회
const fetchRevenue = async () => {
  try {
    const res = await axios.get('http://localhost:8004/api/admin/dashboard/revenue')
    revenueData.value = res.data

    // 매출 도넛 차트 그리기
    if (revenueChartRef.value) {
      new Chart(revenueChartRef.value, {
        type: 'doughnut',
        data: {
          labels: ['사전 결제', '현장 결제'],
          datasets: [{
            // 파이썬에서 넘어올 데이터 바인딩
            data: [revenueData.value.pre_payment_count || 0, revenueData.value.on_site_payment_count || 0],
            backgroundColor: ['#82c2e3', '#ffffff'], // 하늘색, 흰색
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(26, 29, 33, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              bodyFont: { size: 13, family: 'Pretendard' },
              padding: 10,
              cornerRadius: 6,
              displayColors: true,
              boxPadding: 4,
              callbacks: {
                label: function (context) {
                  return ` ${context.label}: ${context.raw}건`;
                }
              }
            }
          }
        }
      })
    }
  } catch (e) { console.error('매출 로드 실패', e) }
}

// B. 회원/비회원 방문 비율
const fetchLogs = async () => {
  try {
    const res = await axios.get('http://localhost:8080/parking-log/logs')
    const logs = res.data || []

    // 데이터 세팅
    logData.totalCount = logs.length
    logData.memberCount = logs.filter(l => l.isMember).length
    logData.nonMemberCount = logData.totalCount - logData.memberCount
    logData.recentLogs = logs.slice(0, 10)

    // 1. 도넛 차트 그리기 (비율)
    const isLogEmpty = logData.totalCount === 0; // 데이터 0건 체크

    new Chart(memberChartRef.value, {
      type: 'doughnut',
      data: {
        labels: isLogEmpty ? ['데이터 없음'] : ['회원', '비회원'],
        datasets: [{
          // 데이터가 없으면 가짜 링(1)을 그림
          data: isLogEmpty ? [1] : [logData.memberCount, logData.nonMemberCount],

          // 회원은 하늘색, 비회원은 반투명 그레이
          backgroundColor: isLogEmpty ? ['rgba(255, 255, 255, 0.05)'] : ['#82c2e3', 'rgba(255, 255, 255, 0.1)'],
          borderWidth: 0,
          borderRadius: isLogEmpty ? 0 : 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26, 29, 33, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            bodyFont: { size: 13, family: 'Pretendard' },
            padding: 10, cornerRadius: 6, displayColors: true, boxPadding: 4,

            yAlign: 'bottom',
            caretPadding: 15,

            callbacks: {
              label: function (context) {
                if (isLogEmpty) return ' 현재 방문 기록이 없습니다';
                return ` ${context.label}: ${context.raw}명`;
              }
            }
          }
        }
      }
    })

    // 요일별 평균 체류 시간
    const dowTotals = new Array(7).fill(0); const dowCounts = new Array(7).fill(0)
    logs.forEach(log => {
      if (log.duration && log.entryTime) {
        const idx = (new Date(log.entryTime).getDay() + 6) % 7; dowTotals[idx] += log.duration; dowCounts[idx]++
      }
    })
    const dowAvg = dowTotals.map((t, i) => dowCounts[i] > 0 ? Math.round(t / dowCounts[i]) : 0)

    // [기존 코드에서 차트 생성 부분 교체]
new Chart(stayTimeChartRef.value, {
  type: 'bar',
  data: {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [{
      label: '평균 체류시간(분)',
      data: dowAvg,
      // 그라데이션 효과를 위한 배경색 설정 (옵션)
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return '#82c2e3'
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(130, 194, 227, 0.9)')
        gradient.addColorStop(1, 'rgba(130, 194, 227, 0.3)')
        return gradient
      },
      borderColor: '#82c2e3',
      borderWidth: 1,
      borderRadius: 6, // 막대 상단 둥글게
      barThickness: 24 // 막대 두께 조정으로 꽉 찬 느낌 부여
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 20, right: 10, bottom: 0, left: 0 } // 상단 여백 추가
    },
    plugins: {
      legend: { display: false },
      // 툴팁 디자인 고도화
      tooltip: {
        backgroundColor: 'rgba(26, 29, 33, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#82c2e3',
        bodyFont: { size: 14, family: 'Pretendard', weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) { return `${context.parsed.y} 분` }
        }
      }
    },
    scales: {
      y: {
        display: true, // Y축 활성화
        beginAtZero: true,
        // Y축 그리드 라인 스타일링
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        // Y축 텍스트 스타일링
        ticks: {
          color: '#a1a1aa',
          font: { family: 'Pretendard', size: 11 },
          padding: 10,
          callback: function(value) { return value + '분' } // 단위 추가
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#a1a1aa', font: { family: 'Pretendard', size: 12 } }
      }
    }
  }
})
  } catch (e) { console.error('로그 로드 실패', e) }
}

// ===== C. 예측 차트 조회 =====
const fetchPrediction = async () => {
  try {
    const today = getTodayStr()
    const res = await axios.get('http://localhost:8080/dashBoard/parkingChart/short', {
      params: { startDate: today, endDate: today }
    })

    const operatingData = res.data.filter(item => item.time >= '08:30' && item.time <= '19:00')
    const predList = operatingData.map(item => item.predictedCars)
    const timeLabels = operatingData.map(item => item.time)

    const canvas = predictionChartRef.value

    const peakAnnotationPlugin = {
      id: 'peakAnnotation',
      afterDatasetsDraw: (chart) => {
        const { ctx, chartArea } = chart
        const dataset = chart.data.datasets[0]

        if (!dataset.data || dataset.data.length === 0) return

        // 가장 높은 숫자와 그 위치 찾기

        const maxVal = Math.max(...dataset.data)
        const maxIdx = dataset.data.indexOf(maxVal)
        const peakTime = chart.data.labels[maxIdx]

        const meta = chart.getDatasetMeta(0)
        const point = meta.data[maxIdx]
        // 점의 위치가 아직 계산 안 됐으면 대기
        if (!point || point.x === undefined) return

        ctx.save()

        // 수직 점선 그리기
        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
        ctx.lineTo(point.x, chartArea.bottom)
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(130, 194, 227, 0.8)'
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([]) // 점선 쓰고 나서 초기화

        // 빛나는 둥근 점 그리기
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(130, 194, 227, 1)'
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0 // 그림자도 초기화

        // AI 피크 예상' 네모 박스 그리기
        const text = `AI 피크 예상: ${peakTime}`
        ctx.font = 'bold 12px Pretendard'
        const textWidth = ctx.measureText(text).width
        const boxWidth = textWidth + 20
        const boxHeight = 28
        const boxX = point.x - boxWidth / 2
        const boxY = 0

        ctx.fillStyle = '#82c2e3'
        ctx.beginPath()
        const r = 6 // 모서리 둥글기
        // 직접 둥근 점 만들기
        ctx.moveTo(boxX + r, boxY)
        ctx.lineTo(boxX + boxWidth - r, boxY)
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r)
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r)
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight)
        ctx.lineTo(boxX + r, boxY + boxHeight)
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r)
        ctx.lineTo(boxX, boxY + r)
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
        ctx.closePath()
        ctx.fill()

        // 네모 박스 글씨
        ctx.fillStyle = '#1a1d21'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, point.x, boxY + boxHeight / 2)

        ctx.restore()
      }
    }

    // 차트 그리기
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: '예측 주차대수',
          data: predList,
          borderColor: '#82c2e3',
          backgroundColor: (context) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            // 영역이 없으면 기본색 반환
            if (!chartArea) return 'rgba(130, 194, 227, 0.2)'

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, 'rgba(130, 194, 227, 0.7)')
            gradient.addColorStop(1, 'rgba(130, 194, 227, 0.0)')
            return gradient
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#82c2e3'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 32, right: 10 }
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26, 29, 33, 0.95)',
            titleColor: '#ffffff',
            titleFont: { size: 16, weight: 'bold', family: 'Pretendard' },
            bodyColor: '#ffffff',
            bodyFont: { size: 14, family: 'Pretendard' },
            padding: 12, cornerRadius: 8, displayColors: true, boxPadding: 6,
            callbacks: {
              label: function (context) { return `예측 주차대수: ${context.parsed.y}대` }
            }
          }
        },
        scales: {
          y: {
            display: true,
            beginAtZero: true,
            grace: '5%',
            border: { display: false },
            grid: { display: true, color: 'rgba(255, 255, 255, 0.08)', drawTicks: false },
            ticks: { color: '#a1a1aa', font: { family: 'Pretendard', size: 11 }, padding: 10 }
          },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: '#a1a1aa', font: { family: 'Pretendard', size: 11 }, align: 'inner' }
          }
        }
      },
      plugins: [peakAnnotationPlugin]
    })
  } catch (e) {
    console.error('예측 로드 실패', e)
  }
}

// ===== D. EV 충전기 현황 및 알림 =====


// ===== E. 최근 입출차 현황 테이블 =====
// 실시간 주차 요금 계산 (상한제 및 회원 여부 반영)
const calculateRealTimeFee = (log) => {
  // 이미 정산 완료된 데이터가 있다면 그대로 반환
  if (log.exitTime && log.parkingFee > 0) {
    return log.parkingFee.toLocaleString() + '원'
  }

  const now = new Date()
  const entryTime = new Date(log.entryTime)
  let diffMinutes = Math.floor((now - entryTime) / (1000 * 60))

  // 1. 무료회차 판단 (30분 이내)
  if (diffMinutes <= 30) return '무료회차'

  // 2. 기본 무료 시간 30분 차감 후 계산 시작
  diffMinutes -= 30

  // 3. 30분 단위 요금 계산 (회원 1,000원 / 비회원 2,000원)
  const rate = log.isMember ? 1000 : 2000
  let currentFee = Math.ceil(diffMinutes / 30) * rate

  // 4. 일일 상한제 적용 (회원 30,000원 / 비회원 70,000원)
  const maxFee = log.isMember ? 30000 : 70000
  if (currentFee > maxFee) currentFee = maxFee

  return currentFee.toLocaleString() + '원'
}

// ===== 4. 마운트 시 실행 =====
onMounted(async () => {
  await fetchRevenue()
  await nextTick() // DOM 렌더링 대기
  fetchLogs()
  fetchPrediction()
})
</script>

<style scoped>
/* ==========================================
   전역 테마 연동 및 카드 기본 스타일
   ========================================== */
.dashboard-main-container {
  font-family: 'Pretendard', sans-serif;
  color: #ffffff;
  box-sizing: border-box;
  min-height: 100vh;
}

.glass-card {
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 17px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  height: 100%;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-color: rgba(130, 194, 227, 0.4);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 17px;
  color: #ffffff;
  letter-spacing: -0.5px;
}

/* =================
   레이아웃 그리드
   ================= */
/* 1열: 매출(1) : 비율(1) : 예측(1.5) */
.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 17px;
  /* 카드 사이 간격 */
  align-items: stretch;
  /* 옆 카드 높이에 맞춰 똑같이 늘어나게 함 */
}

.middle-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 17px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 17px;
}

.mt-20 {
  margin-top: 17px !important;
  /* 세로 간격도 17px로 통일 */
}

/* ==========================================
   내부 컴포넌트 디테일
   ========================================== */
.discount-text {
  color: #ff0000;
  font-weight: 500;
}

.chart-content {
  display: flex;
  justify-content: space-between;
  /* 좌우는 양끝으로 넓게 */
  align-items: center;
  flex: 1;
}

.chart-container {
  align-self: center;
}

.ratio-content {
  padding-left: 0 !important;
  justify-content: flex-start;
  gap: 35px;
}

/* 도넛 차트 정중앙에 들어갈 텍스트*/
.donut-inner-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  white-space: nowrap;
}

/* 매출 레전드 리스트 */
.sales-legend {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sales-legend li {
  font-size: 14px;
  color: #e5e8eb;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.sales-legend li::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

/* 사전 결제는 하늘색 박스 */
.sales-legend li.pre-pay::before {
  background-color: #82c2e3;
}

/* 현장 결제는 흰색 박스 */
.sales-legend li.on-site-pay::before {
  background-color: #ffffff;
}

.sales-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 15px;
}

.sales-info h2 {
  color: #ffffff;
  font-size: 32px;
  font-weight: 800;
}

.discount-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  align-self: flex-start;
  margin-top: 0;
}

.sales-info ul {
  font-size: 14px;
  color: #a1a1aa;
  margin: 0;
  list-style: none;
  padding: 0;
  line-height: 1.6;
}


/* ==========================================
   회원 방문 비율 카드 전용 CSS (글로우 & 디테일)
   ========================================== */

.glowing-donut canvas {
  filter: drop-shadow(0 0 8px rgba(130, 194, 227, 0.6));
}

/* 도넛 정중앙 텍스트 그룹 */
.donut-inner-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  /* 툴팁 방해 금지 */
  width: 100%;
}

.inner-main {
  font-size: 24px;
  font-weight: 800;
  color: #82c2e3;
  /* 앞 숫자는 강조된 하늘색 */
}

.inner-slash {
  font-size: 16px;
  color: #e5e8eb;
  /* 뒷 숫자는 연한 색 */
  font-weight: 500;
}

.inner-sub {
  font-size: 16px;
  color: #a1a1aa;
  margin-top: 4px;
}

/* 우측 정보 영역 레이아웃 */
.ratio-info-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  padding-left: 14px;
  gap: 10px;
}

/* 범례 리스트 */
.ratio-legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-legend-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #e5e8eb;
  font-weight: 500;
}

.ratio-legend-list li::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.member-dot::before {
  background: #82c2e3;
}

.non-member-dot::before {
  background: rgba(255, 255, 255, 0.15);
}

/* 구분선 */
.ratio-divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 5px 0;
  width: 100%;
}

.ratio-emphasis {
  color: #fff;
  font-size: 32px;
  font-weight: 800;
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.ratio-emphasis .unit {
  font-size: 16px;
  font-weight: 500;
  color: #e5e8eb;
}

/* 하단 다크 배지 */
.ratio-badge {
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  display: inline-block;
  align-self: flex-start;
}

/* 입출차 현황 테이블*/
.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.admin-table th {
  padding: 17px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 600;
}

.admin-table td {
  padding: 17px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 14px;
  color: #f5f5f5;
}

/* 데이터가 없을 때의 테이블 표시 */
.admin-table td[colspan="7"] {
  color: #a1a1aa;
  padding: 30px;
  font-style: italic;
}

/* EV 현황 파트 */
.ev-content-flex {
  display: flex;
  gap: 30px;
}

.ev-progress-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.prog-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

/* 체류시간 막대차트 목업 */
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
}

.bar-fill {
  width: 24px;
  background: #4a63e6;
  border-radius: 4px 4px 0 0;
}

.bar-col span {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 헤더 레이아웃 수정: 양끝 정렬(space-between) 적용 */
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
}

/* 왼쪽 타이틀과 탭 사이 간격 유지 */
.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  /* flex 적용 시 여백 초기화 */
}

/* 오른쪽 달력 영역 디자인 */
.relative-box {
  position: relative;
  /* 팝업이 이 박스를 기준으로 아래에 뜨게 함 */
}

.date-trigger-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #444d5630;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #3f3f46;
  color: #a1a1aa;
  cursor: pointer;
  transition: 0.2s;
}

.date-trigger-box:hover {
  border-color: #82c2e3;
  color: #fff;
}

.date-text {
  font-size: 14px;
  font-weight: 500;
  color: #e5edf8;
}

/* ==========================================
   3번 카드: 예상 주차 대수 뱃지 디테일
   ========================================== */
.card-header-flex {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  background: rgba(130, 194, 227, 0.15);
  color: #82c2e3;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
</style>