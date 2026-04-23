<template>
  <div class="management-wrapper">
    <header class="view-header">
      <h3 class="view-title">시스템 및 계정 관리</h3>
      <p class="view-desc">관리자 권한 제어 및 시스템 환경 변수를 설정합니다</p>
    </header>

    <div class="management-content">
      <section class="mgmt-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <h4>관리자 권한 및 계정 관리</h4>
        </div>
        
        <div class="admin-list">
          <div class="admin-row" v-for="n in 3" :key="n">
            <div class="admin-info">
              <span class="admin-id">사번: 2026042{{n}}</span>
              <span class="admin-name">관리자{{n}} (보안팀)</span>
            </div>
            <div class="admin-actions">
              <span class="role-badge">Super Admin</span>
              <div class="status-toggle">
                <span class="status-label">계정 활성</span>
                <input type="checkbox" checked class="toggle-input">
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mgmt-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <h4>시스템 환경 설정</h4>
        </div>
        
        <div class="env-body">
          <div class="env-item">
            <div class="env-info">
              <span class="env-label">시스템 테마 모드</span>
              <span class="env-sub">다크 / 라이트 모드 중 하나를 선택합니다</span>
            </div>
            <button class="mode-switch-btn">테마 전환</button>
          </div>

          <div class="env-item">
            <div class="env-info">
              <span class="env-label">비활동 자동 로그아웃</span>
              <span class="env-sub">미사용 시 보안을 위해 자동으로 세션을 종료합니다</span>
            </div>
            <select class="timeout-select">
              <option>10분</option>
              <option selected>30분</option>
              <option>60분</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.management-wrapper { padding: 30px; background: #09090b; min-height: 100%; display: flex; flex-direction: column; gap: 30px; }
.view-header { border-left: 4px solid #82c2e3; padding-left: 15px; }
.view-title { font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 8px 0; }
.view-desc { font-size: 14px; color: #a1a1aa; margin: 0; }

.management-content { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }

.mgmt-card { background: #1e1e2d; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.card-icon { width: 22px; height: 22px; color: #82c2e3; }
.card-header h4 { font-size: 18px; color: #f4f4f5; margin: 0; }

.admin-list { display: flex; flex-direction: column; gap: 12px; }
.admin-row { background: #12121c; padding: 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
.admin-info { display: flex; flex-direction: column; gap: 4px; }
.admin-id { font-size: 12px; color: #82c2e3; font-family: monospace; }
.admin-name { font-size: 15px; color: #fff; }

.admin-actions { display: flex; align-items: center; gap: 20px; }
.role-badge { background: rgba(130, 194, 227, 0.1); color: #82c2e3; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }

.status-toggle { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #71717a; }

.env-body { display: flex; flex-direction: column; gap: 20px; }
.env-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.env-info { display: flex; flex-direction: column; gap: 4px; }
.env-label { font-size: 15px; color: #fff; font-weight: 600; }
.env-sub { font-size: 12px; color: #71717a; }

.timeout-select { background: #12121c; border: 1px solid #3f3f46; color: #fff; padding: 8px 12px; border-radius: 8px; outline: none; }
.mode-switch-btn { background: #3f3f46; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
</style>