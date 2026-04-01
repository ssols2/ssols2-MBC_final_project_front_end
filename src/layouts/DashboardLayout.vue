<template>
    <div class="dashboard-wrapper">

        <aside class="side-main-tab-area">
            <div class="logo-area">
                <img src="@/assets/txtlogo3.png" alt="서울에스병원 라이트로고" class="main-logo" v-if="false" />
            </div>

            <ul class="main-tab-menu">
                <li class="tab-item">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    대시보드
                </li>
                <li class="tab-item">
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
                <li class="tab-item active">
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
                <li class="tab-item">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                        <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    요금 정산 관리
                </li>
                <li class="tab-item">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    영상 보안 관리
                </li>
                <li class="tab-item">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    EV 인프라 관리
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
                    <div class="weather-clock-box">{{ currentTime }}</div>
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

                <div class="reservation-btn">

                    금일 예약 건수 00건
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
                        <svg width="16" height="16" class="search-icon" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>

                    <div class="util-icons">
                        <svg width="20" height="20" class="u-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                                d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg width="20" height="20" class="u-icon" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path
                                d="M19.4 15A1.65 1.65 0 0 0 21 13.35V10.65A1.65 1.65 0 0 0 19.4 9H18.61A6.27 6.27 0 0 0 17.65 6.84L18.21 6.28A1.65 1.65 0 0 0 18.21 3.95L16.32 2.06A1.65 1.65 0 0 0 14.15 2.06L13.59 2.62A6.27 6.27 0 0 0 11.43 2.22V1.43A1.65 1.65 0 0 0 9.78 0H6.91A1.65 1.65 0 0 0 5.26 1.43V2.22A6.27 6.27 0 0 0 3.1 3.18L2.54 2.62A1.65 1.65 0 0 0 0.37 2.62L-1.52 4.51A1.65 1.65 0 0 0 -1.52 6.84L-0.96 7.4A6.27 6.27 0 0 0 -1.36 9.56H-2.15A1.65 1.65 0 0 0 -3.8 11.21V13.89A1.65 1.65 0 0 0 -2.15 15.54H-1.36A6.27 6.27 0 0 0 -0.4 17.7L-0.96 18.26A1.65 1.65 0 0 0 -0.96 20.59L0.93 22.48A1.65 1.65 0 0 0 3.1 22.48L3.66 21.92A6.27 6.27 0 0 0 5.82 22.32V23.11A1.65 1.65 0 0 0 7.47 24.76H10.34A1.65 1.65 0 0 0 11.99 23.11V22.32A6.27 6.27 0 0 0 14.15 21.43L14.71 21.99A1.65 1.65 0 0 0 16.88 21.99L18.77 20.1A1.65 1.65 0 0 0 18.77 17.77L18.21 17.21A6.27 6.27 0 0 0 18.61 15.05H19.4Z"
                                transform="translate(3 0)" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </div>

                    <div class="user-profile">
                        <div class="avatar-circle">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                                    stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <circle cx="12" cy="7" r="4" stroke="#fff" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <span>관리자(김원석)</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                </div>
            </header>

            <main class="content-container">
                <router-view />
            </main>
        </div>
    </div>
</template>>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

// 상태 관리
const weather = ref(null)
const currentTime = ref('')      // 날씨 카드용 (HH:mm:ss)
const currentFullTime = ref('')  // 헤더용 (YYYY-MM-DD HH:mm:ss)
const lastUpdated = ref('')
let clockTimer = null
let weatherTimer = null

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

onMounted(() => {
    // 시계 시작
    const tick = () => {
        const now = new Date()
        currentTime.value = formatTime(now)
        currentFullTime.value = formatFullDate(now)
    }
    tick()
    clockTimer = setInterval(tick, 1000)

    // 날씨 호출 (10분 간격)
    fetchWeather()
    weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000)
})

onUnmounted(() => {
    clearInterval(clockTimer)
    clearInterval(weatherTimer)
})
</script>

<style scoped>
.dashboard-wrapper {
    display: flex;
    height: 100vh;
    background: #09090b;
    color: #fff;
    overflow: hidden;
}

/* 사이드바 */
.side-main-tab-area {
    width: 280px;
    background: #111114;
    border-right: 1px solid #27272a;
    display: flex;
    flex-direction: column;
}

.logo-area {
    padding: 30px;
    border-bottom: 1px solid #27272a;
    text-align: center;
}

.main-logo {
    max-width: 180px;
    filter: brightness(0) invert(1);
}

/* PNG 로고 백색 반전 필요시 */

.nav-menu {
    flex: 1;
    padding: 20px 0;
    list-style: none;
}

.tab-item {
    padding: 15px 25px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #a1a1aa;
    cursor: pointer;
    transition: 0.3s;
}

.tab-item.active {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    border-left: 4px solid #3b82f6;
}

.nav-icon {
    width: 20px;
    height: 20px;
}

/* 날씨 카드 (시안 기반 백색 다이어트) */
.bottom-widget {
    padding: 20px;
    border-top: 1px solid #27272a;
}

.weather-card {
    background: #fff;
    color: #18181b;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
}

.weather-main {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.weather-icon-svg {
    font-size: 28px;
}

.weather-info {
    display: flex;
    flex-direction: column;
}

.weather-condition {
    font-weight: 700;
    font-size: 14px;
}

.weather-temp {
    font-size: 22px;
    font-weight: 800;
}

.weather-clock-box {
    font-size: 12px;
    color: #71717a;
    margin-bottom: 8px;
}

.weather-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    font-size: 11px;
    border-top: 1px solid #f4f4f5;
    padding-top: 8px;
}

.weather-item.wide {
    grid-column: span 2;
    display: flex;
    justify-content: space-between;
}

.label {
    color: #71717a;
}

.value.good {
    color: #16a34a;
    font-weight: 600;
}

.value.normal {
    color: #ca8a04;
    font-weight: 600;
}

.value.bad {
    color: #dc2626;
    font-weight: 600;
}

.booking-box {
    background: #fff;
    color: #18181b;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    font-weight: 700;
    font-size: 14px;
}

.booking-box .count {
    color: #3b82f6;
}

/* 헤더 및 컨텐츠 */
.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.main-header {
    height: 70px;
    padding: 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #141526; /* 시안 헤더 배경색 */
    border-bottom: 1px solid #27272a;
}

.header-left {
    display: flex;
    align-items: center;
}

.header-time {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 20px; /* 검색창, 아이콘, 프로필 사이 간격 */
}

/* 검색창 디자인 */
.search-bar {
    display: flex;
    background: #24253a;
    padding: 8px 15px;
    border-radius: 20px;
    align-items: center;
    border: 1px solid #3a3b4d;
    width: 220px;
}

.search-bar input {
    background: none;
    border: none;
    color: #fff;
    outline: none;
    flex: 1;
    font-size: 13px;
}

.search-bar input::placeholder {
    color: #6a6b7d;
}

.search-icon {
    color: #a1a1aa;
    cursor: pointer;
}

/* 우측 유틸 아이콘 */
.util-icons {
    display: flex;
    align-items: center;
    gap: 15px;
    color: #a1a1aa;
    cursor: pointer;
}

/* 유저 프로필 칩 */
.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #333;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    color: #fff;
    cursor: pointer;
    border: 1px solid #444;
}

.avatar-circle {
    width: 26px;
    height: 26px;
    background-color: #555;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>