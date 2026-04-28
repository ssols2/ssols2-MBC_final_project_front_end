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
          <div class="admin-row" v-for="admin in adminList" :key="admin.empNumber">
            <div class="admin-info">
              <span class="admin-id">사번: {{ admin.empnumber }}</span>
              <span class="admin-name">{{ admin.adminname }} {{ admin.rank }} ({{ admin.deptname }})</span>
            </div>
            <div class="admin-actions">
              <span class="role-badge">Super Admin</span>

              <button class="action-btn" :class="admin.status === '재직' ? 'revoke-btn' : 'grant-btn'"
                @click="toggleAdminStatus(admin)" :disabled="!isAuthorizedManager">
                {{ admin.status === '재직' ? '권한 해제' : '권한 부여' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mgmt-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <h4>시스템 환경 설정</h4>
        </div>

        <div class="env-body">
          <div class="env-item">
            <div class="env-info">
              <span class="env-label">시스템 테마 모드 (현재: {{ currentTheme }})</span>
              <span class="env-sub">다크 / 라이트 모드 중 하나를 선택합니다</span>
            </div>
            <button class="mode-switch-btn" @click="toggleTheme">테마 전환</button>
          </div>

          <div class="env-item">
            <div class="env-info">
              <span class="env-label">비활동 자동 로그아웃</span>
              <span class="env-sub">미사용 시 보안을 위해 자동으로 세션을 종료합니다</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <select class="timeout-select" v-model="timeoutValue" :disabled="!isAuthorizedManager">
                <option value="10">10분</option>
                <option value="30">30분</option>
                <option value="60">60분</option>
              </select>
              <button class="action-btn grant-btn" @click="saveSystemSettings" :disabled="!isAuthorizedManager">
                설정 저장
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// ── [1] 상태 변수 정의 ──
const adminList = ref([])
const currentUser = ref({ deptName: '', rank: '' })
const currentTheme = ref('다크')
const timeoutValue = ref('30')

// ── [2] 실제 로그인 유저 정보 연동 ──
const fetchCurrentUser = () => {
  // 로그인 시 sessionStorage나 localStorage에 저장해둔 유저 정보를 가져옴
  // 예: sessionStorage.setItem('loginUser', JSON.stringify({ deptName: '주차관리팀', rank: '팀장', ... }))
  const storedUser = sessionStorage.getItem('loginUser')
  
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  } else {
    console.warn('로그인된 사용자 정보가 없습니다')
  }
}

// ── [3] 권한 검사 로직 (주차팀 & 팀장) ──
const isAuthorizedManager = computed(() => {
  return currentUser.value.deptName?.includes('주차') && currentUser.value.rank === '팀장'
})

// ── [4] 관리자 목록 로드 API ──
const fetchAdmins = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/dashboard-admins')
    adminList.value = res.data
  } catch (e) {
    console.error('관리자 목록 로드 실패', e)
  }
}

// ── [5] 관리자 권한 상태 변경 API ──
const toggleAdminStatus = async (admin) => {
  if (!isAuthorizedManager.value) {
    alert('권한 관리는 주차팀 팀장만 가능합니다')
    return
  }

  const isRevoke = admin.status === '재직'
  const actionText = isRevoke ? '권한을 해제' : '권한을 부여'
  
  if (!confirm(`정말 ${admin.adminname}님의 ${actionText}하시겠습니까?`)) {
    return
  }

  try {
    const newStatus = isRevoke ? '권한해제' : '재직'
    await axios.put('http://localhost:8080/admin/update-status', {
      empNumber: admin.empnumber,
      status: newStatus
    })

    admin.status = newStatus
    alert(`정상적으로 ${actionText}되었습니다`)
  } catch (e) {
    console.error('상태 변경 실패', e)
    alert('권한 변경에 실패했습니다')
  }
}

// ── [6] 테마 전환 로직 (개인 설정) ──
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === '다크' ? '라이트' : '다크'
  // 실제 CSS 변수나 body 클래스를 변경하는 로직
  document.body.setAttribute('data-theme', currentTheme.value === '다크' ? 'dark' : 'light')
}

// ── [7] 시스템 환경 설정 저장 로직 (전역 설정) ──
const saveSystemSettings = async () => {
  if (!isAuthorizedManager.value) {
    alert('시스템 환경 설정은 주차관리팀 팀장만 수정할 수 있습니다')
    return
  }

  try {
    // 나중에 자바 백엔드에 세션 타임아웃 값을 업데이트하는 API 연동 공간
    // await axios.post('http://localhost:8080/admin/update-settings', { timeout: timeoutValue.value })
    alert(`비활동 자동 로그아웃 시간이 ${timeoutValue.value}분으로 저장되었습니다`)
  } catch (e) {
    console.error('설정 저장 실패', e)
  }
}

// ── [8] 마운트 시 실행 ──
onMounted(() => {
  fetchCurrentUser()
  fetchAdmins()
})
</script>

<style scoped>
.management-wrapper {
  padding: 30px;
  background: #09090b;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.view-header {
  border-left: 4px solid #82c2e3;
  padding-left: 15px;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.view-desc {
  font-size: 14px;
  color: #a1a1aa;
  margin: 0;
}

.management-content {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.mgmt-card {
  background: #1e1e2d;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.card-icon {
  width: 22px;
  height: 22px;
  color: #82c2e3;
}

.card-header h4 {
  font-size: 18px;
  color: #f4f4f5;
  margin: 0;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-row {
  background: #12121c;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-id {
  font-size: 12px;
  color: #82c2e3;
  font-family: monospace;
}

.admin-name {
  font-size: 15px;
  color: #fff;
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.role-badge {
  background: rgba(130, 194, 227, 0.1);
  color: #82c2e3;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #71717a;
}

.env-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.env-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.env-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.env-label {
  font-size: 15px;
  color: #fff;
  font-weight: 600;
}

.env-sub {
  font-size: 12px;
  color: #71717a;
}

.timeout-select {
  background: #12121c;
  border: 1px solid #3f3f46;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  outline: none;
}

.mode-switch-btn {
  background: #3f3f46;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

/* 권한 버튼 스타일 지정 */
.action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

/* 권한 해제 (위험행동 - 붉은색) */
.revoke-btn {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.3);
}
.revoke-btn:hover:not(:disabled) {
  background: rgba(255, 77, 79, 0.2);
}

/* 권한 부여 (안전행동 - 푸른색) */
.grant-btn {
  background: rgba(130, 194, 227, 0.1);
  color: #82c2e3;
  border: 1px solid rgba(130, 194, 227, 0.3);
}
.grant-btn:hover:not(:disabled) {
  background: rgba(130, 194, 227, 0.2);
}

/* 비활성화 상태 (권한 없는 사람) */
.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
  border: 1px solid #d4d4d4;
  color: #d4d4d4;
}
</style>