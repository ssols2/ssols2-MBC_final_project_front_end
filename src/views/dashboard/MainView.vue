<template>
  <div class="dashboard-main-container">
    <header class="overview-header">
      <div class="header-left">
        <h2 class="page-title">Overview</h2>
      </div>

      <div class="header-right">
        <div class="live-status-box">
          <div class="pulse-dot"></div>
          <span class="live-text">LIVE : 실시간 모니터링 중</span>
        </div>
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

          <div class="chart-container" style="position: relative;">
            <canvas ref="revenueChartRef"></canvas>
            <div class="donut-inner-text">총 {{ (revenueData.pre_payment_count || 0) + (revenueData.on_site_payment_count
              || 0) }}건</div>
          </div>
        </div>
      </div>

      <div class="glass-card visitor-ratio" @click="goPage('/dashboard/vehicle-control')">
        <h3 class="card-title">회원/비회원 방문 비율</h3>

        <div class="chart-content ratio-content" v-if="logData">
          <div class="chart-container" style="position: relative; width: 180px; height: 180px;">
            <canvas ref="memberChartRef"></canvas>
          </div>

          <div class="ratio-info-area">
            <div class="ratio-emphasis">
              <span class="inner-main">{{ memberPercent }}</span><span class="unit">%</span>
            </div>
            <ul class="ratio-legend-list">
              <li class="member-dot">회원 {{ logData.memberCount }}명</li>
              <li class="non-member-dot">비회원 {{ logData.nonMemberCount }}명</li>
            </ul>
            <div class="ratio-badge">전체 방문 {{ logData.totalCount }}명</div>
          </div>
        </div>
      </div>

      <div class="glass-card entry-prediction" @click="goPage('/dashboard/vehicle-control')">
        <div class="card-header-flex">
          <h3 class="card-title" style="margin-bottom: 0;">예상 주차 대수</h3>
          <div class="status-badge">AI 실시간 분석중</div>
        </div>

        <div class="chart-placeholder">
          <canvas ref="predictionChartRef"></canvas>
        </div>
      </div>
    </section>

    <section class="middle-grid mt-20">
      <div class="glass-card ev-monitor-card" @click="goPage('/dashboard/ev-infra')" style="cursor: pointer;">
        <h3 class="card-title">EV 충전기 현황 및 알림</h3>

        <div class="ev-split-container">
          <div class="ev-left-panel">
            <div class="panel-header">
              <span class="panel-sub-title">실시간 충전기 상태</span>
              <select class="floor-select" v-model="selectedFloor" @click.stop>
                <option value="ALL">전체(선택)</option>
                <option value="1F">B1층</option>
                <option value="2F">B2층</option>
                <option value="3F">B3층</option>
                <option value="4F">B4층</option>
                <option value="5F">B5층</option>
              </select>
            </div>

            <div class="status-bars" v-if="allChargers.length > 0">
              <div class="status-row">
                <span class="s-label">사용중</span>
                <div class="s-bar-bg">
                  <div class="s-bar-fill bg-blue" :style="{ width: getBarHeight(evStatusCount.CHARGING) }"></div>
                </div>
                <span class="s-val">{{ evStatusCount.CHARGING }} / {{ allChargers.length }}대 ({{
                  Math.round((evStatusCount.CHARGING / allChargers.length) * 100) || 0 }}%)</span>
                <span class="s-icon icon-blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
              </div>

              <div class="status-row">
                <span class="s-label">대기</span>
                <div class="s-bar-bg">
                  <div class="s-bar-fill bg-teal" :style="{ width: getBarHeight(evStatusCount.READY) }"></div>
                </div>
                <span class="s-val">{{ evStatusCount.READY }} / {{ allChargers.length }}대 ({{
                  Math.round((evStatusCount.READY / allChargers.length) * 100) || 0 }}%)</span>
                <span class="s-icon icon-teal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </div>

              <div class="status-row">
                <span class="s-label">경고/고장</span>
                <div class="s-bar-bg">
                  <div class="s-bar-fill bg-red" :style="{ width: getBarHeight(evStatusCount.FAULT) }"></div>
                </div>
                <span class="s-val">{{ evStatusCount.FAULT }} / {{ allChargers.length }}대</span>
                <span class="s-icon icon-red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z">
                    </path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </span>
              </div>
            </div>

            <div class="status-bars" v-else>
              <div style="color: #94a3b8; text-align: center; margin-top: 20px;">데이터를 불러오는 중입니다...</div>
            </div>

            <div class="total-status-text">전체 현황 {{ evStatusCount.CHARGING + evStatusCount.READY + evStatusCount.FAULT
            }} / {{ allChargers.length }}대</div>
          </div>

          <div class="ev-vertical-divider"></div>

          <div class="ev-right-panel">
            <div class="noti-section">
              <div class="panel-sub-title">장애 및 이상 징후 알림</div>
              <ul class="noti-list">
                <li v-if="filteredIssueList.length === 0">
                  <div class="noti-content" style="color: #94a3b8;">현재 발생한 장애나 이상 징후가 없습니다.</div>
                </li>
                <li v-for="(issue, index) in filteredIssueList" :key="index" class="clickable-issue"
                  @click.stop="goToEvDetail(issue.evChargerId)">
                  <div class="noti-content">
                    <svg width="8" height="8" class="dot-svg"
                      :class="issue.chargerStatus === 'FAULT' ? 'red' : 'yellow'">
                      <circle cx="4" cy="4" r="4" fill="currentColor" />
                    </svg>
                    <span class="tag" :class="issue.chargerStatus === 'FAULT' ? 'red' : 'yellow'">[{{
                      issue.chargerStatus === 'FAULT' ? '장애' : '경고' }}]</span>
                    {{ issue.evChargerId }} | {{ issue.statusLabel }}
                  </div>
                  <div class="noti-badge" :class="issue.chargerStatus === 'FAULT' ? 'red-outline' : 'yellow-outline'">
                    {{ issue.chargerStatus === 'FAULT' ? '조치 필요' : '확인 필요' }}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card stay-time" @click="goPage('/dashboard/vehicle-control')">
        <h3 class="card-title" style="margin-bottom: 5px;">요일별 평균 체류시간</h3>
        <div class="chart-placeholder" style="position: relative; flex: 1; width: 100%; min-height: 0;">
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
              <th>국가 정확도</th>
              <th>번호판 정확도</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logData.recentLogs.length === 0">
              <td colspan="8">데이터가 없습니다</td>
            </tr>
            <tr v-for="log in logData.recentLogs" :key="log.parkingLogId">
              <td style="color: #82c2e3">{{ log.vehicleNum }}</td>
              <td>{{ log.isMember ? '회원' : '비회원' }}</td>
              <td>{{ formatTime(log.entryTime) }}</td>
              <td>{{ log.exitTime ? formatTime(log.exitTime) : '-' }}</td>
              <td>{{ Math.round(log.countryAccuracy || 0) }}%</td>
              <td
                :style="{ color: log.ocrAccuracy < 85 ? '#f59e0b' : '#fff', fontWeight: log.ocrAccuracy < 85 ? '700' : 'normal' }">
                <svg v-if="log.ocrAccuracy < 85" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  style="vertical-align: middle; margin-right: 4px;">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z">
                  </path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {{ Math.round(log.ocrAccuracy || 0) }}%
              </td>

              <td style="font-weight: 600;">
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
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { useRouter } from 'vue-router'

// [달력]
// 오늘 날짜 기본 세팅 함수
const getTodayStr = () => new Date().toISOString().split('T')[0]

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
const memberPercent = computed(() => {
  if (logData.totalCount === 0) return 0
  return Math.round((logData.memberCount / logData.totalCount) * 100)
})

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
            backgroundColor: ['#82c2e3', '#e2e8f0'], // 하늘색, 흰색
            borderWidth: 0,
            cutout: '55%',           // 도넛 차트 두께 조절
            borderRadius: 10,        // 끝부분을 둥글게
            spacing: 4,              // 세그먼트 사이 간격 추가
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: 5               // 도넛이 박스에 너무 딱 붙지 않게 여유 공간 확보
          },
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
                label: (context) => ` ${context.label}: ${context.raw}건`
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

    // 파이 차트 그리기 (비율)
    const isLogEmpty = logData.totalCount === 0
    // 둘 중 한 종류의 방문자만 있을 경우 체크
    const hasOnlyOneType = logData.memberCount === 0 || logData.nonMemberCount === 0

    new Chart(memberChartRef.value, {
      type: 'pie',
      data: {
        labels: isLogEmpty ? ['기록 없음'] : ['회원', '비회원'],
        datasets: [{
          data: isLogEmpty ? [1] : [logData.memberCount, logData.nonMemberCount],
          backgroundColor: isLogEmpty ? ['rgba(255, 255, 255, 0.05)'] : ['#fbb900', '#3a4349'],
          borderWidth: 0,
          borderRadius: (isLogEmpty || hasOnlyOneType) ? 0 : 8,
          spacing: (isLogEmpty || hasOnlyOneType) ? 0 : 5,
          hoverOffset: isLogEmpty ? 0 : 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 15 },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(26, 29, 33, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            bodyFont: { size: 14, family: 'Pretendard' },
            padding: 15, cornerRadius: 6, displayColors: true, boxPadding: 4,
            xAlign: 'center',
            yAlign: 'bottom',
            callbacks: {
              label: (context) => {
                if (isLogEmpty) return ' 방문 기록이 없습니다'
                return ` ${context.label}: ${context.raw}명`
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
            if (!chartArea) return null

            const dayColors = [
              '#ffd54f',
              '#fbb900',
              '#005baa',
              '#0d79c2',
              '#3492cd',
              '#5baad8',
              '#82c2e3'
            ]

            const index = context.dataIndex
            const baseColor = dayColors[index] || '#82c2e3'

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, baseColor)
            gradient.addColorStop(1, baseColor + '44')
            return gradient
          },
          borderColor: (context) => {
            const dayColors = ['#ffd54f', '#fbb900', '#005baa', '#0d79c2', '#3492cd', '#5baad8', '#82c2e3']
            return dayColors[context.dataIndex] || '#82c2e3'
          },
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, right: 10, bottom: 0, left: 0 } // 상단 여백 추가
        },
        plugins: {
          legend: { display: false },
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
            grace: '10%',
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
              callback: function (value) { return value + '분' } // 단위 추가
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
        if (!meta.data || meta.data.length === 0) return

        const point = meta.data[maxIdx]
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

        let boxX = point.x - boxWidth / 2
        let boxY = point.y - boxHeight - 12
        if (boxY < 0) {
          boxY = point.y + 15
        }

        if (boxX < chartArea.left) boxX = chartArea.left
        if (boxX + boxWidth > chartArea.right) boxX = chartArea.right - boxWidth

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
        ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2)

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
          padding: { top: 35, right: 20, left: 10 }
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
// EV 상태별 카운트 저장용 변수
const selectedFloor = ref('ALL')
const allChargers = ref([])
const evStatusCount = ref({ READY: 0, CHARGING: 0, FAULT: 0 })
let updateTimer = null

// 알림 클릭 시 특정 기기의 예지보전 탭으로 바로 이동
const goToEvDetail = (chargerId) => {
  router.push({
    path: '/dashboard/ev-infra',
    query: { tab: 'predictive', chargerId: chargerId }
  })
}

// 막대그래프 실제 전체 기기 수로 동적 계산
const getBarHeight = (count) => {
  const max = allChargers.value.length || 15
  return `${(count / max) * 100}%`
}

// 데이터 호출 함수
const fetchEvData = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/ev/chargers')

    if (Array.isArray(response.data)) {
      allChargers.value = response.data.map(c => {
        const floorStr = c.evChargerId ? c.evChargerId.split('-')[0] : 'ALL'

        const statusKor =
          c.chargerStatus === 'CHARGING' ? '충전 중' :
            (c.chargerStatus === 'STANDBY' || c.chargerStatus === 'READY') ? '대기 중' :
              c.chargerStatus === 'FAULT' ? '장애 발생' :
                c.chargerStatus === 'CHECK' ? '점검 필요' :
                  c.chargerStatus === 'RISK' ? '위험 감지' : '상태 불명'

        return {
          ...c,
          floorLabel: floorStr,      // 화면 표출 및 필터링용 층수 (예: '1F')
          statusLabel: statusKor     // 화면 표출용 한글 상태 (예: '대기 중')
        }
      })
    } else {
      console.warn('서버에서 올바른 배열 데이터를 주지 않았습니다.', response.data)
      allChargers.value = []
    }
    updateCounts()
  } catch (error) {
    console.error('EV 데이터 호출 실패:', error)
    allChargers.value = [] // 통신 실패 시 화면 뻗지 않게 빈 배열 처리
    updateCounts()
  }
}

// 카운트 및 필터링
const updateCounts = () => {
  // allChargers.value가 배열이 아닐 경우 강제 종료 (filter 에러 원천 차단)
  if (!Array.isArray(allChargers.value)) return;

  const filtered = selectedFloor.value === 'ALL'
    ? allChargers.value
    : allChargers.value.filter(c => c.floorLabel === selectedFloor.value)

  evStatusCount.value = {
    READY: filtered.filter(c => c.chargerStatus === 'READY' || c.chargerStatus === 'STANDBY').length,
    CHARGING: filtered.filter(c => c.chargerStatus === 'CHARGING').length,
    FAULT: filtered.filter(c => ['CHECK', 'RISK', 'FAULT', 'POWER_OFF'].includes(c.chargerStatus)).length
  }
}

const filteredIssueList = computed(() => {
  if (!Array.isArray(allChargers.value)) return []

  return allChargers.value
    .filter(c => ['CHECK', 'RISK', 'FAULT', 'POWER_OFF'].includes(c.chargerStatus))
    .filter(c => selectedFloor.value === 'ALL' || c.floorLabel === selectedFloor.value)
    .slice(0, 5)
})

watch(selectedFloor, updateCounts)

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

onMounted(async () => {
  await fetchRevenue()
  await nextTick() // DOM 렌더링 대기
  fetchLogs()
  fetchPrediction()
  fetchEvData()
  updateTimer = setInterval(fetchEvData, 15000)
})

onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer) // 페이지 나갈 때 타이머 해제
})
</script>

<style scoped>
/* ==========================================
   1. 전역 & 공통 레이아웃 (Global & Common)
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
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-color: rgba(130, 194, 227, 0.4);
}

.card-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 17px;
  color: #f5f5f5;
  letter-spacing: -0.5px;
}

.mt-20 {
  margin-top: 17px;
}

/* 1열: 매출(1) : 비율(1) : 예측(1.5) */
.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 17px;
  align-items: stretch;
}

.top-grid .glass-card {
  height: 280px;
  display: flex;
  flex-direction: column;
  padding: 17px;
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

.chart-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  height: 100%;
}

.chart-container {
  position: relative;
  width: 170px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


/* ==========================================
   2. 헤더 영역 (Overview Header & 달력)
   ========================================== */
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 17px;
  border-left: 5px solid #82c2e3;
  padding-left: 17px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

/* ==========================================
   3. 상단 왼쪽 카드: 금일 총 매출
   ========================================== */
.sales-status {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.sales-status .chart-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: 0;
}

.sales-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.sales-info h2 {
  color: #ffffff;
  font-size: 30px;
  font-weight: 800;
  margin: 5px 0 17px 0;
}

.sales-legend {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 8px 0 17px 0;
}

.sales-legend li {
  font-size: 16px;
  color: #ebebeb9c;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

/* 도넛 색상 맞춤 동그라미 아이콘 */
.sales-legend li::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.sales-legend li.pre-pay::before {
  background-color: #82c2e3;
}

.sales-legend li.on-site-pay::before {
  background-color: #ffffff;
}

.discount-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  align-self: flex-start;
  margin-bottom: 17px 0 17px 0;
}

/* 뚱도넛 내부 텍스트 위치 정중앙 고정 */
.chart-container {
  position: relative;
  width: 145px;
  height: 145px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.donut-inner-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
  text-align: center;
}

/* ==========================================
   4. 상단 중앙 카드: 회원/비회원 방문 비율
   ========================================== */
.visitor-ratio {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.visitor-ratio .ratio-content {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex: 1;
  padding: 0;
  gap: 80px;
}

.ratio-info-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.ratio-emphasis {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: -5px 0 17px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.ratio-emphasis .inner-main {
  font-size: 30px;
  font-weight: 800;
  color: #fbb900;
}

.ratio-emphasis .unit {
  font-size: 18px;
  color: #e5e8eb;
  font-weight: 600;
}

.ratio-legend-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: -5px 0 17px 0;
}

.ratio-legend-list li {
  font-size: 16px;
  color: #ebebeb9c;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.ratio-legend-list li::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.member-dot::before {
  background: #fbb900;
}

.non-member-dot::before {
  background: rgba(255, 255, 255, 0.15);
}

.ratio-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  align-self: flex-start;
  margin-bottom: -5px;
}


/* ==========================================
   5. 상단 우측 카드: 예상 주차 대수
   ========================================== */
.card-header-flex {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
}

.status-badge {
  background: rgba(130, 194, 227, 0.15);
  color: #82c2e3;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.entry-prediction .chart-placeholder {
  flex: 1;
  /* 남은 공간 꽉 채우기 */
  min-height: 0;
  /* 찌부러짐 방지 */
  position: relative;
  width: 100%;
}


/* ==========================================
   6. 중단 왼쪽 카드: EV 충전기 현황 및 알림
   ========================================== */
.ev-monitor-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.ev-split-container {
  display: flex;
  flex: 1;
  margin-top: 5px;
}

/* 좌우 패널 및 중앙 선 */
.ev-left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 17px;
}

.ev-vertical-divider {
  width: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
}

.ev-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 17px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
}

.panel-sub-title {
  font-size: 18px;
  color: #e5e8eb;
  font-weight: 500;
}

/* 층 선택 셀렉트박스 */
.floor-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e8eba6;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.floor-select:hover {
  border-color: rgba(130, 194, 227, 0.5);
}

.floor-select option {
  background: #1a1d21;
  color: #fff;
}

/* 좌측 가로 진행바 (사용중, 대기, 고장) */
.status-bars {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.s-label {
  width: 65px;
  font-size: 16px;
  color: #a1a1aa;
  font-weight: 500;
}

.s-bar-bg {
  flex: 1;
  height: 36px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.s-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.5s ease-out;
}

.bg-blue {
  background: #82c2e3;
}

.bg-teal {
  background: #359ca5;
}

.bg-red {
  background: #ff0000;
}

.s-val {
  width: 90px;
  font-size: 13px;
  color: #94a3b8;
  text-align: right;
}

.s-icon {
  display: block;
}

.dot-svg {
  flex-shrink: 0;
  margin-right: 8px;
}

.icon-blue {
  color: #60a5fa;
}

.icon-teal {
  color: #2dd4bf;
}

.icon-red {
  color: #ef4444;
}

.dot-svg.red {
  color: #ef4444;
}

.dot-svg.yellow {
  color: #f59e0b;
}

.dot-svg.teal {
  color: #2dd4bf;
}


.total-status-text {
  text-align: right;
  color: #f59e0b;
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
}

/* 우측 알림 리스트 영역 */
.noti-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mt-10 {
  margin-top: 15px;
}

.noti-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.noti-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #d1d5db;
}

.noti-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.red {
  background: #ef4444;
}

.dot.yellow {
  background: #f59e0b;
}

.dot.teal {
  background: #2dd4bf;
}

.tag {
  font-weight: 700;
  margin-right: 2px;
}

.tag.red {
  color: #ef4444;
}

.tag.yellow {
  color: #f59e0b;
}

.tag.teal {
  color: #2dd4bf;
}

.noti-badge {
  font-size: 14px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.red-outline {
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.yellow-outline {
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #f59e0b;
}

/* 우측 알림 리스트 클릭(호버) 효과 */
.clickable-issue {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-left: -8px;
  /* 패딩 준 만큼 왼쪽으로 당겨서 글씨 열 맞춤 */
}

.clickable-issue:hover {
  background: rgba(255, 255, 255, 0.08);
  /* 마우스 올리면 배경색 살짝 들어옴 */
  transform: translateX(4px);
  /* 오른쪽으로 살짝 밀리는 애니메이션 */
}


/* ==========================================
   7. 하단 카드: 최근 입출차 현황 테이블
   ========================================== */
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

.admin-table td[colspan="7"] {
  color: #a1a1aa;
  padding: 30px;
  font-style: italic;
}

/* 상단 우측 영역 */
.live-status-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(34, 197, 94, 0.1);
  /* 초록색 반투명 배경 */
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
}

.live-text {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  /* 산뜻한 초록색 */
  letter-spacing: 0.5px;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background-color: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 1);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}
</style>