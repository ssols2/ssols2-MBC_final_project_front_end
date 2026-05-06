<template>
    <div class="admin-login-wrapper">

        <header class="admin-header">
            <div class="logo-area">
                <img src="@/assets/txtlogo3.png" alt="서울에스병원" class="header-logo" />
            </div>
            <div class="time-area">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ currentTime }}
            </div>
        </header>

        <div class="glass-modal main-login-box">
            <div class="text-center mb-30">
                <img src="@/assets/txtlogo3.png" alt="서울에스병원" class="modal-logo" />
                <h2 class="modal-title">서울에스병원 주차 관리 포털</h2>
            </div>

            <div class="input-group">
                <label>부서 선택</label>
                <select v-model="selectedDept" class="glass-input">
                    <option value="" disabled selected>부서 선택</option>
                    <option value="주차관리팀">주차관리팀</option>
                    <option value="시설관리팀">시설관리팀</option>
                    <option value="보안팀">보안팀</option>
                </select>
            </div>

            <div class="input-group mt-20">
                <label>사원번호 입력</label>
                <div class="input-with-icon">
                    <svg class="input-icon" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                    </svg>
                    <input type="text" v-model="empId" placeholder="예: P20115782" class="glass-input pl-40"
                        maxlength="9" @input="handleEmpIdInput" @keyup.enter="isLoginReady && handleLogin()" />
                </div>

                <p v-if="idValidationMessage" class="error-msg">
                    {{ idValidationMessage }}
                </p>
            </div>

            <button class="btn-primary mt-30" :disabled="!isLoginReady" @click="handleLogin">
                관리자 인증
            </button>

            <div class="modal-footer mt-20">
                <span class="text-link" @click="showFindModal = true">사원번호 찾기</span>
                <span class="divider" style="color: rgba(255, 255, 255, 0.653);">|</span>
                <span class="text-link" @click="goToAdminRegi">관리자 등록</span>
            </div>
        </div>

        <div v-if="showFindModal" class="overlay">
            <div class="glass-modal find-modal" :class="{ 'is-result': findResult }">

                <div v-if="!findResult">
                    <h2 class="modal-title text-center mb-50">사원번호 조회</h2>

                    <div class="input-group mb-20">
                        <label class="row-label">부서 선택</label>
                        <select v-model="findForm.dept" class="glass-input">
                            <option value="">부서 선택</option>
                            <option value="주차관리팀">주차관리팀</option>
                            <option value="시설관리팀">시설관리팀</option>
                            <option value="보안팀">보안팀</option>
                        </select>
                        <p v-if="findForm.dept === ''" class="error-msg-small">{{ findIdErrors.dept }}</p>
                    </div>

                    <div class="input-group mb-20">
                        <label class="row-label">이름</label>
                        <input type="text" v-model="findForm.name" placeholder="홍길동" class="glass-input"
                            @keyup.enter="isFindReady && executeFindId()" />
                        <p v-if="findForm.name && findIdErrors.name" class="error-msg-small">{{ findIdErrors.name }}</p>
                    </div>

                    <div class="input-group mb-20">
                        <label class="row-label">아이디</label>
                        <input type="text" v-model="findForm.userId" placeholder="hong123" class="glass-input"
                            @keyup.enter="isFindReady && executeFindId()" />
                        <p v-if="findForm.userId && findIdErrors.userId" class="error-msg-small">{{ findIdErrors.userId
                            }}</p>
                    </div>

                    <div class="input-group mb-10">
                        <label class="row-label">이메일</label>
                        <input type="email" v-model="findForm.email" placeholder="hong@naver.com" class="glass-input"
                            @keyup.enter="isFindReady && executeFindId()" />
                        <p v-if="findForm.email && findIdErrors.email" class="error-msg-small">{{ findIdErrors.email }}
                        </p>
                    </div>

                    <button class="btn-primary" :disabled="!isFindReady" @click="executeFindId">사원번호 조회</button>
                    <button class="btn-text mt-10" style="width: 100%;" @click="showFindModal = false">닫기</button>
                </div>

                <div v-else class="text-center">
                    <h2 class="modal-title mb-30">사원번호 조회 결과</h2>
                    <div class="result-box mb-40">
                        <p class="result-label">인증된 사원번호</p>
                        <h1 class="highlight-emp-id">{{ findResult }}</h1>
                    </div>

                    <button class="btn-primary" @click="applyFoundId">사원번호 적용</button>
                    <button class="btn-text mt-10" style="width: 100%;" @click="resetFindModal">다시 검색</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { findAdminIdReq, loginAdminReq } from '@/api/dashboard/adminLogin.js'

const route = useRoute()
const router = useRouter()

// ==========================================
// 1. 실시간 시계 로직 (년 월 일 00:00:00)
// ==========================================
const currentTime = ref('')
let timer = null

const formatTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const date = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    currentTime.value = `${year}년 ${month}월 ${date}일 ${hours}:${minutes}:${seconds}`
}

onMounted(() => {
    formatTime()
    timer = setInterval(formatTime, 1000)
})

onUnmounted(() => {
    clearInterval(timer)
})

// ==========================================
// 2. 로그인 및 사원번호 유효성 검사
// ==========================================
const selectedDept = ref('')
const empId = ref('')

const idValidationMessage = computed(() => {
    // 완전 초기 상태 (둘 다 빈칸) -> 아무 메시지도 안 띄움
    if (!selectedDept.value && !empId.value) return ''

    // 부서 선택 없이 사원번호부터 막 치려고 할 때
    if (!selectedDept.value && empId.value) return '부서를 먼저 선택해주세요'

    // 부서 선택 후
    if (selectedDept.value && !empId.value) return '사원번호를 입력해주세요'

    // 부서 선택 + 사원번호 입력 시작 시
    const id = empId.value.trim().toUpperCase()

    let correctPrefix = ''
    if (selectedDept.value === '주차관리팀') correctPrefix = 'P'
    if (selectedDept.value === '시설관리팀') correctPrefix = 'F'
    if (selectedDept.value === '보안팀') correctPrefix = 'S'

    // 첫 글자 알파벳이 틀릴 경우
    if (!id.startsWith(correctPrefix)) {
        return '사원번호 형식을 다시 확인해주십시오'
    }

    // 알파벳은 맞는데 9자리가 아닐 경우
    if (id.length !== 9) {
        return '9자리를 입력해주세요'
    }

    // 완벽하게 9자리 다 맞췄을 때 -> 메시지 삭제
    return ''
})

// 버튼 활성화 조건 (부서 선택 완료 & 에러 메시지가 빈칸('')일 때만 true)
const isLoginReady = computed(() => {
    return selectedDept.value !== '' && idValidationMessage.value === ''
})

const handleLogin = async () => {
    try {
        // 자바 서버로 부서랑 사원번호 보내서 검사받기
        const response = await loginAdminReq({
            dept: selectedDept.value,
            empId: empId.value
        })

        if (response.data.is_success) {
            const adminName = response.data.admin_name
            const adminLoginId = response.data.admin_id

            // 기존 세션 가져오기
            const loginDataStr = sessionStorage.getItem('loginId')
            if (!loginDataStr) {
                alert("로그인 정보가 유실되었습니다. 다시 로그인해주세요.")
                return router.push('/login')
            }

            const loginData = JSON.parse(loginDataStr)

            // 1차 로그인한 사람과 2차 사원번호 치는 사람이 같은지 확인
            if (!adminLoginId || loginData.id.toUpperCase() !== adminLoginId.toUpperCase()) {
                alert('로그인한 계정의 사원번호와 일치하지 않습니다! 보안을 위해 차단됩니다.')
                return;
            }

            loginData.isAdminVerified = true
            sessionStorage.setItem('loginId', JSON.stringify(loginData))

            // 나머지 정보도 따로 저장
            sessionStorage.setItem('dept', selectedDept.value)
            sessionStorage.setItem('adminName', adminName)

            alert(`${selectedDept.value} ${adminName} 관리자님 인증되었습니다`)

            const redirectUrl = route.query.redirect
            router.push(redirectUrl || '/dashboard/main')

        } else {
            alert(response.data.message || "부서 또는 사원번호가 일치하지 않습니다")
        }
    } catch (error) {
        console.error("로그인 API 에러:", error)
        alert("서버 통신 중 오류가 발생했습니다")
    }
}

// ==========================================
// 3. 사원번호 찾기 모달 로직
// ==========================================
const showFindModal = ref(false)
const findResult = ref(null)

const findForm = ref({
    dept: '',
    name: '',
    userId: '',
    email: ''
})

const findIdErrors = computed(() => {
    const errors = { dept: '', name: '', userId: '', email: '' }

    // 1. 부서 선택 체크
    if (!findForm.value.dept) errors.dept = '부서를 선택해주세요'

    // 2. 이름 체크 (2자 이상 + 영어 포함 불가)
    const nameRegex = /^[가-힣a-zA-Z\s]+$/
    if (!findForm.value.name) {
        errors.name = '이름을 입력해주세요'
    } else if (findForm.value.name.length < 2) {
        errors.name = '이름은 2자 이상 입력해주세요'
    } else if (!nameRegex.test(findForm.value.name)) {
        errors.name = '이름은 한글과 영문만 입력 가능합니다'
    }

    // 3. 아이디 체크 (6자 이상 + 한글 포함 불가)
    const korRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/ // 한글 포함 여부 체크
    if (!findForm.value.userId) {
        errors.userId = '아이디를 입력해주세요'
    } else if (findForm.value.userId.length < 6) {
        errors.userId = '아이디는 6자 이상 입력해주세요'
    } else if (korRegex.test(findForm.value.userId)) {
        errors.userId = '아이디에 한글은 입력할 수 없습니다'
    }

    // 4. 이메일 체크 (@와 . 포함 필수)
    if (!findForm.value.email) {
        errors.email = '이메일을 입력해주세요'
    } else if (!findForm.value.email.includes('@') || !findForm.value.email.includes('.')) {
        errors.email = '올바른 이메일 형식이 아닙니다 (@와 . 포함)'
    }

    return errors
})

// 모든 에러가 없어야 버튼 활성화
const isFindReady = computed(() => {
    return Object.values(findIdErrors.value).every(msg => msg === '')
})

const executeFindId = async () => {
    if (!findForm.value.dept || !findForm.value.name || !findForm.value.userId || !findForm.value.email) {
        alert("필수 정보를 모두 입력해 주세요")
        return
    }

    try {
        const response = await findAdminIdReq(findForm.value)

        if (response.data.is_success) {
            findResult.value = response.data.emp_id
        } else {
            alert(response.data.message || "일치하는 사원 정보가 없습니다")
        }
    } catch (error) {
        console.error("사원번호 조회 API 에러:", error)
        alert("서버 통신 중 오류가 발생했습니다")
    }
}

const applyFoundId = () => {
    selectedDept.value = findForm.value.dept
    empId.value = findResult.value
    resetFindModal()
}

const resetFindModal = () => {
    findForm.value = { dept: '', name: '', userId: '', email: '' }
    findResult.value = null
    showFindModal.value = false
}

// 관리자 등록
const goToAdminRegi = () => {
    router.push({
        path: '/regi',
        query: { type: 'hospital', role: 'admin' }
    });
}

// 사원번호 입력 제약
const handleEmpIdInput = (e) => {
    // 1. 대문자 변환 및 영문/숫자 외 문자 즉시 제거
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (val.length > 0) {
        // 2. 첫 글자는 무조건 알파벳(A-Z)만 남김 (숫자 입력 시 삭제)
        const firstChar = val.charAt(0).replace(/[^A-Z]/g, '');

        // 3. 두 번째 글자부터는 무조건 숫자(0-9)만 남김 (알파벳 입력 시 삭제)
        const restChars = val.substring(1).replace(/[^0-9]/g, '');

        val = firstChar + restChars;
    }

    // 4. 최대 9자리까지만 잘라서 데이터에 반영
    empId.value = val.substring(0, 9);
}
</script>

<style scoped>
/* 1. 전체 배경 및 중앙 정렬 */
.admin-login-wrapper {
    width: 100%;
    height: 100vh;
    background-image: linear-gradient(rgba(0, 0, 0, 0.845), rgba(0, 0, 0, 0.511)), url('@/assets/hospital.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
}

/* 2. 상단 헤더 */
.admin-header {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    position: absolute;
    top: 0;
    width: 100%;
    padding: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 20px;
    z-index: 10;
}

.header-logo {
    height: 60px;
    margin-top: 2px;
}

.time-area {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 300;
    letter-spacing: 0.5px;
}

/* 3. 글래스모피즘 모달 박스 */
.glass-modal {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 50px 45px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    transition: all 0.4s ease;
}

.main-login-box {
    width: 440px;
    height: auto;
    text-align: center;

}

.modal-logo {
    height: 70px;
    margin-bottom: 17px;
}

.modal-title {
    color: #f5f5f5;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.5px;
    margin-bottom: 40px;
}

/* 4. 입력창 및 버튼 */
.input-group {
    text-align: left;
}

.input-group label {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    margin-left: 5px;
}

.input-with-icon {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.4);
}

.glass-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 14px 18px;
    color: #9f9f9f;
    outline: none;
    transition: 0.3s;
    font-size: 15px;
}

.pl-40 {
    padding-left: 45px !important;
}

.glass-input:focus {
    border-color: #82c2e3;
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 0 15px rgba(130, 194, 227, 0.2);
}

/* 5. 버튼 (Admin 전용 컬러) */
.btn-primary {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #82c2e3 0%, #64b5f6 100%);
    border: none;
    border-radius: 12px;
    color: #fafafa;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 40px;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(130, 194, 227, 0.12);
    filter: brightness(1.1);
}

.btn-primary:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
}

/* 6. 모달 푸터 (링크) */
.modal-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 25px;
    cursor: pointer;
}

.divider {
    color: rgba(255, 255, 255, 0.1);
}

.text-link {
    color: rgba(255, 255, 255, 0.653);
    font-size: 16px;
    text-decoration: none;
    transition: 0.3s;
}

.text-link:hover {
    color: #fff;
    text-decoration: underline;
}

/* 7. 찾기 모달 (오버레이 및 레이아웃) */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.593);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.find-modal {
    width: 460px;
    height: auto !important;
    min-height: 580px;
    padding: 50px 45px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.find-modal.is-result {
    min-height: 400px;
    /* 결과창일 때만 짧게 */
}

.input-group.mb-20 {
    margin-bottom: 17px;
}

.row-label {
    display: block;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
}

/* 입력창 내부 텍스트 및 높이 */
.find-modal .glass-input {
    padding: 16px 20px;
    font-size: 16px;
}

.btn-text {
    width: 100%;
    padding: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-text:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.4);
}

.find-modal .btn-primary {
    margin-top: 17px !important;
}

/* 결과 박스 */
.result-box {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 15px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
}

.result-box.mb-40 {
    margin-top: 20px;
    margin-bottom: 17px !important;
}

.highlight-emp-id {
    font-size: 36px;
    color: #82c2e3;
    font-weight: 900;
    letter-spacing: 2px;
}

.result-label {
    color: #f5f5f5;
    margin-bottom: 7px;
}

/* 유틸리티 */
.mt-10 {
    margin-top: 10px;
}

.mt-20 {
    margin-top: 20px;
}

.mt-30 {
    margin-top: 30px;
}

.mb-20 {
    margin-bottom: 20cpx;
}

.mb-30 {
    margin-bottom: 10px;
}

.mb-40 {
    margin-bottom: 40px;
}

.mb-50 {
    margin-bottom: 27px;
    margin-top: -10px;
}

.error-msg {
    color: #f87171;
    font-size: 14px;
    margin-top: 8px;
    font-weight: 500;
}

.error-msg-small {
    color: #f87171;
    font-size: 14px;
    margin-top: 8px;
    padding-left: 5px;
}

/* 애니메이션 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.glass-modal {
    animation: fadeIn 0.6s ease-out;
}
</style>