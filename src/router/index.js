import { createRouter, createWebHistory } from 'vue-router'

// 레이아웃 (틀) 불러오기
import MainLayout from '@/layouts/MainLayout.vue'   // 병원 사이트

// 병원 사이트 메인 뷰(View) 파일 불러오기
import MainHome from '@/views/MainHome.vue'             // 메인 홈페이지
import SearchResult from '@/components/SearchResult.vue' // 통합검색 결과창

// [병원소개] About 폴더
import Greeting from '@/views/about/Greeting.vue'
import Mission from '@/views/about/Mission.vue'
import History from '@/views/about/History.vue'

// [의료진/진료과] Medical 폴더
import CenterClinic from '@/views/medical/CenterClinic.vue'

// [건강정보] heath 폴더
import Disease from '@/views/health/Disease.vue'
import Checkup from '@/views/health/Checkup.vue'
import Story from '@/views/health/Story.vue'

// [오시는 길 / 주차안내]
import Location from '@/views/location/Location.vue'
import ParkingInfo from '@/views/location/ParkingInfo.vue'

// 기능별로 쪼개놓은 라우터 파일 합치기
import member from '@/router/member/member.js'
import vehicle from '@/router/vehicle/vehicle.js'
import reservation from '@/router/reservation/reservation.js'
import customer from '@/router/customer/customer.js'

// =================================================================================================================
// ===============================================최종 프로젝트 ====================================================
// 대시보드 레이아웃
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import KioskLayout from "@/layouts/KioskLayout.vue"

// 대시보드 각 화면 불러오기
// 0. 대시보드 관리자 인증 화면
import AdminLogin from '@/views/dashboard/AdminLogin.vue'
// 1. 대시보드 메인화면
import MainView from '@/views/dashboard/MainView.vue'
// 2. 주차장 현황 맵 화면
import ParkingMapView from '@/views/dashboard/ParkingMapView.vue'
// 3. 출입 차량 관제
import VehicleControlManage from '@/views/dashboard/VehicleControlManage.vue'
// 4. 요금 정산 관리
import PaymentManage from '@/views/dashboard/PaymentManage.vue'
// 5. 영상 보안 관제
import SecurityView from '@/views/dashboard/CctvView.vue'
// 6. 전기차 충전기 불러오기
import EvInfraManage from '../views/dashboard/EvInfraManage.vue'
// 7. 시스템 설정
import HistoryView from '@/views/dashboard/system/HistoryView.vue'
import PolicyView from '@/views/dashboard/system/PolicyView.vue'
import ManagementView from '@/views/dashboard/system/ManagementView.vue'


// 라우터 설정 시작
const router = createRouter({
    history: createWebHistory(),
    routes: [

        // [A] 메인 홈페이지 그룹 (MainLayout 사용)
        {
            path: '/',
            component: MainLayout,
            children: [
                // 메인화면
                {
                    path: '',
                    name: 'mainhome',
                    component: MainHome,
                },

                // 검색결과 화면
                {
                    path: '/search',
                    name: 'searchresult',
                    component: SearchResult
                },

                // 병원소개 메뉴 연결
                {
                    path: '/greeting',
                    name: 'greeting',
                    component: Greeting
                },
                {
                    path: '/mission',
                    name: 'mission',
                    component: Mission
                },
                {
                    path: '/history',
                    name: 'history',
                    component: History
                },

                // 의료진/진료과 메뉴 연결
                {
                    path: '/centerclinic',
                    name: 'centerclinic',
                    component: CenterClinic
                },

                // 건강정보 메뉴 연결
                {
                    path: '/disease',
                    name: 'disease',
                    component: Disease
                },
                {
                    path: '/checkup',
                    name: 'checkup',
                    component: Checkup
                },
                {
                    path: '/story',
                    name: 'story',
                    component: Story
                },
                {
                    path: '/story/:id',
                    name: 'story-detail',
                    component: Story
                },

                // 위치/주차 안내 연결
                {
                    path: '/location',
                    name: 'location',
                    component: Location
                },
                {
                    path: '/parkinginfo',
                    name: 'parkinginfo',
                    component: ParkingInfo
                },

                // 쪼개놓은 파일들 합치기 (Spread Operator)
                ...member,
                ...vehicle,
                ...reservation,
                ...customer
            ]
        },
        // 대시보드 로그인 화면
        {
            path: '/dashboard/admin-login',
            name: 'AdminLogin',
            component: AdminLogin
        },
        // 관리자 전용 대시보드 그룹 (새로운 DashboardLayout 사용)
        {
            path: '/dashboard',
            component: DashboardLayout,
            redirect: '/dashboard/admin-login',
            children: [
                // 대시보드 메인 화면
                {
                    path: 'main', // 주소: /dashboard/main
                    name: 'dashboard-main',
                    component: MainView,
                    meta: { requiresAuth: true, role: 'ADMIN' } // 보안 딱지
                },
                // 주차장 현황 맵 화면
                {
                    path: 'parking-map', // 주소: /dashboard/parking-map
                    name: 'parking-map',
                    component: ParkingMapView,
                    meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 출입 차량 관제 화면
                {
                    path: 'vehicle-control', // 주소: /dashboard/vehicle-control
                    name: 'vehicle-control',
                    component: VehicleControlManage,
                    meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 요금 정산 관리 화면
                {
                    path: 'payment', // 주소: /dashboard/payment
                    name: 'payment-manage',
                    component: PaymentManage,
                    meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 영상 보안 관제 화면
                {
                    path: 'cctv', // 주소: /dashboard/cctv
                    name: 'cctv',
                    component: SecurityView,
                    meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // ev 인프라 관리 화면
                {
                    path: 'ev-infra',
                    name: 'ev-infra',
                    component: EvInfraManage,
                    meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 시스템 설정 - 요금 및 운영 정책 설정
                {
                path: 'system/policy', // 주소: /dashboard/system/policy
                name: 'system-policy',
                component: PolicyView,
                meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 시스템 설정 - 통합 알림 및 장애 이력
                {
                path: 'system/history', // 주소: /dashboard/system/history
                name: 'system-history',
                component: HistoryView,
                meta: { requiresAuth: true, role: 'ADMIN' }
                },
                // 시스템 설정 - 시스템 및 계정 관리
                {
                path: 'system/management', // 주소: /dashboard/system/management
                name: 'system-management',
                component: ManagementView,
                meta: { requiresAuth: true, role: 'ADMIN' }
                },
            ]
        },
        // 주차장 키오스크 전용 그룹 (KioskLayout 사용)
        {
            path: '/kiosk',
            component: KioskLayout,
            redirect: '/kiosk/entry',
            children: [
                // 1. 입차 화면 (/kiosk/entry)
                {
                    path: 'entry',
                    name: 'kiosk-entry',
                    component: () => import('@/views/kiosk/Entry.vue')
                },
                // 2. 출차/정산 화면 (/kiosk/exit)
                {
                    path: 'exit',
                    name: 'kiosk-exit',
                    component: () => import('@/views/kiosk/Exit.vue')
                },
                // 3. 전기차 충전 화면 (/kiosk/evcharge)
                {
                    path: 'evcharge',
                    name: 'kiosk-ev-charge',
                    component: () => import('@/views/kiosk/EvCharge.vue')
                },
                // 4. 주차 현황 조회 화면 (/kiosk/status)
                // {
                //     path: 'status',
                //     name: 'kiosk-status',
                //     component: () => import('@/views/kiosk/Status.vue')
                // }
            ]
        }
    ]
})

// 네비게이션 가드 (로그인 안 하면 못 들어가게 막기)
router.beforeEach((to, from, next) => {
    // 에러 방어: 세션 데이터 안전하게 파싱
    const loginDataStr = sessionStorage.getItem('loginId');
    let loginData = null;

    if (loginDataStr) {
        try {
            loginData = JSON.parse(loginDataStr);
        } catch (e) {
            console.error("세션 파싱 에러", e);
            sessionStorage.removeItem('loginId');
        }
    }

    // ===================================
    // 대시보드(/dashboard) 관련 주소 방어
    if (to.path.startsWith('/dashboard')) {
        
        // [방어 1] 아예 로그인을 안 한 경우
        if (!loginData) {
            alert('병원 로그인이 먼저 필요합니다.');
            // 로그인 후 여기로 다시 오도록 꼬리표(query)
            return next({ path: '/login', query: { redirect: to.fullPath } });
        }

        // [방어 2] 대시보드 권한이 없는 부서인 경우 튕겨냄
        const allowedDepts = ['주차관리팀', '시설관리팀', '보안팀'];
        if (!allowedDepts.includes(loginData.adminDeptName)) {
            alert('대시보드 접근 권한이 없는 부서입니다. (허용 부서: 주차/시설/보안팀)');
            return next('/'); // 메인 홈페이지로
        }

        // [방어 3] 권한 부서 직원이지만 2차 인증을 안 하고 대시보드 화면 보려 할 때
        if (to.path !== '/dashboard/admin-login' && !loginData.isAdminVerified) {
            alert('보안을 위해 사원번호 2차 인증을 진행해 주세요.');
            // 2차 인증 후 원래 가려던 대시보드 화면으로
            return next({ path: '/dashboard/admin-login', query: { redirect: to.fullPath } });
        }

        // 관문 통과!
        return next();
    }

    // ===================================
    // 일반 병원 웹사이트의 보호된 페이지
    if (to.meta.requiresAuth) {
        if (!loginData) {
            alert('로그인이 필요한 서비스입니다.');
            return next({ path: '/login', query: { redirect: to.fullPath } });
        }
        return next();
    }

    // ===================================
    // 그 외 딱지 없는 일반 페이지
    next();
});

export default router;