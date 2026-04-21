<template>
  <div class="dashboard-main-container">
    <h2>Overview</h2>
    <section class="overview-grid">
      <div class="glass-card parking-status">
        <h3 class="card-title">주차 현황</h3>
        <div class="chart-content">
          <div class="donut-placeholder">80 / 200 (40%)</div>
          <div class="status-info">
            <p><strong>80</strong>대 점유중</p>
            <span class="sub-text">잔여 120대</span>
          </div>
        </div>
      </div>

      <div class="glass-card sales-status">
        <h3 class="card-title">금일 총 매출</h3>
        <div class="chart-content">
          <div class="sales-info">
            <h2 class="main-color">₩2,450,000</h2>
            <ul>
              <li>사전 결제 00건</li>
              <li>현장 결제 00건</li>
            </ul>
          </div>
          <div class="donut-placeholder mini">총 00건</div>
        </div>
      </div>

      <div class="glass-card urgent-alerts">
        <div class="card-header">
          <h3 class="card-title">긴급 알림 <span class="count">총 3건</span></h3>
          <span class="more-link">전체 ></span>
        </div>
        <ul class="alert-list">
          <li class="alert-item error">
            <span class="tag">OCR 오류</span> 게이트 1 인식 실패
            <button class="btn-detail">자세히</button>
          </li>
          <li class="alert-item warning">
            <span class="tag">과속 감지</span> B1 B구역 10km/h 초과
            <button class="btn-detail">자세히</button>
          </li>
        </ul>
      </div>
    </section>

    <section class="status-grid mt-20">
      <div class="glass-card ev-status">
        <h3 class="card-title">EV 충전기 현황 및 알림</h3>
        <div class="ev-content">
          <div class="progress-area">
            <div class="prog-item">사용중 <div class="bar-bg"><div class="bar active" style="width: 60%"></div></div> 60%</div>
            <div class="prog-item">대기 <div class="bar-bg"><div class="bar idle" style="width: 30%"></div></div> 30%</div>
          </div>
          <div class="ev-notices">
            <p class="notice error">[심각 장애] B2구역 B-3 커넥터 수명 종료</p>
            <p class="notice warning">[경고] B5구역 B-1 커넥터 편차 오류</p>
          </div>
        </div>
      </div>

      <div class="glass-card entry-prediction">
        <h3 class="card-title">예상 입차 대수</h3>
        <div class="chart-placeholder">
          <div class="ai-tag">AI 피크 예상: 13:30</div>
        </div>
      </div>
    </section>

    <section class="data-grid mt-20">
      <div class="glass-card table-section">
        <h3 class="card-title">입출차 현황</h3>
        <table class="admin-table">
          <thead>
            <tr>
              <th>차량번호</th>
              <th>회원</th>
              <th>입차</th>
              <th>출차</th>
              <th>주차 위치</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>12가4567</td><td>회원</td><td>09:30</td><td>-</td><td>B2 B37</td><td>₩12,000</td></tr>
            <tr><td>16허5578</td><td>회원</td><td>11:17</td><td>14:43</td><td>B3 D1</td><td>₩3,000</td></tr>
          </tbody>
        </table>
      </div>

      <div class="glass-card cctv-section">
        <h3 class="card-title">CCTV</h3>
        <div class="cctv-grid">
          <div class="cctv-feed">Feed 1</div>
          <div class="cctv-feed">Feed 2</div>
          <div class="cctv-feed">Feed 3</div>
          <div class="cctv-feed">Feed 4</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* 폰트 및 배경 설정 */
.dashboard-main-container {
  font-family: 'Pretendard', sans-serif;
  color: #fff;
  padding: 10px;
}

/* 메인 컬러 변수 */
:root {
  --primary-blue: #005baa;
  --light-blue: #82c2e3;
  --point-yellow: #fbb900;
  --bg-dark: #111;
  --card-bg: rgba(255, 255, 255, 0.05);
}

/* 카드 공통 스타일 */
.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #f5f5f5;
}

/* 그리드 시스템 */
.overview-grid { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 20px; }
.status-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
.data-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }

/* 버튼 스타일 (가이드 준수) */
.btn-detail {
  border-radius: 5px; /* 가이드: 5px */
  background: var(--card-bg);
  border: 1px solid #fbb900; /* 포인트 컬러 */
  color: #fbb900;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-detail:hover {
  background: #fbb900;
  color: #222;
}

/* 테이블 스타일 */
.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  color: #666; /* 서브 텍스트 컬러 */
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-table td {
  padding: 15px 8px;
  font-size: 14px;
}

/* 긴급 알림 아이템 */
.alert-item {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.alert-item.error { background: rgba(255, 0, 0, 0.1); border-left: 4px solid #ff4d4d; }
.alert-item.warning { background: rgba(255, 185, 0, 0.1); border-left: 4px solid #fbb900; }

.mt-20 { margin-top: 20px; }
.main-color { color: var(--light-blue); }
</style>