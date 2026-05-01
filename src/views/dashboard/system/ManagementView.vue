<template>
  <div class="management-container">
    <header class="mgmt-header">
      <div class="header-left">
        <h2 class="page-title">시스템 관리</h2>
        <p class="page-subtitle">
          {{ isAuthorizedManager ? '관리자 권한 제어 및 시스템 환경을 설정합니다' : '내 계정 정보 및 개인 환경 설정을 관리합니다' }}
        </p>
      </div>
    </header>

    <div class="mgmt-main-layout">

      <div class="side-column">
        <!-- 프로필 카드 -->
        <div class="glass-card profile-section flex-grow-2">
          <h3 class="card-title">프로필</h3>
          <div class="profile-layout-vertical">
            <div class="avatar-container">
              <div class="avatar-circle-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <div class="profile-details-expanded">
              <div class="detail-item"><span class="label">이름</span><span class="val">{{ loginUser?.name ||
                loginUser?.adminname }}</span></div>
              <div class="detail-item"><span class="label">부서</span><span class="val">{{ loginUser?.deptName ||
                loginUser?.deptname }}</span></div>
              <div class="detail-item"><span class="label">사원번호</span><span class="val">{{ loginUser?.emp_number ||
                loginUser?.empnumber }}</span></div>
              <div class="detail-item"><span class="label">직위</span><span class="val">{{ loginUser?.rank }}</span></div>
              <!-- 마이페이지 새 창 연동 -->
              <button class="mypage-btn-large" @click="goToMyPage">마이페이지</button>
            </div>
          </div>
        </div>

        <!-- 시스템 설정 및 로그아웃 -->
        <div class="glass-card settings-compact-section">
          <h3 class="card-title">시스템 설정</h3>
          <div class="settings-list-compact">
            <div class="setting-row-mini">
              <div class="s-info-mini">
                <span class="s-label-mini">화면 모드</span>
              </div>
              <button class="mini-action-btn" @click="toggleTheme">{{ currentTheme }}</button>
            </div>

            <!-- 세션 시간: 팀장은 컨트롤 셀렉트, 일반 직원은 텍스트 노출 -->
            <div class="setting-row-mini">
              <div class="s-info-mini">
                <span class="s-label-mini">세션 시간</span>
              </div>
              <div v-if="isAuthorizedManager" class="s-control-mini">
                <select class="mini-select" v-model="timeoutValue">
                  <option value="15">15분</option>
                  <option value="30">30분</option>
                  <option value="60">60분</option>
                </select>
                <button class="mini-save-btn" @click="saveSettings">저장</button>
              </div>
              <div v-else class="s-control-mini">
                <span style="font-size: 13px; color: #a1a1aa;">{{ timeoutValue }}분 (자동 로그아웃)</span>
              </div>
            </div>

            <div class="divider"></div>

            <button class="logout-btn-full" @click="handleLogout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                class="logout-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              시스템 로그아웃
            </button>
          </div>
        </div>
      </div>

      <!-- 관리자 목록 -->
      <div class="main-column">
        <div class="glass-card list-card-full">
          <div class="card-header-flex">
            <h3 class="card-title">시스템 관리자 목록</h3>
            <div class="header-tools">
              <select class="glass-select-mini" v-model="selectedDept">
                <option v-for="dept in uniqueDepts" :key="dept" :value="dept">{{ dept }}</option>
              </select>
              <span class="count-badge">Total: {{ filteredAdminList.length }}</span>
            </div>
          </div>

          <div class="table-container scrollable-area">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>사원번호</th>
                  <th>성함</th>
                  <th>직위</th>
                  <th>부서</th>
                  <th>상태</th>
                  <!-- 팀장일 때만 권한 제어 테이블 헤더 노출 -->
                  <th v-if="isAuthorizedManager">권한 제어</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredAdminList.length === 0">
                  <!-- 컬럼 수 동적 변화에 대응하기 위해 colspan 조절 -->
                  <td :colspan="isAuthorizedManager ? 6 : 5" style="text-align: center; color: #a1a1aa; padding: 30px;">
                    해당 부서의 데이터가 없습니다
                  </td>
                </tr>
                <tr v-for="admin in filteredAdminList" :key="admin.empnumber || admin.empNumber">
                  <td class="emp-id-text">{{ admin.empnumber || admin.empNumber }}</td>
                  <td>{{ admin.adminname || admin.adminName }}</td>
                  <td>{{ admin.rank }}</td>
                  <td>{{ admin.deptname || admin.deptName }}</td>
                  <td>
                    <span class="dot-indicator" :class="{ 'active': admin.status === '재직' }"></span>
                    {{ admin.status }}
                  </td>
                  <!-- 팀장일 때만 액션 버튼 컬럼 노출 -->
                  <td v-if="isAuthorizedManager" class="btn-cell">
                    <button class="status-btn" :class="admin.status === '재직' ? 'revoke' : 'grant'"
                      @click="toggleAdminStatus(admin)">
                      {{ admin.status === '재직' ? '해제' : '부여' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const adminList = ref([])
const loginUser = ref(null)
const currentTheme = ref(localStorage.getItem('theme') === 'light' ? 'Light' : 'Dark')
const timeoutValue = ref(localStorage.getItem('sessionTimeout') || '30')
const selectedDept = ref('전체')

let sessionTimer = null

const fetchCurrentUser = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/my-info', { withCredentials: true });
    if (res.data) loginUser.value = res.data;
  } catch (error) { console.error('Auth Error', error); }
}

const isAuthorizedManager = computed(() => {
  const user = loginUser.value;
  if (!user) return false;
  const dept = user.deptName || user.deptname || '';
  return dept.includes('주차') && user.rank === '팀장';
})

const fetchAdmins = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/dashboard-admins', { withCredentials: true })
    adminList.value = res.data
  } catch (e) { console.error('List Error', e) }
}

const uniqueDepts = computed(() => {
  const depts = new Set(adminList.value.map(a => a.deptname || a.deptName))
  return ['전체', ...Array.from(depts)]
})

const filteredAdminList = computed(() => {
  if (selectedDept.value === '전체') return adminList.value
  return adminList.value.filter(a => (a.deptname || a.deptName) === selectedDept.value)
})

const toggleAdminStatus = async (admin) => {
  const isRevoke = admin.status === '재직'
  const newStatus = isRevoke ? '권한해제' : '재직'
  const targetEmp = admin.empnumber || admin.empNumber
  if (confirm('권한 상태를 변경하시겠습니까?')) {
    try {
      const res = await axios.put('http://localhost:8080/admin/update-status',
        { empNumber: targetEmp, status: newStatus }, { withCredentials: true }
      );
      if (res.data === 'success') { admin.status = newStatus; alert('처리 완료'); }
    } catch (e) { alert('오류 발생'); }
  }
}

const handleLogout = () => {
  if (confirm('시스템에서 로그아웃 하시겠습니까?')) {
    sessionStorage.clear()
    router.push('/admin/login')
  }
}

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'Dark' ? 'Light' : 'Dark'
  currentTheme.value = newTheme
  const themeValue = newTheme === 'Light' ? 'light' : 'dark'
  localStorage.setItem('theme', themeValue)
  if (themeValue === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  window.dispatchEvent(new Event('storage'))
}

const goToMyPage = () => {
  window.open('/mypage', '_blank')
}

const startSessionTimer = (minutes) => {
  if (sessionTimer) clearTimeout(sessionTimer)
  const ms = minutes * 60 * 1000
  sessionTimer = setTimeout(() => {
    alert('보안을 위해 세션이 만료되어 자동 로그아웃됩니다.')
    sessionStorage.clear()
    router.push('/admin/login')
  }, ms)
}

const saveSettings = () => {
  localStorage.setItem('sessionTimeout', timeoutValue.value)
  startSessionTimer(Number(timeoutValue.value))
  alert(`세션 시간이 ${timeoutValue.value}분으로 적용되어 타이머가 재시작되었습니다`)
}

onMounted(async () => {
  await fetchCurrentUser()
  await fetchAdmins()
  startSessionTimer(Number(timeoutValue.value))
})

onUnmounted(() => {
  if (sessionTimer) clearTimeout(sessionTimer)
})
</script>

<style scoped>
.management-container {
  padding: 0;
  color: #fff;
  height: calc(100vh - 105px);
  display: flex;
  flex-direction: column;
}

.mgmt-header {
  margin-bottom: 15px;
  flex-shrink: 0;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0;
}

.page-subtitle {
  color: #a1a1aa;
  font-size: 13px;
}

/* 🪄 레이아웃 통합: 권한 상관없이 동일한 그리드 적용 */
.mgmt-main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 15px;
  flex: 1;
  min-height: 0;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
}

.profile-layout-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.main-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.glass-card {
  background: rgba(68, 77, 86, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.avatar-circle-large {
  width: 140px;
  height: 140px;
  background: #31363f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #82c2e3;
  border: 2px solid rgba(130, 194, 227, 0.2);
}

.profile-details-expanded {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item .label {
  color: #a1a1aa;
  font-size: 13px;
}

.detail-item .val {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}

.mypage-btn-large {
  margin-top: auto;
  background: #fbb900;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-weight: 700;
  color: #1a1d21;
  cursor: pointer;
  width: 100%;
}

.settings-compact-section {
  flex: 1;
  justify-content: space-between;
}

.settings-list-compact {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-row-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.s-label-mini {
  font-size: 14px;
  font-weight: 500;
  color: #e5edf8;
}

.mini-action-btn,
.mini-save-btn {
  background: rgba(130, 194, 227, 0.1);
  border: 1px solid #82c2e3;
  color: #82c2e3;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.mini-select {
  background: #1a1d21;
  border: 1px solid #3f3f46;
  color: #fff;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}

.logout-btn-full {
  width: 100%;
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid #ff5252;
  color: #ff5252;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.list-card-full {
  height: 100%;
  flex: 1;
}

.scrollable-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
  margin-top: 10px;
}

.scrollable-area::-webkit-scrollbar {
  width: 4px;
}

.scrollable-area::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 10px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  position: sticky;
  top: 0;
  background: #252a30;
  padding: 12px;
  text-align: left;
  font-size: 13px;
  color: #a1a1aa;
  z-index: 2;
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 14px;
}

.emp-id-text {
  color: #82c2e3;
  font-weight: 500;
}

.dot-indicator {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #444;
  margin-right: 5px;
}

.dot-indicator.active {
  background: #4caf50;
  box-shadow: 0 0 6px #4caf50;
}

.status-btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #fff;
}

.status-btn.revoke {
  color: #ff5252;
  border-color: rgba(255, 82, 82, 0.2);
}

.del-row-btn {
  background: #ff5252;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 4px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #82c2e3;
  margin: 0 0 15px 0;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.glass-select-mini {
  background: #1a1d21;
  border: 1px solid #3f3f46;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.count-badge {
  font-size: 11px;
  color: #82c2e3;
  background: rgba(130, 194, 227, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}
</style>