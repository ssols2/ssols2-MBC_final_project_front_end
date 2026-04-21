<template>
  <div class="charger-operation-summary">
    <div class="header-row">
      <h3 class="card-title">EV 인프라 가동률 및 요약</h3>
    </div>

    <div class="summary-row">
      <div class="summary-box">
        <div class="summary-top">
          <div class="summary-label">
            <span class="summary-icon line"></span>
            <span>최근 7일 평균 사용량</span>
          </div>

          <svg class="mini-line-chart" viewBox="0 0 44 24" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#fbb900"
              stroke-width="2"
              points="2,18 12,13 21,8 30,11 40,4"
            />
            <circle cx="2" cy="18" r="2" fill="#fbb900" />
            <circle cx="12" cy="13" r="2" fill="#fbb900" />
            <circle cx="21" cy="8" r="2" fill="#fbb900" />
            <circle cx="30" cy="11" r="2" fill="#fbb900" />
            <circle cx="40" cy="4" r="2" fill="#fbb900" />
          </svg>
        </div>

        <div class="summary-bottom">
          <div class="summary-value-wrap">
            <span class="summary-value">18,542</span>
            <span class="summary-unit">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change">▲ 5.2%</span>
            <span class="summary-sub">전주 대비</span>
          </div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-top">
          <div class="summary-label">
            <span class="summary-icon bar"></span>
            <span>최근 30일 평균 사용량</span>
          </div>

          <div class="mini-bar-chart">
            <span class="mini-bar h1"></span>
            <span class="mini-bar h2"></span>
            <span class="mini-bar h3"></span>
            <span class="mini-bar h4"></span>
          </div>
        </div>

        <div class="summary-bottom">
          <div class="summary-value-wrap">
            <span class="summary-value">72,364</span>
            <span class="summary-unit">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change">▲ 3.7%</span>
            <span class="summary-sub">전월 대비</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-header">
      <div class="chart-legend">
        <div class="chart-legend-item">
          <span class="chart-line-sample"></span>
          <span>가동률(%)</span>
        </div>
        <div class="chart-legend-item">
          <span class="chart-bar-sample"></span>
          <span>충전량(kWh)</span>
        </div>
      </div>

      <div class="chart-right-label">충전량(kWh)</div>
    </div>

    <div class="chart-wrap">
      <div class="y-axis">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0</span>
      </div>

      <div class="chart-main">
        <div class="grid-lines">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="bar-series">
          <div v-for="(value, index) in bars" :key="index" class="bar-col">
            <div class="bar" :style="{ height: `${(value / 25000) * 100}%` }"></div>
          </div>
        </div>

        <svg class="line-series" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2f7df6" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#2f7df6" stop-opacity="0" />
            </linearGradient>
          </defs>
        
          <polygon
            :points="`${linePoints} 100,100 0,100`"
            fill="url(#lineAreaGradient)"
          />
        
          <polyline
            fill="none"
            stroke="#fbb900"
            stroke-width="0.2"
            :points="linePoints"
          />
        
          <circle
            v-for="(value, index) in line"
            :key="`point-${index}`"
            :cx="(index / (line.length - 1)) * 100"
            :cy="100 - value"
            r="0.4"
            fill="#fbb900"
          />
        </svg>

        <div class="x-axis">
          <span v-for="label in labels" :key="label">{{ label }}</span>
        </div>
      </div>

      <div class="right-axis">
        <span>25,000</span>
        <span>20,000</span>
        <span>15,000</span>
        <span>10,000</span>
        <span>5,000</span>
        <span>0</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const labels = [
  '1','2','3','4','5','6',
  '7','8','9','10','11','12',
  '13','14','15','16','17','18',
  '19','20','21','22','23','24'
]

const bars = [
  3200, 1800, 1200, 4100, 2600, 3400,
  5200, 6100, 9800, 8700, 4900, 11200,
  14220, 13100, 11800, 6100, 8200, 7300,
  9700, 12800, 8600, 11400, 5200, 2100
]

const line = [
  22, 14, 9, 28, 18, 24,
  33, 38, 57, 49, 31, 66,
  82, 74, 61, 36, 45, 41,
  56, 71, 49, 63, 29, 12
]

const linePoints = line
  .map((value, index) => {
    const x = (index / (line.length - 1)) * 100
    const y = 100 - value
    return `${x},${y}`
  })
  .join(' ')
</script>

<style scoped>
.charger-operation-summary {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.header-row {
  margin-bottom: 14px;
}

.card-title {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-box {
  padding: 10px 14px;
  border: 1px solid #2b3553;
  border-radius: 8px;
  background: #11182c;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.summary-icon.line {
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: #fbb900;
}

.summary-icon.bar {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #82c2e3;
}

.mini-line-chart {
  width: 46px;
  height: 26px;
  flex: 0 0 46px;
}

.mini-bar-chart {
  display: flex;
  align-items: end;
  gap: 4px;
  width: 44px;
  height: 28px;
  flex: 0 0 44px;
}

.mini-bar {
  width: 6px;
  background: #82c2e3;
  border-radius: 2px 2px 0 0;
}

.mini-bar.h1 { height: 14px; }
.mini-bar.h2 { height: 22px; }
.mini-bar.h3 { height: 28px; }
.mini-bar.h4 { height: 18px; }

.summary-bottom {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.summary-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-value {
  color: #ffffff;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.5;
}

.summary-unit {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.summary-change-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.summary-change {
  color: #45c15a;
  font-size: 12px;
  font-weight: 700;
}

.summary-sub {
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-legend {
  display: flex;
  gap: 18px;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
}

.chart-line-sample {
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #fbb900;
}

.chart-bar-sample {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #82c2e3;
}

.chart-right-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
}

.chart-wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 46px 1fr 58px;
  gap: 10px;
  align-items: stretch;
}

.y-axis {
  padding-top: 8px;
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  font-size: 12px;
}

.chart-main {
  position: relative;
  min-height: 290px;
  padding: 8px 0 28px;
}

.grid-lines {
  position: absolute;
  inset: 8px 0 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-lines span {
  display: block;
  width: 100%;
  border-top: 1px solid rgba(125, 162, 227, 0.18);
}

.bar-series {
  position: absolute;
  inset: 8px 0 28px 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  align-items: end;
  gap: 4px;
}

.bar-col {
  display: flex;
  justify-content: center;
  align-items: end;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 14px;
  background: linear-gradient(to top, #5ea7cf 0%, #a9ddf4 100%);
}

.line-series {
  position: absolute;
  inset: 8px 0 28px 0;
  width: 100%;
  height: calc(100% - 36px);
  pointer-events: none;
}

.x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  text-align: center;
  color: #ffffff;
  font-size: 11px;
}

.right-axis {
  padding-top: 8px;
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  font-size: 12px;
  text-align: right;
}
</style>