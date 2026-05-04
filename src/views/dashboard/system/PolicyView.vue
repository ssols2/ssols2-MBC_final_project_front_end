<template>
  <div class="policy-wrapper">
    <header class="view-header">
      <h3 class="view-title">운영 정책 및 요금</h3>
      <p class="view-desc">병원의 주차 및 충전 인프라 운영 규칙을 실시간으로 관리합니다</p>
    </header>

    <div class="policy-grid">
      <section class="policy-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
          <h4>기본 주차 요금 정책</h4>
        </div>
        <div class="card-body">
          <div class="input-item">
            <label>비회원 요금 (30분당)</label>
            <div class="input-group"><input type="number" value="2000"> <span>원</span></div>
          </div>
          <div class="input-item">
            <label>회원/정기권 요금 (30분당)</label>
            <div class="input-group"><input type="number" value="1000"> <span>원</span></div>
          </div>
          <p class="helper-text">* 기본 무료 회차 시간 이후부터 과금되는 단가임</p>
        </div>
      </section>

      <section class="policy-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 12V8H4v4M4 12v4h16v-4M4 12h16M12 4v16" />
          </svg>
          <h4>감면 및 무료 시간 정책</h4>
        </div>
        <div class="card-body">
          <div class="input-item">
            <label>기본 무료 회차 시간</label>
            <div class="input-group"><input type="number" value="30"> <span>분</span></div>
          </div>
          <div class="input-item">
            <label>진료 환자 추가 감면</label>
            <div class="input-group"><input type="number" value="120"> <span>분</span></div>
          </div>
          <p class="helper-text">* 진료 완료 환자는 총 150분(30+120)의 무료 혜택을 받음</p>
        </div>
      </section>

      <section class="policy-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h4>등급별 일일 결제 상한액</h4>
        </div>
        <div class="card-body">
          <div class="input-item">
            <label>진료 환자 최대 요금</label>
            <div class="input-group"><input type="number" value="20000"> <span>원</span></div>
          </div>
          <div class="input-item">
            <label>일반 회원 최대 요금</label>
            <div class="input-group"><input type="number" value="30000"> <span>원</span></div>
          </div>
          <div class="input-item">
            <label>비회원 최대 요금</label>
            <div class="input-group"><input type="number" value="70000"> <span>원</span></div>
          </div>
        </div>
      </section>

      <section class="policy-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h4>EV 충전 인프라 단가</h4>
        </div>
        <div class="card-body">
          <div class="input-item">
            <label>완속 충전 단가 (1kW)</label>
            <div class="input-group"><input type="number" value="180"> <span>원</span></div>
          </div>
          <div class="input-item">
            <label>급속 충전 단가 (1kW)</label>
            <div class="input-group"><input type="number" value="324"> <span>원</span></div>
          </div>
          <p class="helper-text">* 한국전력공사 표준 충전 단가 기준 시뮬레이션</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 운영 정책 및 요금 CSS */
.policy-wrapper {
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  gap: 17px;
  background: transparent;
  height: 100%;
}

.view-header {
  border-left: 5px solid #82c2e3;
  padding-left: 17px;
  margin-bottom: 5px;
}

.view-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.view-desc {
  font-size: 18px;
  color: rgba(245, 245, 245, 0.6);
}

.policy-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 17px;
}

.policy-card {
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: 0.3s;
}

.policy-card:hover {
  border-color: rgba(130, 194, 227, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #82c2e3;
  margin-bottom: 5px;
}

.card-icon {
  width: 24px;
  height: 24px;
}

.card-header h4 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-item label {
  font-size: 18px;
  color: rgba(245, 245, 245, 0.6);
  font-weight: 500;
}

.input-group {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: 5px;
  padding: 0 12px;
}

.input-group input {
  flex: 1;
  background: transparent;
  border: none;
  color: #82c2e3;
  padding: 12px 0;
  outline: none;
  font-size: 20px;
  font-weight: 800;
  text-align: right;
  padding-right: 8px;
}

.input-group span {
  color: rgba(245, 245, 245, 0.4);
  font-size: 14px;
  font-weight: 500;
}

.helper-text {
  font-size: 16px;
  color: rgba(245, 245, 245, 0.538);
  font-style: italic;
  margin-top: 5px;
}
</style>