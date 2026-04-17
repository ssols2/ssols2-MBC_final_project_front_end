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
                        @input="empId = empId.toUpperCase()" />
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
                <span class="divider">|</span>
                <span class="text-link">관리자 등록</span>
            </div>
        </div>

        <div v-if="showFindModal" class="overlay">
            <div class="glass-modal find-modal">

                <div v-if="!findResult">
                    <h2 class="modal-title text-center mb-30">사원번호 조회</h2>

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
                        <input type="text" v-model="findForm.name" placeholder="홍길동" class="glass-input" />
                        <p v-if="findForm.name && findIdErrors.name" class="error-msg-small">{{ findIdErrors.name }}</p>
                    </div>

                    <div class="input-group mb-20">
                        <label class="row-label">아이디</label>
                        <input type="text" v-model="findForm.userId" placeholder="hong123" class="glass-input" />
                        <p v-if="findForm.userId && findIdErrors.userId" class="error-msg-small">{{ findIdErrors.userId
                            }}</p>
                    </div>

                    <div class="input-group mb-30">
                        <label class="row-label">이메일</label>
                        <input type="email" v-model="findForm.email" placeholder="hong@naver.com" class="glass-input" />
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
import { useRouter } from 'vue-router'
import { findAdminIdReq, loginAdminReq } from '@/api/dashboard/adminLogin.js'

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

            sessionStorage.setItem('loginId', empId.value)
            sessionStorage.setItem('dept', selectedDept.value)
            sessionStorage.setItem('adminName', adminName)

            alert(`${selectedDept.value} ${adminName} 관리자님 인증되었습니다`)
            router.push('/dashboard/main')
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
    const nameRegex = /[a-zA-Z]/ // 영어 포함 여부 체크
    if (!findForm.value.name) {
        errors.name = '이름을 입력해주세요'
    } else if (findForm.value.name.length < 2) {
        errors.name = '이름은 2자 이상 입력해주세요'
    } else if (nameRegex.test(findForm.value.name)) {
        errors.name = '이름에 영어는 입력할 수 없습니다'
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
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

    position: absolute;
    top: 0;
    width: 100%;
    padding: 10px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'pretendard';
    font-size: 18px;
}
.header-logo { 
    height: 42px;
    margin-top: 2px;
}

/* 3. 글래스모피즘 모달 박스 */
.glass-modal {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 40px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.modal-logo { height: 80px; }
.main-login-box { 
    width: 420px;
    height: 580px;

}

/* 4. 입력창 및 버튼 */
.glass-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px 15px;
    color: white;
    outline: none;
    transition: 0.3s;
}
.glass-input:focus { border-color: #82c2e3; background: rgba(255, 255, 255, 0.1); }

.btn-primary {
    width: 100%;
    padding: 15px;
    background: #82c2e3;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;
}
.btn-primary:disabled { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.3); cursor: not-allowed; }

/* 5. 에러 메시지 */
.error-msg { color: #ff0000; font-size: 13px; margin-top: 8px; }
.error-msg-small { color: #f87171; font-size: 11px; margin-top: 4px; }

/* 6. 모달 오버레이 */
.overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}
.find-modal { width: 400px; }

/* 7. 공통 유틸리티 */
.text-center { text-align: center; }
.mb-30 { margin-bottom: 30px; }
.mt-20 { margin-top: 20px; }
.text-link { color: #94a3b8; cursor: pointer; font-size: 14px; }
.text-link:hover { color: white; }
</style>