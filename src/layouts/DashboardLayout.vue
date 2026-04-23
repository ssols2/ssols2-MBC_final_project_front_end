<template>
    <div class="dashboard-wrapper">

        <aside class="side-main-tab-area">
            <div class="logo-area">
                <img src="@/assets/txtlogo3.png" alt="서울에스병원 라이트로고" class="main-logo" />
            </div>

            <ul class="main-tab-menu">
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/main') }"
                    @click="goToPage('/dashboard/main')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    대시보드
                </li>
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/monitoring') }"
                    @click="goToPage('/dashboard/monitoring')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    주차 모니터링
                </li>
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/vehicle-control') }"
                    @click="goToPage('/dashboard/vehicle-control')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    출입 차량 관제
                </li>
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/payment') }"
                    @click="goToPage('/dashboard/payment')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                        <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    요금 정산 관리
                </li>
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/cctv') }"
                    @click="goToPage('/dashboard/cctv')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    영상 보안 관리
                </li>
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/ev') }"
                    @click="goToPage('/dashboard/ev')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    EV 인프라 관리
                </li>

                <li class="tab-item-group" :class="{
                    'is-open': isSystemMenuOpen,
                    'active-group': $route.path.includes('/system')
                }">
                    <div class="tab-item parent" @click="toggleSystemMenu">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3" />
                            <path
                                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        시스템 설정

                        <svg class="arrow-icon" :class="{ 'rotate': isSystemMenuOpen }" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    <ul v-show="isSystemMenuOpen" class="sub-menu-list">
                        <li class="sub-item" :class="{ active: isActiveMenu('/dashboard/system/policy') }"
                            @click="goToPage('/dashboard/system/policy')"> • 요금 및 운영 정책 설정
                        </li>
                        <li class="sub-item" :class="{ active: isActiveMenu('/dashboard/system/history') }"
                            @click="goToPage('/dashboard/system/history')">
                            • 통합 알림 및 장애 이력
                        </li>
                        <li class="sub-item" :class="{ active: isActiveMenu('/dashboard/system/management') }"
                            @click="goToPage('/dashboard/system/management')">
                            • 시스템 및 계정 관리
                        </li>
                    </ul>
                </li>
            </ul>

            <div class="bottom-widget">
                <div class="weather-card" v-if="weather">
                    <div class="weather-main">
                        <span class="weather-icon-svg">{{ weatherIcon }}</span>
                        <div class="weather-info">
                            <span class="weather-condition">{{ weather.skyCondition }}</span>
                            <span class="weather-temp">{{ weather.temp }}°C</span>
                        </div>
                    </div>
                    <div class="weather-refresh-info">마지막 갱신: {{ lastUpdated }}</div>

                    <div class="weather-details">
                        <div class="weather-item"><span class="label">강수</span><span class="value">{{ weather.rainfallMm
                        }}mm</span></div>
                        <div class="weather-item"><span class="label">습도</span><span class="value">{{ weather.humidity
                        }}%</span></div>
                        <div class="weather-item wide">
                            <span class="label">미세먼지</span>
                            <span class="value" :class="pm10Class">{{ weather.pm10 }}㎍ ({{ pm10Label }})</span>
                        </div>
                        <div class="weather-item wide">
                            <span class="label">초미세</span>
                            <span class="value" :class="pm25Class">{{ weather.pm25 }}㎍ ({{ pm25Label }})</span>
                        </div>
                    </div>
                </div>
                <div class="weather-card loading" v-else>날씨 정보를 불러오는 중...</div>

                <div class="reservation-box">
                    <div class="res-header">
                        <span class="res-title">금일 예약 현황</span>
                        <div class="live-dot"></div>
                    </div>
                    <div class="res-count-area">
                        <span class="res-count">{{ reservationCount || 0 }}</span>
                        <span class="res-unit">건</span>
                    </div>
                </div>
            </div>
        </aside>


        <div class="main-area">

            <header class="main-header">
                <div class="header-left">
                    <span class="header-time">{{ currentFullTime }}</span>
                </div>

                <div class="header-right">
                    <div class="search-bar">
                        <input type="text" placeholder="Search..." />
                        <svg width="18" height="18" class="search-icon" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>

                    <div class="util-actions">
                        <button class="icon-btn" title="새로고침" @click="handleRefresh">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                            </svg>
                        </button>

                        <div class="dropdown-wrapper">
                            <button class="icon-btn notify-btn" :class="{ 'active': isNotifyOpen }" title="알림"
                                @click="toggleNotify">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                <span class="notification-badge" v-if="unreadCount > 0"></span>
                            </button>

                            <div class="notify-dropdown glass-panel" v-if="isNotifyOpen">
                                <div class="dropdown-header">알림 (미확인 {{ unreadCount }}건)</div>
                                <div class="notify-filters">
                                    <span class="active">전체({{ unreadCount }})</span>
                                    <span>EV({{ notifyCounts.ev }})</span>
                                    <span>OCR({{ notifyCounts.ocr }})</span>
                                </div>
                                <ul class="notify-list">
                                    <li v-for="item in notifyList" :key="item.id" class="notify-item"
                                        :class="item.alertClass">
                                        <div class="notify-icon">{{ item.icon }}</div>
                                        <div class="notify-text">
                                            <strong>{{ item.title }}</strong>
                                            <span class="time-log" v-if="item.subText">{{ item.subText }}</span>
                                        </div>
                                        <button class="action-btn" :class="item.btnClass"
                                            @click="handleAlertAction(item)">
                                            {{ item.btnText }}
                                        </button>
                                    </li>
                                    <li v-if="notifyList.length === 0" class="notify-item empty">
                                        새로운 알림이 없습니다
                                    </li>
                                </ul>
                                <div class="dropdown-footer" @click="goToPage('/dashboard/system/history')">
                                    알림 모두 보기
                                </div>
                            </div>
                        </div>

                        <button class="icon-btn" title="즐겨찾기">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <polygon
                                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    </div>

                    <div class="dropdown-wrapper">
                        <div class="user-profile" :class="{ 'active': isProfileOpen }" @click="toggleProfile">
                            <div class="avatar-circle">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff"
                                    stroke-width="2">
                                    <path
                                        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <span class="user-name">{{ adminName }}({{ adminDept }})</span>
                            <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>

                        <div class="profile-dropdown glass-panel" v-if="isProfileOpen">
                            <div class="profile-card">
                                <div class="profile-avatar-large"></div>
                                <div class="profile-info-text">
                                    <span class="p-name">{{ adminName }}(관리자)</span>
                                    <span class="p-id">사번: {{ adminId }}</span>
                                    <span class="p-dept">소속: {{ adminDept }}</span>
                                </div>
                            </div>
                            <ul class="profile-menu-list">
                                <li @click="goToMyPage">마이페이지</li>
                                <li @click="goToPage('/dashboard/system/management')">환경설정</li>
                            </ul>
                            <button class="logout-btn">로그아웃
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="mode-toggle" @click="toggleTheme">
                        <div class="toggle-track">
                            <div class="toggle-thumb" :class="{ 'active': isDarkMode }">
                                <svg v-if="isDarkMode" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="5" />
                                    <path
                                        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>
            </header>

            <main class="content-container">
                <router-view />
            </main>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'

// ==========================================
// 1. 상태 관리 변수 모음
// ==========================================
// 관리자 정보
const adminName = ref('주임')
const adminDept = ref('주차관리팀')

// 날씨 및 시간 정보
const weather = ref(null)
const currentTime = ref('')      // 날씨 카드용 (HH:mm:ss)
const currentFullTime = ref('')  // 헤더용 (YYYY-MM-DD HH:mm:ss)
const lastUpdated = ref('')
const reservationCount = ref(0)  // 예약 건수

// 다크모드 
const isDarkMode = ref(false)

// 타이머 변수
let clockTimer = null
let weatherTimer = null
let reservationTimer = null

// 시스템 설정 메뉴 개폐 상태
const isSystemMenuOpen = ref(false)

// 페이지
const router = useRouter()
const route = useRoute()

// ==========================================
// 2. 관리자 정보 및 메뉴 라우팅 로직
// ==========================================
// 세션에서 관리자 정보 불러오기
const loadAdminInfo = () => {
    const storedName = sessionStorage.getItem('adminName')
    const storedDept = sessionStorage.getItem('dept')
    if (storedName) adminName.value = storedName
    if (storedDept) adminDept.value = storedDept
}

// 시스템 설정 아코디언 토글
const toggleSystemMenu = () => {
    isSystemMenuOpen.value = !isSystemMenuOpen.value
}

// 페이지 이동 함수 (실제 연동 시 주석 해제!)
const goToPage = (path) => {
    // 다른 탭 클릭 시 시스템 메뉴를 닫기
    if (!path.includes('/system')) {
        isSystemMenuOpen.value = false
    }
    router.push(path)
    console.log(`${path} (으)로 이동합니다!`)
}

// 현재 접속 중인 메뉴 확인 (액티브 클래스용)
const isActiveMenu = (path) => {
    return route.path.includes(path)
}

// ==========================================
// 3. 시간 포맷팅 및 날씨/예약 API 연동
// ==========================================
// 시간 포맷팅 (초 단위 포함)
const formatTime = (d) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`

const formatFullDate = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
    return `${year}년 ${month}월 ${date}일 (${day}) ${formatTime(d)}`
}

// 날씨 API 호출
const fetchWeather = async () => {
    try {
        const res = await axios.get('http://localhost:8080/dashBoard/currentWeather')
        weather.value = res.data
        lastUpdated.value = formatTime(new Date()).substring(0, 5) // HH:mm 까지만
    } catch (e) {
        console.error('[DashBoard] 날씨 로드 실패', e)
    }
}

// 예약 건수 API 호출
const fetchReservationCount = async () => {
    try {
        const res = await axios.get('http://localhost:8080/admin/reservation/today-count')
        reservationCount.value = res.data.count || 0
    } catch (e) {
        console.error('[DashBoard] 예약 건수 로드 실패', e)
        reservationCount.value = 0
    }
}

// ==========================================
// 4. 날씨 데이터 가공 (Computed)
// ==========================================
// 날씨 아이콘 매핑 (SVG로 교체 가능)
const weatherIcon = computed(() => {
    if (!weather.value) return ''
    const c = weather.value.skyCondition
    const icons = { '비': '🌧️', '비/눈': '🌨️', '눈': '❄️', '구름많음': '⛅', '흐림': '☁️' }
    return icons[c] || '☀️'
})

// 미세/초미세먼지 로직
const pm10Label = computed(() => {
    if (!weather.value) return ''
    const v = weather.value.pm10
    if (v <= 30) return '좋음'; if (v <= 80) return '보통'; if (v <= 150) return '나쁨'
    return '매우나쁨'
})
const pm10Class = computed(() => {
    const v = weather.value?.pm10
    if (v <= 30) return 'good'; if (v <= 80) return 'normal'; return 'bad'
})

const pm25Label = computed(() => {
    if (!weather.value) return ''
    const v = weather.value.pm25
    if (v <= 15) return '좋음'; if (v <= 35) return '보통'; return '나쁨'
})
const pm25Class = computed(() => {
    const v = weather.value?.pm25
    if (v <= 15) return 'good'; if (v <= 35) return 'normal'; return 'bad'
})

// ==========================================
// 5. 라이프사이클 (Mount / Unmount)
// ==========================================
onMounted(() => {
    // 1. 관리자 정보 로드
    loadAdminInfo()

    // 2. 현재 주소가 시스템 설정 하위면 메뉴 열어두기
    if (route.path.includes('/system')) {
        isSystemMenuOpen.value = true
    }

    // 3. 실시간 시계 시작
    const tick = () => {
        const now = new Date()
        currentTime.value = formatTime(now)
        currentFullTime.value = formatFullDate(now)
    }
    tick()
    clockTimer = setInterval(tick, 1000)

    // 4. API 초기 호출 및 주기적 갱신 (10분 간격)
    fetchWeather()
    fetchReservationCount()
    weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000)
    reservationTimer = setInterval(fetchReservationCount, 10 * 60 * 1000)
})

onUnmounted(() => {
    // 컴포넌트 종료 시 타이머 청소
    clearInterval(clockTimer)
    clearInterval(weatherTimer)
    clearInterval(reservationTimer)
})
</script>


<style scoped>
/* ── [1] 전체 레이아웃 (Base) ── */
.dashboard-wrapper {
    display: flex;
    height: 100vh;
    background: #09090b;
    color: #fff;
    font-family: 'Pretendard', sans-serif;
    overflow: hidden;
}

.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
    padding: 0;
    display: flex;
    flex-direction: column;
}

/* 스크롤바 전체 너비 */
.content-container::-webkit-scrollbar {
    width: 10px;
}

/* 스크롤바 배경 */
.content-container::-webkit-scrollbar-track {
    background: transparent;
}

/* 스크롤바 막대기 */
.content-container::-webkit-scrollbar-thumb {
    background: #444D56;
    border-radius: 4px;
}

/* 마우스 올렸을 때 살짝 밝아지는 디테일 추가 */
.content-container::-webkit-scrollbar-thumb:hover {
    background: #5a6570;
}

/* ── [2] 사이드바 영역 (Sidebar) ── */
.side-main-tab-area {
    width: 230px;
    background: #000;
    border-right: 1px solid #27272a;
    display: flex;
    flex-direction: column;
}

/* 사이드바 로고 영역 */
.logo-area {
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    ;
    box-sizing: border-box;
}

.main-logo {
    max-height: 54px;
    width: auto;
}

.main-tab-menu {
    flex: 1;
    padding: 10px 0;
}

.tab-item {
    padding: 15px 25px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #f5f5f5a7;
    cursor: pointer;
    transition: 0.2s;
    letter-spacing: 0.5px;
    font-size: 18px;
}

/* 활성화(Active)된 메뉴 스타일  */
.tab-item.active,
.tab-item-group.active-group .tab-item.parent {
    color: #82c2e3 !important;
    background: rgba(130, 195, 227, 0.249) !important;
    margin: 2px 10px;
    border-radius: 12px;
    font-size: 19px;
    font-weight: bold;
    text-shadow: 0 0 20px #f5f5f58c;
}

.nav-icon {
    width: 25px;
    height: 20px;
}

/* ── [System Menu] 아코디언 스타일 ── */
.tab-item-group {
    transition: all 0.3s ease;
    margin: 2px 10px;
    border-radius: 12px;
}

.tab-item.parent {
    padding: 12px 15px;
    width: 100%;
    box-sizing: border-box;
}

/*  메뉴가 열렸을 때 배경색 변화 */
.tab-item-group.is-open:not(.active-group) {
    background: rgba(255, 255, 255, 0.11);
}

.tab-item-group.is-open:not(.active-group) .tab-item.parent {
    color: #f5f5f5a7;
    /* 기본 회색조 유지 */
    font-weight: normal;
    text-shadow: none;
}

/* 화살표 아이콘 위치 및 회전 */
.arrow-icon {
    width: 14px;
    height: 14px;
    margin-left: auto;
    transition: transform 0.3s ease;
}

.arrow-icon.rotate {
    transform: rotate(180deg);
    /* 열리면 위로 향하게 */
}

/* 하위 메뉴 리스트 정렬 */
.sub-menu-list {
    list-style: none;
    padding: 0 0 10px 20px;
    /* 아이콘 위치 맞춰 들여쓰기 */
}

.sub-item {
    font-size: 14px;
    color: #a1a1aa;
    padding: 8px 0;
    cursor: pointer;
    transition: 0.2s;
}

/* 하위 메뉴가 클릭되어 활성화되었을 때의 색상!! */
.sub-item.active {
    color: #82c2e3;
    font-weight: 600;
}

/* 하위 메뉴 텍스트 호버 시 가이드 블루 컬러 강조 */
.sub-item:hover {
    color: #82c2e3;
    text-decoration: underline;
}

/* ── [3] 사이드바 하단 위젯 (Weather) ── */
.bottom-widget {
    padding: 10px 15px;
    margin-top: auto;
}

/* 날씨 카드 고도화 */
.weather-card {
    background: rgba(255, 255, 255, 0.129);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
}

.weather-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.weather-icon-svg {
    font-size: 34px;
}

.weather-info {
    display: flex;
    flex-direction: column;
}

.weather-condition {
    font-weight: regular;
    font-size: 14px;
    text-align: right;
    margin-bottom: 4px;
}

.weather-temp {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
}

/* 마지막 갱신 정보 */
.weather-refresh-info {
    font-size: 14px;
    color: #f5f5f5c3;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    /* 구분선 더 연하게 */
}

.weather-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px 10px;
    font-size: 14px;
}

.weather-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;
}

.weather-item.wide {
    grid-column: span 2;
}

.label {
    color: #f5f5f5a6;
}

.value {
    margin-left: 10px;
}

.value.good {
    color: #00ff5e;
    font-weight: regular;
}

.value.normal {
    color: #fbb900;
    font-weight: regular;
}

.value.bad {
    color: #ff0000;
    font-weight: regular;
}

/* 예약 현황 박스 */
.reservation-box {
    background: rgba(255, 255, 255, 0.129);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: 0.3s;
}

.reservation-box:hover {
    background: rgba(130, 194, 227, 0.2);
    transform: translateY(-2px);
}

.res-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.res-title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
}

.res-count-area {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.res-count {
    font-size: 28px;
    font-weight: 800;
    color: #82c2e3;
}

.res-unit {
    font-size: 13px;
    color: #f5f5f5d7;
}

/* 실시간 라이브 점 애니메이션 */
.live-dot {
    width: 6px;
    height: 6px;
    background: #00ff5e;
    border-radius: 50%;
    box-shadow: 0 0 8px #00ff5e;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        opacity: 0.7;
    }

    50% {
        transform: scale(1.2);
        opacity: 1;
    }

    100% {
        transform: scale(0.95);
        opacity: 0.7;
    }
}

/* ── [4] 상단 헤더 영역 (Header) ── */
.main-header {
    height: 70px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #000;
    border-bottom: 1px solid #27272a;
    box-sizing: border-box;
}

.header-time {
    font-size: 18px;
    font-weight: 500;
    color: #f5f5f5d7;
    letter-spacing: 0.5px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 15px;
}


/* ── [5] 헤더 내 기능 (Search, Icon, Profile) ── */
.search-bar {
    display: flex;
    background: #444d568d;
    padding: 8px 15px;
    border-radius: 20px;
    align-items: center;
    border: 1px solid #f5f5f53e;
    width: 220px;
}

.search-bar input {
    background: none;
    border: none;
    outline: none;
    font-size: 14px;
}

.search-bar input::placeholder {
    color: #f5f5f5d7;
}

.search-icon {
    color: #f5f5f5d7;
    cursor: pointer;
}

.util-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
}

.icon-btn {
    background: none;
    border: none;
    color: #f5f5f5d7;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: 0.2s;
}

.icon-btn:hover {
    color: #fff;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #444d568d;
    padding: 6px 14px;
    border-radius: 30px;
    border: 1px solid #f5f5f53e;
}

.avatar-circle {
    width: 24px;
    height: 24px;
    background: #444d56;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-name {
    color: #f5f5f5d7;
    font-size: 14px;
    font-weight: 500;
}


/* ── [6] 다크모드 스위치 (Toggle) ── */
.mode-toggle {
    display: flex;
    align-items: center;
}

.toggle-track {
    width: 48px;
    height: 24px;
    background: #444d568d;
    border-radius: 20px;
    border: 1px solid #f5f5f53e;
    position: relative;
    cursor: pointer;
    transition: 0.3s;
}

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s ease-in-out;
}

/* 아이콘 색상 강제 지정 (흰 배경엔 검은 아이콘) */
.toggle-thumb svg {
    color: #82c2e3;
    width: 12px;
    height: 12px;
}

/* 활성화 시 이동 로직 (스크립트 연결 전용 클래스) */
.toggle-thumb.active {
    transform: translateX(24px);
    background: #82c2e3;
    /* 다크모드 시 파란색 포인트 */
}
</style>