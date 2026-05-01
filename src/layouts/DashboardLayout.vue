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
                <!-- <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/monitoring') }"
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
                </li> -->
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
                <!-- <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/cctv') }"
                    @click="goToPage('/dashboard/cctv')">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    영상 보안 관리
                </li> -->
                <li class="tab-item" :class="{ active: isActiveMenu('/dashboard/ev-infra') }"
                    @click="goToPage('/dashboard/ev-infra')">
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
                        <li class="sub-item" :class="{ active: isActiveMenu('/dashboard/system/history') }"
                            @click="goToPage('/dashboard/system/history')">
                            • 통합 알림 및 장애 이력
                        </li>
                        <li class="sub-item" :class="{ active: isActiveMenu('/dashboard/system/policy') }"
                            @click="goToPage('/dashboard/system/policy')"> • 요금 및 운영 정책
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
                    <span class="header-time">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            style="margin-right: 6px; vertical-align: -3px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {{ currentFullTime }}</span>
                </div>

                <div class="header-right">
                    <div class="search-bar">
                        <input type="text" placeholder="Search..." v-model="searchKeyword"
                            @keydown.enter.prevent="handleSearch" />
                        <svg width="18" height="18" class="search-icon" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" @click="handleSearch" style="cursor: pointer;">
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

                        <div class="dropdown-wrapper" ref="notifyWrapper">
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
                                <!-- 필터 탭 영역 추가 -->
                                <div class="notify-filters">
                                    <span :class="{ active: currentFilter === 'all' }" @click="currentFilter = 'all'">
                                        전체({{ notifyCounts.all }})
                                    </span>
                                    <span :class="{ active: currentFilter === 'ev' }" @click="currentFilter = 'ev'">
                                        EV({{ notifyCounts.ev }})
                                    </span>
                                    <span :class="{ active: currentFilter === 'ocr' }" @click="currentFilter = 'ocr'">
                                        OCR({{ notifyCounts.ocr }})
                                    </span>
                                </div>
                                <ul class="notify-list">
                                    <li v-for="item in filteredNotifyList" :key="item.id" class="notify-item"
                                        :class="item.alertClass">
                                        <div class="notify-icon" v-html="item.icon"></div>
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
                    </div>

                    <div class="dropdown-wrapper" ref="profileWrapper">
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
                                <div class="profile-avatar-large">
                                    <svg viewBox="0 0 24 24" fill="#cbd5e1"
                                        style="width: 100%; height: 100%; padding: 6px; box-sizing: border-box;">
                                        <path
                                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                                <div class="profile-info-text">
                                    <span class="p-name">{{ adminName }}(관리자)</span>
                                    <span class="p-id">사번: {{ adminId }}</span>
                                    <span class="p-dept">소속: {{ adminDept }}</span>
                                </div>
                            </div>
                            <ul class="profile-menu-list">
                                <li @click="goToMyPage">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        style="margin-right: 8px; vertical-align: -2px;">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    마이페이지
                                </li>
                                <li @click="goToPage('/dashboard/system/management')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        style="margin-right: 8px; vertical-align: -2px;">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path
                                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
                                        </path>
                                    </svg>
                                    환경설정
                                </li>
                            </ul>
                            <button class="logout-btn" @click="handleLogout">로그아웃
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

            <!-- [추가] 시설관리팀 전용 플로팅 버튼 -->
            <div v-if="isFacilityTeam" class="floating-btn-container">
                <button class="fab-btn" @click="openFacilityPopup">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path
                            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <!-- 대기 중인 요청이 있을 때만 숫자 뱃지 표시 -->
                    <span v-if="pendingCount > 0" class="fab-badge">{{ pendingCount }}</span>
                </button>
            </div>

            <!-- [추가] 시설관리팀 목록 모달 -->
            <FacilityInspectionPopup :visible="facilityPopupVisible" :pending-list="pendingInspectionList"
                @close="facilityPopupVisible = false" @confirm="handleFacilityPopupConfirm" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import FacilityInspectionPopup from '@/components/ev_infra/predictive/FacilityInspectionPopup.vue'

// ==========================================
// 1. 상태 관리 변수 모음
// ==========================================
// 페이지 라우터
const router = useRouter()
const route = useRoute()

// 관리자 정보
const adminName = ref('주임')
const adminDept = ref('주차관리팀')
const adminId = ref('P20081578')

// 날씨 및 시간 정보
const weather = ref(null)
const currentTime = ref('')      // 날씨 카드용 (HH:mm:ss)
const currentFullTime = ref('')  // 헤더용 (YYYY-MM-DD HH:mm:ss)
const lastUpdated = ref('')
const reservationCount = ref(0)  // 예약 건수

// UI 개폐 상태 (테마, 메뉴, 드롭다운)
const isDarkMode = ref(localStorage.getItem('theme') !== 'light')
const isSystemMenuOpen = ref(false)
const isProfileOpen = ref(false) // 프로필 팝업
const isNotifyOpen = ref(false)  // 알림 팝업

// 추가: 주소창(route.path)이 바뀔 때마다 실행되는 감시자 로직
watch(() => route.path, () => {
    isNotifyOpen.value = false
    isProfileOpen.value = false
})

// 타이머 변수
let clockTimer = null
let weatherTimer = null
let reservationTimer = null

// 검색
const searchKeyword = ref('')

const notifyWrapper = ref(null)
const profileWrapper = ref(null)

const handleClickOutside = (event) => {
    // 알림창이 열려있고, 클릭한 타겟이 notifyWrapper 영역 바깥일 때 닫기
    if (isNotifyOpen.value && notifyWrapper.value && !notifyWrapper.value.contains(event.target)) {
        isNotifyOpen.value = false
    }
    // 프로필창이 열려있고, 클릭한 타겟이 profileWrapper 영역 바깥일 때 닫기
    if (isProfileOpen.value && profileWrapper.value && !profileWrapper.value.contains(event.target)) {
        isProfileOpen.value = false
    }
}

// ==========================================
// 2. 관리자 정보 및 메뉴 라우팅 로직
// ==========================================
// 세션에서 관리자 정보 불러오기
const loadAdminInfo = () => {
    const storedName = sessionStorage.getItem('adminName')
    const storedDept = sessionStorage.getItem('dept')
    const storedId = sessionStorage.getItem('adminId')

    if (storedName) adminName.value = storedName
    if (storedDept) adminDept.value = storedDept
    if (storedId) adminId.value = storedId
}

// 시스템 설정 아코디언 토글
const toggleSystemMenu = () => {
    isSystemMenuOpen.value = !isSystemMenuOpen.value
}

// 페이지 이동 함수
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
// 3. 헤더 유틸리티 (프로필, 새로고침, 테마, 알림)
// ==========================================
// 프로필 드롭다운 토글
const toggleProfile = () => {
    isProfileOpen.value = !isProfileOpen.value
    if (isProfileOpen.value) isNotifyOpen.value = false // 알림 열려있으면 닫기
}

// 알림 드롭다운 토글
const toggleNotify = () => {
    isNotifyOpen.value = !isNotifyOpen.value
    if (isNotifyOpen.value) isProfileOpen.value = false // 프로필 열려있으면 닫기
}

// 새로고침
const handleRefresh = () => {
    window.location.reload()
}

// 테마 변경
const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    if (!isDarkMode.value) { // 라이트 모드일 때
        document.documentElement.setAttribute('data-theme', 'light')
        localStorage.setItem('theme', 'light')
    } else { // 다크 모드일 때
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('theme', 'dark')
    }
}

// 메뉴 검색 로직 (대시보드 내부 이동)
const handleSearch = () => {
    const kw = searchKeyword.value.trim()
    if (!kw) {
        alert('검색할 메뉴명이나 키워드를 입력해 주세요!')
        return
    }

    // 키워드에 따라 대시보드 내부 라우터로 즉시 이동
    if (kw.includes('모니터링') || kw.includes('주차')) {
        router.push('/dashboard/monitoring')
    } else if (kw.includes('차량') || kw.includes('출입') || kw.includes('관제')) {
        router.push('/dashboard/vehicle-control')
    } else if (kw.includes('요금') || kw.includes('정산') || kw.includes('결제')) {
        router.push('/dashboard/payment')
    } else if (kw.includes('ev') || kw.includes('충전') || kw.includes('전기차')) {
        router.push('/dashboard/ev-infra')
    } else if (kw.includes('시스템') || kw.includes('설정') || kw.includes('환경')) {
        isSystemMenuOpen.value = true // 이동 전 시스템 메뉴 아코디언 열기
        router.push('/dashboard/system/management')
    } else {
        alert('일치하는 메뉴가 없습니다. 키워드를 다시 확인해 주세요!')
    }

    searchKeyword.value = '' // 검색 완료 후 입력창 비우기
}

// ==========================================
// 4. 로그인 & 마이페이지 연동 로직
// ==========================================
// 마이페이지 이동 (index.js 라우터 구조 활용)
const goToMyPage = () => {
    // member 라우터 쪽에 정의된 /mypage 라고 가정하고 새 창으로 열기!
    const routeData = router.resolve({ path: '/mypage' })
    window.open(routeData.href, '_blank')
}

// 로그아웃 로직
const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
        sessionStorage.clear() // 세션 초기화
        router.push('/') // index.js에 정의된 MainHome('/')으로 튕겨내기!
    }
}

// ==========================
// 5. 알림 데이터 동적 연동
// ==========================
const notifyList = ref([])
const currentFilter = ref('all') // 현재 선택된 탭 (all, ev, ocr)

// 브라우저 저장소(localStorage)에서 읽은 OCR 알림 목록을 불러오기
const savedOcrAlerts = JSON.parse(localStorage.getItem('readOcrAlerts') || '[]')
const readOcrAlerts = ref(new Set(savedOcrAlerts))

// 필터링된 알림 리스트 (화면에 보여줄 리스트)
const filteredNotifyList = computed(() => {
    if (currentFilter.value === 'all') return notifyList.value
    return notifyList.value.filter(item => item.type === currentFilter.value)
})

// 알림 데이터 리스트
const notifyCounts = computed(() => {
    return {
        all: notifyList.value.length,
        ev: notifyList.value.filter(n => n.type === 'ev').length,
        ocr: notifyList.value.filter(n => n.type === 'ocr').length
    }
})

const unreadCount = computed(() => notifyList.value.length)

// 실시간 알림 가져오기
const fetchEvNotifications = async () => {
    try {
        // EV 충전기 데이터 가져오기
        const evRes = await axios.get('http://localhost:8080/api/ev/chargers')
        let evMapped = []

        if (Array.isArray(evRes.data)) {
            const evIssues = evRes.data.filter(c => ['CHECK', 'RISK', 'FAULT', 'POWER_OFF'].includes(c.chargerStatus))
            evMapped = evIssues.map(c => {
                const isFault = c.chargerStatus === 'FAULT'
                const floor = c.evChargerId.split('-')[0].replace('F', '')
                return {
                    id: c.evChargerId,
                    type: 'ev',
                    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbb900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
                    title: `[EV] B${floor}층 | ${c.evChargerId}`,
                    subText: isFault ? '즉시 장비 점검이 필요' : '데이터 이상 감지',
                    alertClass: 'warn-alert',
                    btnClass: 'yellow',
                    btnText: '이동',
                    chargerId: c.evChargerId
                }
            })
            notifyCounts.value.ev = evIssues.length
        }

        // 주차 로그 데이터 가져오기 및 85% 미만 필터링
        const ocrRes = await axios.get('http://localhost:8080/parking-log/logs')
        let ocrMapped = []

        if (Array.isArray(ocrRes.data)) {
            const now = new Date().getTime()
            const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24시간을 밀리초로 계산

            // 1. 정확도 85 미만 2. 로컬 스토리지에 없는 것 3. 24시간 안 지난 것만 필터링
            const ocrIssues = ocrRes.data.filter(log => {
                // 정확도 조건
                if (log.ocrAccuracy <= 0 || log.ocrAccuracy >= 85) return false
                // 이미 클릭해서 이동한 기록이 있는지 조건
                if (readOcrAlerts.value.has(`ocr-${log.parkingLogId}`)) return false
                
                // 시간 조건 (하루 지나면 자동 삭제)
                const logTime = log.entryTime ? new Date(log.entryTime).getTime() : now
                if (now - logTime > ONE_DAY_MS) return false

                return true
            })

            ocrMapped = ocrIssues.map(log => ({
                id: `ocr-${log.parkingLogId}`,
                type: 'ocr',
                icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbb900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
                title: `[OCR] 저정확도 차량: ${log.vehicleNum}`,
                subText: `정확도: ${Math.round(log.ocrAccuracy)}% | 확인 요망`,
                alertClass: 'warn-alert',
                btnClass: 'yellow',
                btnText: '이동',
                vehicleNum: log.vehicleNum
            }))
            notifyCounts.value.ocr = ocrIssues.length
        }

        notifyList.value = [...evMapped, ...ocrMapped]
        unreadCount.value = notifyList.value.length

    } catch (error) {
        console.error('통합 알림 로드 실패:', error)
    }
}

// 버튼 클릭 시 해당 기기의 예지보전 탭으로 이동
const handleAlertAction = (item) => {
    if (item.type === 'ev') {
        isNotifyOpen.value = false // 팝업 닫기
        router.push({
            path: '/dashboard/ev-infra',
            query: { tab: 'predictive', chargerId: item.chargerId }
        })
    } else if (item.type === 'ocr') {
        // [추가] OCR 알림 읽음 처리 후 로컬 스토리지에 영구 저장
        readOcrAlerts.value.add(item.id)
        localStorage.setItem('readOcrAlerts', JSON.stringify([...readOcrAlerts.value]))
        
        fetchEvNotifications() // 알림 목록 바로 새로고침
        
        // [추가] 출입 차량 관제 페이지로 쿼리 담아서 이동
        router.push({
            path: '/dashboard/vehicle-control',
            query: { search: item.vehicleNum }
        })
    }
}

// =====================================
// 6. 시간 포맷팅 및 날씨/예약 API 연동
// =====================================
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
// DashboardLayout.vue 내 해당 함수 수정 🪄
const fetchReservationCount = async () => {
    try {
        const res = await axios.get('http://localhost:8080/admin/reservation/today-count', {
            withCredentials: true
        })

        console.log('[디버깅] 예약 수 응답 데이터:', res.data)

        // 만약 res.data 자체가 숫자라면 그대로 넣고, 객체라면 res.data.count를 사용
        if (typeof res.data === 'object' && res.data !== null) {
            reservationCount.value = res.data.count || 0
        } else {
            reservationCount.value = res.data || 0
        }

    } catch (e) {
        console.error('[DashBoard] 예약 건수 로드 실패:', e)
        reservationCount.value = 0
    }
}

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


// ===========================
// 시설관리팀 전용 알림 로직
// ===========================
const isFacilityTeam = computed(() => {
  try {
    const loginData = JSON.parse(sessionStorage.getItem('loginId')) || {}
    return loginData.adminDeptName === '시설관리팀'
  } catch(e) { return false }
})

const facilityPopupVisible = ref(false)
const pendingInspectionList = ref([])
const pendingCount = computed(() => pendingInspectionList.value.length)

const fetchPendingInspections = async () => {
  if (!isFacilityTeam.value) return
  try {
    const res = await axios.get('http://localhost:8003/inspection/pending')
    pendingInspectionList.value = res.data || []

    fetchEvNotifications()
  } catch(e) { console.error('점검 목록 로드 실패', e) }
}

// 자식 페이지(EvInfraManage 등)에서 이 새로고침 함수를 쓸 수 있도록 제공
provide('refreshPendingCount', fetchPendingInspections)

// 플로팅 버튼 클릭 시
const openFacilityPopup = async () => {
  await fetchPendingInspections()
  facilityPopupVisible.value = true
}

// 모달에서 특정 기기의 '점검하기' 버튼 클릭 시
const handleFacilityPopupConfirm = (item) => {
  facilityPopupVisible.value = false
  router.push({
    path: '/dashboard/ev-infra',
    query: { tab: 'predictive', chargerId: item.ev_charger_id }
  })
}

// ==========================================
// 7. 라이프사이클 (Mount / Unmount)
// ==========================================
onMounted(() => {
    // 초기 테마 렌더링 (저장된 테마가 light일 때만 적용, 그 외엔 기본 다크)
    if (!isDarkMode.value) {
        document.documentElement.setAttribute('data-theme', 'light')
    }

    document.addEventListener('click', handleClickOutside)

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

    fetchEvNotifications()

    if(isFacilityTeam.value) {
       fetchPendingInspections() // 처음 화면 켤 때 숫자 가져오기
    //    facilityTimer = setInterval(fetchPendingInspections, 15000) // 15초마다 뱃지 갱신
   }
})

onUnmounted(() => {
    // 컴포넌트 종료 시 타이머 청소
    clearInterval(clockTimer)
    clearInterval(weatherTimer)
    clearInterval(reservationTimer)
    // 컴포넌트가 파괴될 때 이벤트 리스너도 같이 삭제 (메모리 누수 방지)
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
/* ==========================================
   [1] 전역 레이아웃 및 테마 (Global)
   ========================================== */
.dashboard-wrapper {
    display: flex;
    height: 100vh;
    background: var(--bg-main);
    color: var(--text-primary);
    font-family: 'Pretendard', sans-serif;
    overflow: hidden;
    transition: background 0.3s, color 0.3s;
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
    padding: 17px;
}

/* 스크롤바 커스텀 */
.content-container::-webkit-scrollbar {
    width: 10px;
}

.content-container::-webkit-scrollbar-track {
    background: transparent;
}

.content-container::-webkit-scrollbar-thumb {
    background: #444D56;
    border-radius: 4px;
}

.content-container::-webkit-scrollbar-thumb:hover {
    background: #5a6570;
}


/* ==========================================
   [2] 좌측 사이드바 및 탭 메뉴 (Sidebar)
   ========================================== */
.side-main-tab-area {
    width: 240px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    transition: background 0.3s;
}

/* 로고 영역 */
.logo-area {
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.main-logo {
    max-height: 58px;
    width: auto;
}

/* 메인 탭 리스트 */
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
    font-size: 20px;
}

.tab-item.active,
.tab-item-group.active-group .tab-item.parent {
    color: #82c2e3 !important;
    background: rgba(130, 195, 227, 0.249) !important;
    margin: 2px 10px;
    border-radius: 12px;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 0 0 20px #f5f5f58c;
}

.nav-icon {
    width: 25px;
    height: 20px;
}

/* 아코디언 메뉴 (시스템 설정) */
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

.tab-item-group.is-open:not(.active-group) {
    background: rgba(255, 255, 255, 0.11);
}

.tab-item-group.is-open:not(.active-group) .tab-item.parent {
    color: #f5f5f5a7;
    font-weight: normal;
    text-shadow: none;
}

.arrow-icon {
    width: 14px;
    height: 14px;
    margin-left: auto;
    transition: transform 0.3s ease;
}

.arrow-icon.rotate {
    transform: rotate(180deg);
}

/* 서브 메뉴 리스트 */
.sub-menu-list {
    list-style: none;
    padding: 0 0 10px 20px;
}

.sub-item {
    font-size: 16px;
    color: #a1a1aa;
    padding: 8px 0;
    cursor: pointer;
    transition: 0.2s;
}

.sub-item.active {
    color: #82c2e3;
    font-weight: 600;
}

.sub-item:hover {
    color: #82c2e3;
    text-decoration: underline;
}


/* ==========================================
   [3] 사이드바 하단 위젯 (Weather & Reservation)
   ========================================== */
.bottom-widget {
    margin-top: auto;
    margin-bottom: 17px;
}

/* 날씨 카드 */
.weather-card {
    background: rgba(68, 77, 86, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 17px;
    margin-bottom: 17px;
    margin-left: 17px;
    margin-right: 17px;
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

.weather-refresh-info {
    font-size: 14px;
    color: #f5f5f5c3;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

/* 미세먼지 수치 색상 */
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
    background: rgba(68, 77, 86, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 17px;
    cursor: pointer;
    transition: 0.3s;
    margin-left: 17px;
    margin-right: 17px;
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

/* 라이브 깜빡임 효과 */
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


/* ==========================================
   [4] 상단 헤더 영역 (Header & Icons)
   ========================================== */
.main-header {
    height: 70px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.header-time {
    font-size: 20px;
    font-weight: 500;
    color: #f5f5f5aa;
    letter-spacing: -0.2px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* 검색 바 */
.search-bar {
    display: flex;
    background: #444d5647;
    padding: 8px 15px;
    border-radius: 20px;
    align-items: center;
    border: 1px solid var(--border-color);
    width: 220px;
}

.search-bar input {
    background: none;
    border: none;
    outline: none;
    font-size: 15px;
    color: var(--text-primary);
    width: 100%;
}

.search-icon {
    color: var(--text-secondary);
    cursor: pointer;
}

/* 헤더 아이콘 버튼 그룹 */
.util-actions {
    display: flex;
    align-items: center;
    gap: 5px;
}

.icon-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 8px;
    transition: 0.2s;
    position: relative;
}

.icon-btn:hover,
.icon-btn.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.15);
}

/* 알림 뱃지 */
.notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    background-color: #ff4d4f;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--bg-header);
}

/* 유저 프로필 영역 */
.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #444d5678;
    padding: 6px 14px;
    border-radius: 30px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: 0.2s;
}

.user-profile:hover,
.user-profile.active {
    background: var(--hover-bg);
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
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
}

/* 다크모드 스위치 */
.mode-toggle {
    display: flex;
    align-items: center;
}

.toggle-track {
    width: 48px;
    height: 24px;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    position: relative;
    cursor: pointer;
    transition: 0.3s;
}

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toggle-thumb svg {
    color: #82c2e3;
    width: 14px;
    height: 14px;
}

[data-theme="light"] .toggle-thumb {
    transform: translateX(24px);
    background: var(--text-primary);
}

[data-theme="light"] .toggle-thumb svg {
    color: #fff;
}


/* ==========================================
   [5] 드롭다운 팝업 (Glassmorphism Effects)
   ========================================== */
.dropdown-wrapper {
    position: relative;
}

/* 알림 & 프로필 공통 글래스 효과 */
.glass-panel {
    position: absolute;
    top: 40px;
    right: 0;
    background: #444d5571 !important;
    backdrop-filter: blur(15px) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.437);
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 10px;
    z-index: 9999 !important;
    color: var(--text-primary);
    overflow: hidden;
}

/* ── 프로필 드롭다운 내부 ── */
.profile-dropdown {
    width: 240px;
    padding: 20px;
}

.profile-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 15px;
}

.profile-avatar-large {
    width: 46px;
    height: 46px;
    background: #e2e8f0;
    border-radius: 50%;
}

.profile-info-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.p-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
}

.p-id,
.p-dept {
    font-size: 14px;
    color: var(--text-secondary);
}

.profile-menu-list {
    list-style: none;
    padding: 0;
    margin: 0 0 15px 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.profile-menu-list li {
    padding: 10px 12px;
    font-size: 16px;
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.profile-menu-list li:hover {
    background: rgba(255, 255, 255, 0.08);
}

.logout-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    color: var(--accent-blue);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;
}

.logout-btn:hover {
    background: rgba(130, 194, 227, 0.15);
}

/* ── 알림 드롭다운 내부 ── */
.notify-dropdown {
    width: 380px;
}

.dropdown-header {
    padding: 17px 20px 10px;
    font-size: 18px;
    font-weight: 700;
    border-bottom: 1px solid var(--glass-border);
}

.notify-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
}

.notify-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    gap: 12px;
    transition: background 0.2s;
}

.notify-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.notify-item.empty {
    justify-content: center;
    color: var(--text-secondary);
    padding: 30px;
    font-size: 14px;
}

/* 알림 아이콘 & 텍스트 */
.notify-icon {
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
}

.notify-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.notify-text strong {
    font-size: 16px;
    color: var(--text-primary);
}

.time-log {
    font-size: 15px;
    color: #ff4d4f;
}

.notify-filters {
    display: flex;
    gap: 15px;
    padding: 10px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.1);
}

.notify-filters span {
    font-size: 13px;
    color: #a1a1aa;
    cursor: pointer;
    transition: 0.2s;
    padding-bottom: 2px;
}

.notify-filters span.active {
    color: #82c2e3;
    font-weight: 700;
    border-bottom: 2px solid #82c2e3;
    /* 선택된 탭 강조[cite: 16] */
}

.notify-filters span:hover {
    color: #fff;
}

/* 경고 강조 색상 */

/* 알림 상태별 동적 CSS 클래스 바인딩 속성 */
.fault-alert .notify-icon {
    background: rgba(239, 68, 68, 0.15);
}

.warn-alert .notify-icon {
    background: rgba(245, 158, 11, 0.15);
}

/* 액션 버튼들 */
.action-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
    background: transparent;
    cursor: pointer;
    transition: 0.2s;
}

.action-btn.red {
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
}

.action-btn.red:hover {
    background: #ef4444;
    color: #fff;
}

.action-btn.yellow {
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
}

.action-btn.yellow:hover {
    background: #f59e0b;
    color: #fff;
}

.dropdown-footer {
    padding: 15px;
    text-align: center;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    background: rgba(0, 0, 0, 0.2);
    transition: color 0.2s;
}

.dropdown-footer:hover {
    color: var(--text-primary);
}

/* 시설관리팀 알림 플로팅 버튼 */
.floating-btn-container {
    position: fixed;
    bottom: 40px;
    right: 40px;
    z-index: 9999;
}
.fab-btn {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}
.fab-btn:hover {
    transform: scale(1.1) translateY(-5px);
}
.fab-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #facc15;
    color: #1a1d21;
    font-size: 15px;
    font-weight: 900;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
</style>