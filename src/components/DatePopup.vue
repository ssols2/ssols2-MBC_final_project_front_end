<template>
    <div v-if="visible" class="date-popup-layer">
        <div class="date-popup">
            <div class="date-popup-header">
                <div class="date-popup-title-wrap">
                    <h3 class="date-popup-title">조회 기간</h3>
                    <span class="header-date-range">
                        {{ tempStartDate ? formatDate(tempStartDate) : '-' }} ~
                        {{ tempEndDate ? formatDate(tempEndDate) : '-' }}
                    </span>
                </div>

                <button type="button" class="icon-btn close-btn" @click="handleClose">
                    ✕
                </button>
            </div>

            <div class="calendar-wrap">
                <div class="calendar-panel">
                    <div class="calendar-header">
                        <button type="button" class="icon-btn nav-btn" @click="moveLeftMonth(-1)">‹</button>
                        <div class="calendar-title">{{ leftCalendar.year }}년 {{ leftCalendar.month }}월</div>
                        <button type="button" class="icon-btn nav-btn" @click="moveLeftMonth(1)">›</button>
                    </div>

                    <div class="weekday-row">
                        <div v-for="day in weekDays" :key="`left-${day}`" class="weekday-cell">
                            {{ day }}
                        </div>
                    </div>

                    <div class="date-grid">
                        <button v-for="dayObj in leftCalendarDays" :key="`left-${dayObj.key}`" type="button"
                            class="date-cell" :class="getDateCellClass(dayObj)" @click="handleDateClick(dayObj)">
                            {{ dayObj.date.getDate() }}
                        </button>
                    </div>
                </div>

                <div class="calendar-panel">
                    <div class="calendar-header">
                        <button type="button" class="icon-btn nav-btn" @click="moveRightMonth(-1)">‹</button>
                        <div class="calendar-title">{{ rightCalendar.year }}년 {{ rightCalendar.month }}월</div>
                        <button type="button" class="icon-btn nav-btn" @click="moveRightMonth(1)">›</button>
                    </div>

                    <div class="weekday-row">
                        <div v-for="day in weekDays" :key="`right-${day}`" class="weekday-cell">
                            {{ day }}
                        </div>
                    </div>

                    <div class="date-grid">
                        <button v-for="dayObj in rightCalendarDays" :key="`right-${dayObj.key}`" type="button"
                            class="date-cell" :class="getDateCellClass(dayObj)" @click="handleDateClick(dayObj)">
                            {{ dayObj.date.getDate() }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="date-popup-footer">
                <div class="quick-range-row">
                    <label class="quick-range-label" for="quickRangeSelect">빠른 선택</label>
                    <select id="quickRangeSelect" v-model="selectedQuickRange" class="quick-range-select"
                        @change="handleQuickRangeChange">
                        <option value="">직접 선택</option>
                        <option value="today">오늘</option>
                        <option value="yesterday">어제</option>
                        <option value="last7">최근 7일</option>
                        <option value="clear">초기화</option>
                    </select>
                </div>

                <div class="footer-actions">
                    <button type="button" class="footer-btn secondary" @click="handleClose">
                        취소
                    </button>
                    <button type="button" class="footer-btn primary" @click="handleApply">
                        적용
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// 부모 컴포넌트가 달력에게 던져주는 설정값들 (팝업 열림 상태, 시작/종료일)
const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    startDate: {
        type: [String, Date, null],
        default: null,
    },
    endDate: {
        type: [String, Date, null],
        default: null,
    },
    maxDate: { type: [String, Date, null], default: null }
})

// 최대 허용 날짜 계산 함수 새로 추가
function getMaxDateAllowed() {
    if (props.maxDate) {
        return toDateOnly(props.maxDate)
    }
    return getToday() // maxDate가 안 넘어오면 원래대로 '오늘'까지만 허용
}

// 부모한테 신호보내기
const emit = defineEmits([
    'close',
    'apply',
    'update:startDate',
    'update:endDate',
])

// 달력 요일 표시용 배열
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

// 달력 내부에서 임시로 들고 있는 선택 값들 (적용 누르기 전까지 저장해두는 곳)
const selectedQuickRange = ref('')
const tempStartDate = ref(null)
const tempEndDate = ref(null)

// 왼쪽/오른쪽 달력이 각각 몇 년 몇 월을 보여줄지 결정하는 변수
const leftCalendar = ref({ year: 2026, month: 4 })
const rightCalendar = ref({ year: 2026, month: 5 })


// ── [유틸리티 함수들] ──
// 시간(시,분,초)을 다 떼어내고 순수하게 '날짜(일)'만 남기는 함수
function toDateOnly(value) {
    if (!value) return null

    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// 날짜 형식 'YYYY-MM-DD'
function formatDate(date) {
    const d = toDateOnly(date)
    if (!d) return '-'

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 두 날짜가 완벽히 똑같은 날인지 검사하는 함수
function isSameDate(a, b) {
    const da = toDateOnly(a)
    const db = toDateOnly(b)

    if (!da || !db) return false

    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    )
}

// 어떤 날짜가 시작일과 종료일 '사이'에 있는지 검사하는 함수
function isBetweenDates(target, start, end) {
    const t = toDateOnly(target)
    const s = toDateOnly(start)
    const e = toDateOnly(end)

    if (!t || !s || !e) return false

    const time = t.getTime()
    return time > s.getTime() && time < e.getTime()
}

// 오늘 날짜를 가져오는 함수
function getToday() {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 어제 날짜를 가져오는 함수
function getYesterday() {
    const d = getToday()
    d.setDate(d.getDate() - 1)
    return d
}

// [추가] 오른쪽 달력 기준으로 왼쪽을 -1개월 세팅하는 함수 =====================================================
function setCalendarsByEnd(baseDate) {
    // 오른쪽 달력은 넘겨받은 기준일(종료일이나 오늘)로 고정
    rightCalendar.value = {
        year: baseDate.getFullYear(),
        month: baseDate.getMonth() + 1,
    }

    // 왼쪽 달력은 오른쪽 달력에서 1달 빼기
    let prevMonth = rightCalendar.value.month - 1
    let prevYear = rightCalendar.value.year

    // 만약 오른쪽이 1월이었다면, 왼쪽은 작년 12월로 넘어가게 처리
    if (prevMonth < 1) {
        prevMonth = 12
        prevYear--
    }

    leftCalendar.value = {
        year: prevYear,
        month: prevMonth,
    }
}

// [수정] 팝업이 열릴 때, 부모가 준 날짜를 달력에 세팅하는 함수 =====================================================
function syncTempDatesFromProps() {
    tempStartDate.value = toDateOnly(props.startDate)
    tempEndDate.value = toDateOnly(props.endDate)

    const today = getToday()
    // 시작일 대신 종료일(tempEndDate)을 기준으로 잡음 (종료일 없으면 오늘)
    const baseEnd = tempEndDate.value || today

    // 오른쪽 달력에 baseEnd를 꽂고 왼쪽을 -1개월로 만듦
    setCalendarsByEnd(baseEnd)
    selectedQuickRange.value = ''
}

// 부모가 팝업을 열거나(visible) 날짜를 바꾸면 실시간으로 감지해서 달력을 새로고침 하는 역할
watch(() => props.visible, (isVisible) => { if (isVisible) syncTempDatesFromProps() }, { immediate: true })
watch(() => [props.startDate, props.endDate], () => { if (props.visible) syncTempDatesFromProps() })


// ── [달력 월 이동 및 생성 로직] ──
// [수정] < > 화살표 눌렀을 때 달을 이동시키는 함수 =====================================================
function moveMonth(diff) {
    const current = rightCalendar.value
    const moved = new Date(current.year, current.month - 1 + diff, 1)
    setCalendarsByEnd(moved)
}

// ── [수정] 스마트 월 이동 로직 (선택 시 고정) ──

// 1. 좌측 달력 이동 버튼 클릭 시
function moveLeftMonth(diff) {
    // 시작일이 있고 종료일이 없는 '진행 중' 상태거나, 둘 다 이미 골랐다면?
    if (tempStartDate.value) {
        // 시작일이 있는 좌측 달력은 놔두고, 우측 달력만 이동할 수 있게 '언링크' 상태로 처리 가능
        const current = leftCalendar.value
        const moved = new Date(current.year, current.month - 1 + diff, 1)

        leftCalendar.value = {
            year: moved.getFullYear(),
            month: moved.getMonth() + 1
        }
    } else {
        // 평소(선택 전)에는 예전처럼 두 달력이 같이 움직임
        moveMonth(diff)
    }
}

// 2. 우측 달력 이동 버튼 클릭 시
function moveRightMonth(diff) {
    // 시작일이 선택된 상태라면? (종료일 찾으러 가는 중)
    if (tempStartDate.value && !tempEndDate.value) {
        // 왼쪽 달력(시작일)은 고정, 오른쪽 달력만 탐색
        const current = rightCalendar.value
        const moved = new Date(current.year, current.month - 1 + diff, 1)

        rightCalendar.value = {
            year: moved.getFullYear(),
            month: moved.getMonth() + 1
        }
    } else {
        // 평소에는 같이 이동
        moveMonth(diff)
    }
}

// 달력의 42칸(6주)에 들어갈 날짜들을 쫙 계산해서 만들어내는 함수
function createCalendarDays(year, month) {
    const firstDay = new Date(year, month - 1, 1)
    const firstWeekday = firstDay.getDay()
    const gridStart = new Date(year, month - 1, 1 - firstWeekday)

    const result = []

    for (let i = 0; i < 42; i += 1) {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + i)

        result.push({
            key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
            date,
            isCurrentMonth: date.getMonth() === month - 1,
        })
    }

    return result
}

// 왼쪽/오른쪽 달력 데이터를 화면에 띄우기 위해 준비해두는 변수
const leftCalendarDays = computed(() =>
    createCalendarDays(leftCalendar.value.year, leftCalendar.value.month)
)

const rightCalendarDays = computed(() =>
    createCalendarDays(rightCalendar.value.year, rightCalendar.value.month)
)

// ── [사용자 상호작용 (클릭 이벤트)] ──
// [수정] 날짜 클릭 이벤트 함수 =====================================================
function handleDateClick(dayObj) {
    const picked = toDateOnly(dayObj.date)
    if (!picked) return

    // 기준을 '오늘'에서 '최대 허용 날짜'로 변경
    const maxAllowed = getMaxDateAllowed()
    if (picked.getTime() > maxAllowed.getTime()) {
        return 
    }

    // 미래 날짜 차단 로직
    // const today = getToday()
    // if (picked.getTime() > today.getTime()) {
    //     return // 클릭한 날짜가 오늘보다 크면 무시하고 함수 종료
    // }

    selectedQuickRange.value = ''

    // 시작일만 있거나, 둘 다 꽉 차있으면 새로 시작일 지정
    if (!tempStartDate.value || (tempStartDate.value && tempEndDate.value)) {
        tempStartDate.value = picked
        tempEndDate.value = null
        return
    }
    // 시작일보다 과거를 클릭하면 그걸 시작일로, 아니면 종료일로 지정
    if (picked.getTime() < tempStartDate.value.getTime()) {
        tempEndDate.value = tempStartDate.value
        tempStartDate.value = picked
    } else {
        tempEndDate.value = picked
    }
}

// [수정] 날짜 셀 디자인 클래스 함수 =====================================================
function getDateCellClass(dayObj) {
    const date = dayObj.date

    // 달력 숫자 흐리게 만드는 기준도 '최대 허용 날짜'로 변경
    const maxAllowed = getMaxDateAllowed()
    const isFuture = date.getTime() > maxAllowed.getTime()

    return {
        'is-future': isFuture, // 미래면 회색으로 흐려짐
        'is-other-month': !dayObj.isCurrentMonth,
        // 수정: dayObj.isCurrentMonth가 참(true)일 때만 하이라이트 주기
        'is-start': dayObj.isCurrentMonth && isSameDate(date, tempStartDate.value),
        'is-end': dayObj.isCurrentMonth && isSameDate(date, tempEndDate.value),
        'is-in-range': dayObj.isCurrentMonth && isBetweenDates(date, tempStartDate.value, tempEndDate.value),
        'is-single':
            dayObj.isCurrentMonth &&
            tempStartDate.value &&
            tempEndDate.value &&
            isSameDate(tempStartDate.value, tempEndDate.value) &&
            isSameDate(date, tempStartDate.value),
    }
}

// ── [수정] [빠른 선택 (Quick Range) 기능들] ── =====================================================
function selectToday() {
    const today = getToday()

    tempStartDate.value = today
    tempEndDate.value = today

    setCalendarsByEnd(today)
}

function selectYesterday() {
    const yesterday = getYesterday()

    tempStartDate.value = yesterday
    tempEndDate.value = yesterday

    setCalendarsByEnd(yesterday)
}

function selectLast7Days() {
    const end = getToday()
    const start = new Date(end)
    start.setDate(end.getDate() - 6)

    tempStartDate.value = start
    tempEndDate.value = end

    setCalendarsByEnd(end)
}

function clearRange() {
    const today = getToday()

    tempStartDate.value = today
    tempEndDate.value = today
    selectedQuickRange.value = 'clear'

    setCalendarsByEnd(today)
}

// 셀렉트 박스에서 빠른 선택을 골랐을 때 매칭시켜주는 함수
function handleQuickRangeChange() {
    switch (selectedQuickRange.value) {
        case 'today':
            selectToday()
            break
        case 'yesterday':
            selectYesterday()
            break
        case 'last7':
            selectLast7Days()
            break
        case 'clear':
            clearRange()
            break
        default:
            break
    }
}

// 취소 버튼: 팝업 닫기 신호 발송
function handleClose() {
    emit('close')
}

// 적용 버튼: 선택한 날짜 부모에게 전달
function handleApply() {
    const normalizedStart = tempStartDate.value
        ? tempStartDate.value
        : getToday()

    const normalizedEnd = tempEndDate.value
        ? tempEndDate.value
        : normalizedStart

    const start = formatDate(normalizedStart)
    const end = formatDate(normalizedEnd)

    emit('update:startDate', start)
    emit('update:endDate', end)
    emit('apply', {
        startDate: start,
        endDate: end,
    })
    emit('close')
}
</script>

<style scoped>
/* 팝업 위치 고정 */
.date-popup-layer {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1000;
}

/* 핵심 1: 글래스모피즘 반투명 유리 효과 적용 */
.date-popup {
    width: 600px;
    border-radius: 10px;
    background: #444d5571 !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.437);
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    overflow: hidden;
}

/* 헤더 테두리 부드럽게 완화 */
.date-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.date-popup-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.date-popup-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #f5f5f5;
    flex-shrink: 0;
}

.header-date-range {
    font-size: 14px;
    font-weight: 500;
    color: #777;
    white-space: nowrap;
    line-height: 1;
}

.icon-btn,
.footer-btn,
.date-cell {
    border: none;
    cursor: pointer;
    transition: all 0.18s ease;
}

.calendar-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 14px 18px 16px;
}

.calendar-panel {
    padding: 4px 2px 0;
    background: transparent;
    border: none;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.calendar-title {
    font-size: 15px;
    font-weight: 700;
    color: #f8fafc;
}

.icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    color: #cbd5e1;
    font-size: 22px;
    font-weight: 700;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.close-btn {
    font-size: 16px;
    color: #777;
}

.weekday-row,
.date-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
}

.weekday-row {
    margin-bottom: 6px;
}

/* 주(Week)마다 상하 간격 6px 띄우기 */
.date-grid {
    gap: 8px 0;
}

.weekday-cell {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #cbd5e1;
    padding: 6px 0;
}

/* 기본 셀 모양 설정 (가짜 요소를 띄우기 위해 relative 추가) */
.date-cell {
    position: relative;
    z-index: 1;
    height: 32.5px;
    padding: 0;
    background: transparent;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 500;
    border-radius: 0;
    /* 테두리 둥글기를 아예 없애서 선이 끊기지 않게 함 */
}

/* 마우스 올렸을 때 은은하게 빛나는 효과 */
.date-cell:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.date-cell.is-other-month {
    color: rgba(148, 163, 184, 0.35);
}

/* 핵심 2: 선택된 날짜 범위 색상 */
.date-cell.is-in-range {
    background: rgba(130, 194, 227, 0.25) !important;
    color: #fff;
}

/* 시작일, 종료일, 단일 선택일 확실하게 강조 */
.date-cell.is-start,
.date-cell.is-end,
.date-cell.is-single {
    background: #82c2e3 !important;
    color: #222 !important;
    font-weight: 700;
}

/* 일요일(시작)과 토요일(끝)은 라인을 타원형으로 깎아줌 */
.date-cell.is-in-range:nth-child(7n+1) {
    border-radius: 999px 0 0 999px !important;
}

.date-cell.is-in-range:nth-child(7n) {
    border-radius: 0 999px 999px 0 !important;
}

/* 시작일/종료일 배경 반갈죽 트릭 (타원과 선을 자연스럽게 이어줌) */
.date-cell.is-start {
    background: linear-gradient(to right, transparent 50%, rgba(130, 194, 227, 0.25) 50%) !important;
    color: #222 !important;
    font-weight: 700;
}

.date-cell.is-end {
    background: linear-gradient(to left, transparent 50%, rgba(130, 194, 227, 0.25) 50%) !important;
    color: #222 !important;
    font-weight: 700;
}

.date-cell.is-single {
    background: transparent !important;
    color: #222 !important;
    font-weight: 700;
}

/* (예외처리) 토요일 시작 / 일요일 종료 시 배경 삐져나옴 컷하기 */
.date-cell.is-start:nth-child(7n) {
    background: transparent !important;
}

.date-cell.is-end:nth-child(7n+1) {
    background: transparent !important;
}

/* 진짜 타원(Oval) 모형 띄우기 */
.date-cell.is-start::before,
.date-cell.is-end::before,
.date-cell.is-single::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #82c2e3;
    border-radius: 999px;
    z-index: -1;
    /* 글자 뒤로 밀어넣기 */
}

/* 미래 날짜 차단 스타일 */
.date-cell.is-future {
    color: rgba(148, 163, 184, 0.2);
    cursor: not-allowed;
    background: transparent !important;
}

.date-popup-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 18px 18px;
}

.quick-range-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.quick-range-label {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
}

/* 빠른 선택 드롭다운 반투명 처리 */
.quick-range-select {
    min-width: 120px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 5px;
    background: #444D55;
    font-size: 12px;
    color: #fff;
    outline: none;
}

.quick-range-select:focus {
    border-color: #82c2e3 !important;
}

/* 하단 버튼 정렬 및 스타일 */
.footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.footer-btn {
    min-width: 74px;
    height: 32px;
    padding: 0 12px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 700;
}

/* 취소 버튼 스타일 */
.footer-btn.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* 적용 버튼 테마색 지정 */
.footer-btn.primary {
    background: #82c2e3;
    color: #222;
}

.footer-btn.primary:hover {
    filter: brightness(1.1);
}
</style>