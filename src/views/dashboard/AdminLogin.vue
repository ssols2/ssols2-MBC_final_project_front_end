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
                    <svg class="input-icon" viewBox="0 0 24 24" fill="currentColor">
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

                    <div class="input-group mb-15">
                        <label class="row-label">부서 선택</label>
                        <select v-model="findForm.dept" class="glass-input">
                            <option value="">부서 선택</option>
                            <option value="주차관리팀">주차관리팀</option>
                            <option value="시설관리팀">시설관리팀</option>
                            <option value="보안팀">보안팀</option>
                        </select>
                    </div>
                    <div class="input-group mb-15">
                        <label class="row-label">이름</label>
                        <input type="text" v-model="findForm.name" placeholder="홍길동" class="glass-input" />
                    </div>
                    <div class="input-group mb-15">
                        <label class="row-label">아이디</label>
                        <input type="text" v-model="findForm.userId" placeholder="mem123" class="glass-input" />
                    </div>
                    <div class="input-group mb-30">
                        <label class="row-label">이메일</label>
                        <input type="email" v-model="findForm.email" placeholder="hong@naver.com" class="glass-input" />
                    </div>

                    <button class="btn-primary" @click="executeFindId">사원번호 조회</button>
                    <button class="btn-text mt-10" style="width: 100%;" @click="showFindModal = false">닫기</button>
                </div>

                <div v-else class="text-center">
                    <h2 class="modal-title mb-30">사원번호 조회 결과</h2>
                    <h1 class="highlight-emp-id mb-40">{{ findResult }}</h1>

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

const handleLogin = () => {
    sessionStorage.setItem('loginId', empId.value)
    sessionStorage.setItem('dept', selectedDept.value)

    alert(`${selectedDept.value} ${empId.value} 관리자님 인증되었습니다`)
    router.push('/dashboard/main')
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

const executeFindId = () => {
    if (!findForm.value.dept || !findForm.value.name) {
        alert("필수 정보를 모두 입력해 주세요")
        return
    }

    // DB 조회 시뮬레이션 (0.5초 딜레이)
    setTimeout(() => {
        let prefix = 'P'
        if (findForm.value.dept === '시설관리팀') prefix = 'F'
        if (findForm.value.dept === '보안팀') prefix = 'S'

        findResult.value = `${prefix}20115782`
    }, 500)
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

<style scoped></style>