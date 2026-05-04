<template>
  <div class="management-container">
    <!-- 대타이틀 규격 유지 -->
    <header class="mgmt-header">
      <div class="header-left">
        <h2 class="page-title">시스템 관리</h2>
        <p class="page-subtitle">
          {{ isAuthorizedManager ? '관리자 권한 제어 및 시스템 환경을 설정합니다' : '내 계정 정보 및 개인 환경 설정을 관리합니다' }}
        </p>
      </div>
    </header>

    <div class="mgmt-main-layout">
      <!-- 좌측: 프로필 + 설정 -->
      <div class="side-column">
        <div class="glass-card profile-section">
          <h3 class="card-title">프로필</h3>
          <div class="profile-layout-vertical">
            <div class="avatar-circle-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="profile-details-expanded">
              <!-- 데이터 표시 체크: name, deptName, empNumber 등 다양한 필드 대응 -->
              <div class="detail-item">
                <span class="label">이름</span>
                <span class="val">{{ loginUser?.name || loginUser?.adminname || loginUser?.adminName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">부서</span>
                <span class="val">{{ loginUser?.deptName || loginUser?.deptname || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">사원번호</span>
                <span class="val">{{ loginUser?.emp_number || loginUser?.empnumber || loginUser?.empNumber || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">직위</span>
                <span class="val">{{ loginUser?.rank || '-' }}</span>
              </div>
              <button class="mypage-btn-large" @click="goToMyPage">마이페이지</button>
            </div>
          </div>
        </div>

        <div class="glass-card settings-compact-section">
          <h3 class="card-title">시스템 설정</h3>
          <div class="settings-list-compact">
            <div class="setting-row-mini">
              <span class="s-label-mini">화면 모드</span>
              <button class="mini-action-btn" @click="toggleTheme">{{ currentTheme }}</button>
            </div>
            <div class="setting-row-mini">
              <span class="s-label-mini">세션 시간</span>
              <div v-if="isAuthorizedManager" class="s-control-mini">
                <select class="mini-select" v-model="timeoutValue">
                  <option value="15">15분</option>
                  <option value="30">30분</option>
                  <option value="60">60분</option>
                </select>
                <button class="mini-save-btn" @click="saveSettings">저장</button>
              </div>
              <span v-else class="session-val">{{ timeoutValue }}분 (자동 로그아웃)</span>
            </div>
            <div class="divider"></div>
            <button class="logout-btn-full" @click="handleLogout">시스템 로그아웃</button>
          </div>
        </div>
      </div>

      <!-- 우측: 관리자 목록 (검색 및 필터 라인 정렬) -->
      <div class="main-column">
        <div class="glass-card list-card-full">
          <div class="card-header-flex">
            <div class="title-group">
              <h3 class="card-title">시스템 관리자 목록</h3>
              <span class="count-badge">Total: {{ totalAdminCount }}</span>
            </div>
            <div class="header-tools">
              <!-- 부서 필터 -->
              <select class="filter-select" v-model="selectedDept">
                <option v-for="dept in uniqueDepts" :key="dept" :value="dept">{{ dept }}</option>
              </select>
              <!-- 검색창 + 돋보기 아이콘 -->
              <div class="admin-search-wrapper">
                <input type="text" v-model="adminSearchQuery" placeholder="이름 또는 사번 검색..." class="admin-search-input" />
                <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
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
                  <th v-if="isAuthorizedManager">권한 제어</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedAdminList.length === 0">
                  <td :colspan="isAuthorizedManager ? 6 : 5" class="empty-msg">데이터가 없습니다</td>
                </tr>
                <tr v-for="admin in paginatedAdminList" :key="admin.empnumber || admin.empNumber">
                  <td class="emp-id-text">{{ admin.empnumber || admin.empNumber }}</td>
                  <td>{{ admin.adminname || admin.adminName }}</td>
                  <td>{{ admin.rank }}</td>
                  <td>{{ admin.deptname || admin.deptName }}</td>
                  <td>
                    <span class="dot-indicator" :class="{ 'active': admin.status === '재직' }"></span>
                    {{ admin.status }}
                  </td>
                  <td v-if="isAuthorizedManager" class="btn-cell">
                    <button class="status-btn" :class="admin.status === '재직' ? 'revoke' : 'grant'" @click="toggleAdminStatus(admin)">
                      {{ admin.status === '재직' ? '해제' : '부여' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="admin-pagination" v-if="adminTotalPages > 1">
            <button class="page-nav" :disabled="adminCurrentPage === 1" @click="adminCurrentPage--">‹</button>
            <span class="page-info">{{ adminCurrentPage }} / {{ adminTotalPages }}</span>
            <button class="page-nav" :disabled="adminCurrentPage === adminTotalPages" @click="adminCurrentPage++">›</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const adminList = ref([])
const loginUser = ref(null)
const currentTheme = ref(localStorage.getItem('theme') === 'light' ? 'Light' : 'Dark')
const timeoutValue = ref(localStorage.getItem('sessionTimeout') || '30')
const selectedDept = ref('전체')

// 관리자 목록 검색 및 페이징
const adminSearchQuery = ref('')
const adminCurrentPage = ref(1)
const adminItemsPerPage = ref(15) // 15개 기준

let sessionTimer = null

const fetchCurrentUser = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/my-info', { withCredentials: true })
    if (res.data) {
      loginUser.value = res.data
      console.log('내 정보 로드 성공:', loginUser.value) // 디버깅용
    }
  } catch (error) { console.error('내 정보 로드 실패', error) }
}

const isAuthorizedManager = computed(() => {
  const user = loginUser.value
  if (!user) return false
  const dept = user.deptName || user.deptname || ''
  const rank = user.rank || ''
  return dept.includes('주차') && rank === '팀장'
})

const fetchAdmins = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/dashboard-admins', { withCredentials: true })
    adminList.value = res.data
  } catch (e) { console.error('관리자 목록 로드 실패', e) }
}

const uniqueDepts = computed(() => {
  const depts = new Set(adminList.value.map(a => a.deptname || a.deptName))
  return ['전체', ...Array.from(depts)]
})

// 검색 + 부서 필터가 적용된 전체 목록
const searchedAdminList = computed(() => {
  let list = adminList.value

  // 1. 부서 필터
  if (selectedDept.value !== '전체') {
    list = list.filter(a => (a.deptname || a.deptName) === selectedDept.value)
  }

  // 2. 이름/사번 검색
  if (adminSearchQuery.value) {
    const q = adminSearchQuery.value.toLowerCase()
    list = list.filter(a => {
      const name = (a.adminname || a.adminName || '').toLowerCase()
      const emp = (a.empnumber || a.empNumber || '').toLowerCase()
      return name.includes(q) || emp.includes(q)
    })
  }
  return list
})

const totalAdminCount = computed(() => searchedAdminList.value.length)

// 페이징 처리된 목록
const adminTotalPages = computed(() => Math.ceil(totalAdminCount.value / adminItemsPerPage.value) || 1)

const paginatedAdminList = computed(() => {
  const start = (adminCurrentPage.value - 1) * adminItemsPerPage.value
  return searchedAdminList.value.slice(start, start + adminItemsPerPage.value)
})

// 검색어 바뀌면 페이지 1로 리셋
watch(adminSearchQuery, () => { adminCurrentPage.value = 1 })
watch(selectedDept, () => { adminCurrentPage.value = 1 })

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
  sessionTimer = setTimeout(() => { sessionStorage.clear(); router.push('/admin/login') }, minutes * 60 * 1000)
}

const saveSettings = () => {
  localStorage.setItem('sessionTimeout', timeoutValue.value)
  startSessionTimer(Number(timeoutValue.value))
  alert(`세션 시간이 ${timeoutValue.value}분으로 적용되었습니다`)
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
  padding: 0 4px;
  color: #f5f5f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 17px;
}

/* 대타이틀 규격 유지 */
.mgmt-header {
  border-left: 5px solid #82c2e3;
  padding-left: 17px;
  margin-bottom: 5px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.page-subtitle {
  color: rgba(245, 245, 245, 0.6);
  font-size: 18px;
  margin-top: 5px;
}

/* 레이아웃: 좌우 박스 크기 균형 조정 */
.mgmt-main-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 17px;
  flex: 1;
  min-height: 0;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.main-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 카드 공통 규격 (17px gap, 10px radius, 444D56 30%) */
.glass-card {
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 10px;
  padding: 20px;
}

/* 프로필 & 설정 섹션 (좌측) */
.profile-section { flex: 0 0 auto; }
.settings-compact-section { flex: 1; }

.title-group {
  display: flex;
  align-items: baseline; /* 텍스트 하단 라인 맞춤 */
  gap: 12px;
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  margin-bottom: 17px;
}

.count-badge {
  font-size: 16px;
  color: rgba(245, 245, 245, 0.5);
}

/* 프로필 섹션 디테일 */
.profile-layout-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-circle-large {
  width: 120px;
  height: 120px;
  background: rgba(245, 245, 245, 0.05);
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
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
}

.detail-item .label {
  color: rgba(245, 245, 245, 0.6);
  font-size: 16px;
}

.detail-item .val {
  font-weight: 500;
  font-size: 18px;
  color: #fff;
}

.mypage-btn-large {
  margin-top: 10px;
  background: #fbb900;
  border: none;
  border-radius: 5px;
  padding: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
}

/* 시스템 설정 섹션 */
.settings-compact-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-list-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.setting-row-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.s-label-mini {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.mini-action-btn,
.mini-save-btn {
  background: rgba(130, 194, 227, 0.1);
  border: 1px solid #82c2e3;
  color: #82c2e3;
  padding: 5px 12px;
  border-radius: 5px;
  font-size: 14px;
}

.logout-btn-full {
  margin-top: auto;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff0000;
  color: #ff0000;
  padding: 12px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

/* 관리자 목록 섹션 */
.list-card-full {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 오른쪽 필터/검색 그룹 */
.header-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 필터(Select) 디자인 */
.filter-select {
  background-color: #444d5661;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f5f5f5;
  height: 34px;
  padding: 0 10px;
  border-radius: 5px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

/* 검색창 및 돋보기 디자인 */
.admin-search-wrapper {
  display: flex;
  align-items: center;
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  padding: 0 12px;
  height: 34px;
}

.admin-search-input {
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  width: 180px;
  font-size: 13px;
}

.search-icon-svg {
  color: rgba(245, 245, 245, 0.4);
  margin-left: 5px;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.admin-table th {
  position: sticky;
  top: 0;
  background: #252a30;
  z-index: 10;
  padding: 15px;
  font-size: 16px;
  color: rgba(245, 245, 245, 0.6);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
}

.admin-table td {
  padding: 15px;
  font-size: 16px;
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
}

/* 페이지네이션 */
.admin-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
}

.page-nav {
  background: transparent;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
}

.page-info {
  font-size: 14px;
  color: rgba(245, 245, 245, 0.6);
}

.dot-indicator.active {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.status-btn {
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
}

.status-btn.revoke {
  color: #ff0000;
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.status-btn.grant {
  color: #82c2e3;
  border: 1px solid rgba(130, 194, 227, 0.3);
}
</style>