<template>
    <div class="control-container">
        <!-- Header -->
        <!-- <div class="page-header">
            <div class="header-title-area">
                <h2 class="page-title">출입 차량 관리</h2>
                <div class="tab-group">
                    <button class="tab-btn active">입출차 로그</button>
                    <button class="tab-btn" @click="$router.push('/dashboard/vehicle-prediction')">주차 예측 통계</button>
                </div>
            </div>
        </div> -->

        <!-- Filter bar -->
        <div class="filter-bar">
            <div class="date-range-wrap">
                <div class="date-range" @click="showDatePicker = !showDatePicker">
                    <span class="date-display">{{ dateRangeLabel }}</span>
                    <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <!-- Date Picker Dropdown -->
                <div v-if="showDatePicker" class="datepicker-dropdown">
                    <div class="dp-presets">
                        <button v-for="p in datePresets" :key="p.label" class="dp-preset-btn" @click="applyPreset(p)">{{ p.label }}</button>
                    </div>
                    <div class="dp-custom">
                        <input type="date" v-model="tempStart" class="dp-input" />
                        <span class="dp-sep">-</span>
                        <input type="date" v-model="tempEnd" class="dp-input" />
                    </div>
                    <div class="dp-actions">
                        <button class="dp-btn apply" @click="applyDateRange">적용</button>
                        <button class="dp-btn cancel" @click="showDatePicker = false">취소</button>
                    </div>
                </div>
            </div>
            <div class="search-box">
                <input type="text" v-model="searchQuery" placeholder="차량번호 검색(예: 12가 4567)" @keyup.enter="executeSearch" />
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" @click="executeSearch"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
        </div>

        <!-- ======================== 검색 모드 ======================== -->
        <template v-if="searchActive">
            <div class="search-result-area">
                <!-- 좌: 검색 결과 목록 -->
                <div class="search-list-panel">
                    <h3 class="panel-title">"{{ searchedQuery }}" 검색 결과</h3>
                    <div v-for="item in searchResults" :key="item.vehicleNum"
                        class="search-item" :class="{ selected: selectedVehicle?.vehicleNum === item.vehicleNum }"
                        @click="selectVehicle(item)">
                        <span class="si-check" v-if="selectedVehicle?.vehicleNum === item.vehicleNum">&#10003;</span>
                        <span class="si-plate">{{ item.vehicleNum }}</span>
                        <span class="si-badge" :class="item.isMember ? 'badge-member' : 'badge-guest'">{{ item.isMember ? '회원' : '비회원' }}</span>
                        <span class="si-status">{{ item.statusText }}</span>
                    </div>
                    <div v-if="searchResults.length === 0" class="search-empty">검색 결과가 없습니다.</div>
                </div>

                <!-- 우: 선택된 차량 상세 -->
                <div class="search-detail-panel" v-if="selectedVehicle">
                    <div class="detail-images">
                        <img v-if="selectedVehicle.vehicleImg" :src="`${backendUrl}${selectedVehicle.vehicleImg}`" class="detail-car-img" />
                        <div v-else class="no-detail-img">No Image</div>
                        <img v-if="selectedVehicle.licensePlateImg" :src="`${backendUrl}${selectedVehicle.licensePlateImg}`" class="detail-plate-img" />
                        <div v-else class="no-detail-img">No Image</div>
                    </div>
                    <table class="detail-info-table">
                        <tbody>
                            <tr><th>국가</th><td>{{ countryName(selectedVehicle.licensePlateCountry) }}</td></tr>
                            <tr><th>회원여부</th><td>{{ selectedVehicle.memberName || (selectedVehicle.isMember ? 'Y' : 'N') }}</td></tr>
                            <tr><th>차량번호</th><td class="text-blue">{{ selectedVehicle.vehicleNum }}</td></tr>
                            <tr><th>입차시간</th><td>{{ formatDT(selectedVehicle.entryTime) }}</td></tr>
                            <tr><th>출차시간</th><td>{{ selectedVehicle.exitTime ? formatDT(selectedVehicle.exitTime) : '—' }}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 검색 차량 히스토리 테이블 -->
            <div class="table-card full-width">
                <div class="table-header">
                    <div class="th-left">
                        <h3 class="card-title">입출차 기록</h3>
                        <button v-for="tab in searchTabs" :key="tab.key" class="filter-tab"
                            :class="{ active: searchTabFilter === tab.key }" @click="searchTabFilter = tab.key">
                            {{ tab.label }}({{ tab.count }})
                        </button>
                        <select v-model="statusFilter" class="dark-select"><option value="">상태</option><option value="normal">정상</option><option value="modified">수정</option><option value="error">오류</option></select>
                    </div>
                    <div class="th-right">
                        <select v-model="sortOrder" class="dark-select plain"><option value="desc">최신순</option><option value="asc">오래된순</option></select>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="dark-table">
                        <thead><tr><th>순서</th><th>입차일시</th><th>출차일시</th><th>체류시간</th><th>정확도 (국가 | OCR)</th><th>상태</th><th>처리담당자</th><th>처리</th></tr></thead>
                        <tbody>
                            <tr v-if="pagedSearchHistory.length === 0"><td colspan="8" class="empty-msg">데이터가 없습니다.</td></tr>
                            <tr v-for="(log, idx) in pagedSearchHistory" :key="log.parkingLogId">
                                <td>{{ (currentPage - 1) * rowsPerPage + idx + 1 }}</td>
                                <td>{{ formatDT(log.entryTime) }}</td>
                                <td>{{ log.exitTime ? formatDT(log.exitTime) : '—' }}</td>
                                <td>{{ formatDuration(log.duration) }}</td>
                                <td>{{ accuracyText(log) }}</td>
                                <td><span class="status-dot" :class="statusDotClass(log)"></span><span :class="statusTextClass(log)">{{ statusLabel(log) }}</span></td>
                                <td>{{ log.empNumber || '—' }}</td>
                                <td class="action-cell"><button class="action-btn edit-btn" @click="openModify(log)">수정</button><button class="action-btn del-btn" @click="deleteLog(log)">삭제</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pagination" v-if="searchHistoryPages > 1">
                    <button class="page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">&#8249;</button>
                    <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
                    <button class="page-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === searchHistoryPages">&#8250;</button>
                </div>
            </div>
        </template>

        <!-- ======================== 기본 모드 ======================== -->
        <template v-else>
            <!-- Carousel -->
            <div class="carousel-section">
                <button class="carousel-arrow left" @click="scrollCarousel(-1)">&#8249;</button>
                <div class="carousel-track" ref="carouselRef">
                    <div v-for="log in recentLogs" :key="log.parkingLogId" class="carousel-card">
                        <img class="flag-overlay" :src="getFlag(log.licensePlateCountry)" />
                        <div class="carousel-images">
                            <img v-if="log.vehicleImg" :src="`${backendUrl}${log.vehicleImg}`" class="car-thumb" />
                            <div v-else class="no-thumb">No Image</div>
                            <img v-if="log.licensePlateImg" :src="`${backendUrl}${log.licensePlateImg}`" class="plate-thumb" />
                            <div v-else class="no-thumb">No Image</div>
                        </div>
                        <div class="carousel-info">
                            <div class="cinfo-row"><span class="cinfo-label">차량번호</span><span class="cinfo-value">{{ log.vehicleNum }}</span></div>
                            <div class="cinfo-row"><span class="cinfo-label">입차시간</span><span class="cinfo-value">{{ formatDT(log.entryTime) }}</span></div>
                            <div class="cinfo-row"><span class="cinfo-label">출차시간</span><span class="cinfo-value">{{ log.exitTime ? formatDT(log.exitTime) : '' }}</span></div>
                        </div>
                    </div>
                </div>
                <button class="carousel-arrow right" @click="scrollCarousel(1)">&#8250;</button>
            </div>

            <!-- Main row -->
            <div class="main-row">
                <div class="table-card">
                    <div class="table-header">
                        <div class="th-left">
                            <h3 class="card-title">입출차 기록</h3>
                            <span class="record-count">전체({{ filteredLogs.length }})</span>
                            <select v-model="countryFilter" class="dark-select"><option value="">국가</option><option value="KOR">한국</option><option value="CHN">중국</option><option value="BRA">브라질</option><option value="EUR">유럽</option><option value="IND">인도</option></select>
                            <select v-model="memberFilter" class="dark-select"><option value="">회원여부</option><option value="Y">회원</option><option value="N">비회원</option></select>
                            <select v-model="parkingFilter" class="dark-select"><option value="">주차여부</option><option value="parking">주차중</option><option value="exited">출차완료</option></select>
                            <select v-model="statusFilter" class="dark-select"><option value="">상태</option><option value="normal">정상</option><option value="modified">수정</option><option value="error">오류</option></select>
                        </div>
                        <div class="th-right"><select v-model="sortOrder" class="dark-select plain"><option value="desc">최신순</option><option value="asc">오래된순</option></select></div>
                    </div>
                    <div class="table-responsive">
                        <table class="dark-table">
                            <thead><tr><th>국가</th><th>차량번호</th><th>회원여부</th><th>입차일시</th><th>출차일시</th><th>체류시간</th><th>정확도 (국가 | OCR)</th><th>상태</th><th>처리담당자</th><th>처리</th></tr></thead>
                            <tbody>
                                <tr v-if="loading"><td colspan="10" class="empty-msg">데이터 불러오는 중...</td></tr>
                                <tr v-else-if="pagedLogs.length === 0"><td colspan="10" class="empty-msg">데이터가 없습니다.</td></tr>
                                <tr v-for="log in pagedLogs" :key="log.parkingLogId">
                                    <td><img class="flag-icon" :src="getFlag(log.licensePlateCountry)" /></td>
                                    <td class="text-white">{{ log.vehicleNum }}</td>
                                    <td>{{ log.isMember ? 'Y' : 'N' }}</td>
                                    <td>{{ formatDT(log.entryTime) }}</td>
                                    <td>{{ log.exitTime ? formatDT(log.exitTime) : '—' }}</td>
                                    <td>{{ formatDuration(log.duration) }}</td>
                                    <td>{{ accuracyText(log) }}</td>
                                    <td><span class="status-dot" :class="statusDotClass(log)"></span><span :class="statusTextClass(log)">{{ statusLabel(log) }}</span></td>
                                    <td>{{ log.empNumber || '—' }}</td>
                                    <td class="action-cell"><button class="action-btn edit-btn" @click="openModify(log)">수정</button><button class="action-btn del-btn" @click="deleteLog(log)">삭제</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" v-if="totalPages > 1">
                        <button class="page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">&#8249;</button>
                        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
                        <button class="page-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">&#8250;</button>
                    </div>
                </div>
                <!-- Sidebar -->
                <div class="sidebar">
                    <div class="sidebar-card"><h3 class="card-title">요일별 평균 체류시간</h3><canvas ref="durationChartRef"></canvas></div>
                    <div class="sidebar-card donut-wrap">
                        <h3 class="card-title">회원 / 비회원 비율</h3>
                        <div class="donut-container"><canvas ref="memberChartRef"></canvas><div class="donut-center">총 {{ allLogs.length }}명</div></div>
                        <div class="donut-legend">
                            <span class="legend-item"><span class="dot orange"></span> 회원 {{ memberCount }}명 ({{ memberPct }}%)</span>
                            <span class="legend-item"><span class="dot blue"></span> 비회원 {{ guestCount }}명 ({{ guestPct }}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- ======================== 수정 모달 ======================== -->
        <div v-if="editModal.show" class="modal-overlay" @click.self="editModal.show = false">
            <div class="modal-box">
                <div class="modal-images">
                    <img v-if="editModal.data.vehicleImg" :src="`${backendUrl}${editModal.data.vehicleImg}`" class="modal-car-img" />
                    <div v-else class="modal-no-img">No Image</div>
                    <img v-if="editModal.data.licensePlateImg" :src="`${backendUrl}${editModal.data.licensePlateImg}`" class="modal-plate-img" />
                    <div v-else class="modal-no-img">No Image</div>
                </div>
                <div class="modal-form">
                    <div class="form-row"><label>회원여부</label><input type="text" v-model="editModal.data.memberName" class="form-input" readonly /></div>
                    <div class="form-row">
                        <label>국가</label>
                        <select v-model="editModal.data.licensePlateCountry" class="form-select">
                            <option value="KOR">대한민국</option>
                            <option value="CHN">중국</option>
                            <option value="IND">인도</option>
                            <option value="BRA">브라질</option>
                            <option value="EUR">유럽</option>
                        </select>
                    </div>
                    <div class="form-row"><label>차량번호</label><input type="text" v-model="editModal.data.vehicleNum" class="form-input" /></div>
                    <div class="form-row"><label>입차일시</label><input type="datetime-local" v-model="editModal.data.entryTimeLocal" class="form-input" /></div>
                    <div class="form-row"><label>출차일시</label><input type="datetime-local" v-model="editModal.data.exitTimeLocal" class="form-input" /></div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn save" @click="submitModify">수정</button>
                    <button class="modal-btn delete" @click="submitDelete">삭제</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import axios from 'axios'

const backendUrl = 'http://localhost:8080'

// ── 국가 ─────────────────────────────────────────────
const FLAG_MAP = { KOR:'https://flagcdn.com/w40/kr.png', CHN:'https://flagcdn.com/w40/cn.png', BRA:'https://flagcdn.com/w40/br.png', EUR:'https://flagcdn.com/w40/eu.png', IND:'https://flagcdn.com/w40/in.png' }
const COUNTRY_NAMES = { KOR:'대한민국', CHN:'중국', BRA:'브라질', EUR:'유럽', IND:'인도' }
const getFlag = (code) => FLAG_MAP[code] || FLAG_MAP['KOR']
const countryName = (code) => COUNTRY_NAMES[code] || code

// ── 공통 상태 ────────────────────────────────────────
const loading = ref(false)
const allLogs = ref([])
const sortOrder = ref('desc')
const statusFilter = ref('')
const currentPage = ref(1)
const rowsPerPage = 7

// ── 날짜 ─────────────────────────────────────────────
const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const today = new Date()
const startDate = ref(fmtDate(new Date(today.getFullYear(), today.getMonth()-1, today.getDate())))
const endDate = ref(fmtDate(today))
const showDatePicker = ref(false)
const tempStart = ref(startDate.value)
const tempEnd = ref(endDate.value)

const dateRangeLabel = computed(() => {
    return `${startDate.value.slice(2).replace(/-/g,'.')} - ${endDate.value.slice(2).replace(/-/g,'.')}`
})

const datePresets = [
    { label: '오늘', fn: () => { const t=fmtDate(today); return [t,t] } },
    { label: '어제', fn: () => { const d=new Date(today); d.setDate(d.getDate()-1); const s=fmtDate(d); return [s,s] } },
    { label: '최근 7일', fn: () => { const d=new Date(today); d.setDate(d.getDate()-6); return [fmtDate(d),fmtDate(today)] } },
    { label: '최근 30일', fn: () => { const d=new Date(today); d.setDate(d.getDate()-29); return [fmtDate(d),fmtDate(today)] } },
    { label: '이번 달', fn: () => [fmtDate(new Date(today.getFullYear(),today.getMonth(),1)), fmtDate(today)] },
    { label: '지난 달', fn: () => { const f=new Date(today.getFullYear(),today.getMonth()-1,1); const l=new Date(today.getFullYear(),today.getMonth(),0); return [fmtDate(f),fmtDate(l)] } },
]
const applyPreset = (p) => { const [s,e] = p.fn(); tempStart.value=s; tempEnd.value=e }
const applyDateRange = () => { startDate.value=tempStart.value; endDate.value=tempEnd.value; showDatePicker.value=false; fetchLogs() }

// ── 기본 모드 필터 ───────────────────────────────────
const countryFilter = ref('')
const memberFilter = ref('')
const parkingFilter = ref('')

const filteredLogs = computed(() => {
    let rows = [...allLogs.value]
    if (startDate.value) { const s=new Date(startDate.value+'T00:00:00'); rows=rows.filter(r=>r.entryTime&&new Date(r.entryTime)>=s) }
    if (endDate.value) { const e=new Date(endDate.value+'T23:59:59'); rows=rows.filter(r=>r.entryTime&&new Date(r.entryTime)<=e) }
    if (countryFilter.value) rows=rows.filter(r=>r.licensePlateCountry===countryFilter.value)
    if (memberFilter.value==='Y') rows=rows.filter(r=>r.isMember)
    if (memberFilter.value==='N') rows=rows.filter(r=>!r.isMember)
    if (parkingFilter.value==='parking') rows=rows.filter(r=>!r.exitTime)
    if (parkingFilter.value==='exited') rows=rows.filter(r=>r.exitTime)
    if (statusFilter.value==='modified') rows=rows.filter(r=>r.isModified)
    if (statusFilter.value==='normal') rows=rows.filter(r=>!r.isModified)
    rows.sort((a,b)=>{ const ta=new Date(a.entryTime||0).getTime(),tb=new Date(b.entryTime||0).getTime(); return sortOrder.value==='desc'?tb-ta:ta-tb })
    return rows
})

const totalPages = computed(()=>Math.max(1,Math.ceil(filteredLogs.value.length/rowsPerPage)))
const pagedLogs = computed(()=>{ const s=(currentPage.value-1)*rowsPerPage; return filteredLogs.value.slice(s,s+rowsPerPage) })

// ── 검색 모드 ────────────────────────────────────────
const searchQuery = ref('')
const searchedQuery = ref('')
const searchActive = ref(false)
const searchResults = ref([])
const selectedVehicle = ref(null)
const searchTabFilter = ref('all')

const executeSearch = () => {
    const q = searchQuery.value.replace(/\s/g,'')
    if (!q) { searchActive.value=false; return }
    searchedQuery.value = q
    searchActive.value = true
    currentPage.value = 1

    // 검색어 포함하는 차량번호 그룹화
    const matched = allLogs.value.filter(r => r.vehicleNum && r.vehicleNum.replace(/\s/g,'').includes(q))
    const grouped = {}
    matched.forEach(log => {
        const num = log.vehicleNum
        if (!grouped[num]) grouped[num] = []
        grouped[num].push(log)
    })

    searchResults.value = Object.entries(grouped).map(([num, logs]) => {
        const latest = logs.sort((a,b) => new Date(b.entryTime||0)-new Date(a.entryTime||0))[0]
        let statusText = ''
        if (!latest.exitTime) {
            const mins = Math.floor((Date.now()-new Date(latest.entryTime).getTime())/60000)
            statusText = `현재 ${Math.floor(mins/60)}시간 ${mins%60}분 주차중`
        } else {
            const diff = Math.floor((Date.now()-new Date(latest.exitTime).getTime())/86400000)
            if (diff === 0) statusText = `오늘 ${new Date(latest.exitTime).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 출차`
            else statusText = `${diff}일 전 출차`
        }
        return { vehicleNum: num, isMember: latest.isMember, statusText, logs, ...latest }
    })

    if (searchResults.value.length > 0) selectVehicle(searchResults.value[0])
}

const selectVehicle = (item) => { selectedVehicle.value = item; currentPage.value = 1 }

const selectedHistory = computed(() => {
    if (!selectedVehicle.value) return []
    let rows = [...selectedVehicle.value.logs]
    if (searchTabFilter.value==='entry') rows=rows.filter(r=>!r.exitTime)
    if (searchTabFilter.value==='exit') rows=rows.filter(r=>r.exitTime)
    if (searchTabFilter.value==='noExit') rows=rows.filter(r=>!r.exitTime)
    if (statusFilter.value==='modified') rows=rows.filter(r=>r.isModified)
    if (statusFilter.value==='normal') rows=rows.filter(r=>!r.isModified)
    rows.sort((a,b)=>{ const ta=new Date(a.entryTime||0).getTime(),tb=new Date(b.entryTime||0).getTime(); return sortOrder.value==='desc'?tb-ta:ta-tb })
    return rows
})

const searchTabs = computed(() => {
    if (!selectedVehicle.value) return []
    const logs = selectedVehicle.value.logs
    return [
        { key:'all', label:'전체', count: logs.length },
        { key:'entry', label:'입차', count: logs.filter(r=>!r.exitTime).length },
        { key:'exit', label:'출차', count: logs.filter(r=>r.exitTime).length },
        { key:'noExit', label:'미출차', count: logs.filter(r=>!r.exitTime).length },
    ]
})

const searchHistoryPages = computed(()=>Math.max(1,Math.ceil(selectedHistory.value.length/rowsPerPage)))
const pagedSearchHistory = computed(()=>{ const s=(currentPage.value-1)*rowsPerPage; return selectedHistory.value.slice(s,s+rowsPerPage) })

// ── 페이지네이션 공통 ────────────────────────────────
const pageNumbers = computed(() => {
    const total = searchActive.value ? searchHistoryPages.value : totalPages.value
    const cur = currentPage.value
    const arr = []; const left = Math.max(1,cur-4); const right = Math.min(total,left+9)
    for (let i=left;i<=right;i++) arr.push(i)
    return arr
})
const goToPage = (p) => { const max = searchActive.value ? searchHistoryPages.value : totalPages.value; if(p>=1&&p<=max) currentPage.value=p }
watch([countryFilter, memberFilter, parkingFilter, statusFilter, sortOrder, searchTabFilter], ()=>{ currentPage.value=1 })

// ── 수정 모달 ────────────────────────────────────────
const editModal = reactive({ show: false, data: {} })

const toLocalDT = (dt) => { if(!dt) return ''; const d=new Date(dt); const off=d.getTimezoneOffset()*60000; return new Date(d-off).toISOString().slice(0,16) }

const openModify = (log) => {
    editModal.data = {
        parkingLogId: log.parkingLogId,
        vehicleImg: log.vehicleImg,
        licensePlateImg: log.licensePlateImg,
        memberName: log.isMember ? (log.empNumber || 'Y') : 'N',
        licensePlateCountry: log.licensePlateCountry || 'KOR',
        vehicleNum: log.vehicleNum,
        entryTimeLocal: toLocalDT(log.entryTime),
        exitTimeLocal: toLocalDT(log.exitTime),
    }
    editModal.show = true
}

const submitModify = async () => {
    try {
        await axios.put(`${backendUrl}/parking-log/update`, {
            parkingLogId: editModal.data.parkingLogId,
            vehicleNum: editModal.data.vehicleNum,
            licensePlateCountry: editModal.data.licensePlateCountry,
            adminStaffId: 1
        })
        alert('수정 완료')
        editModal.show = false
        fetchLogs()
        if (searchActive.value) executeSearch()
    } catch { alert('수정 실패') }
}

const submitDelete = async () => {
    if (!confirm(`${editModal.data.vehicleNum} 기록을 삭제하시겠습니까?`)) return
    try {
        await axios.delete(`${backendUrl}/parking-log/delete/${editModal.data.parkingLogId}`, {
            params: { adminStaffId: 1 }
        })
        alert('삭제 완료')
        editModal.show = false
        fetchLogs()
        if (searchActive.value) executeSearch()
    } catch { alert('삭제 실패') }
}

const deleteLog = async (log) => {
    if (!confirm(`${log.vehicleNum} 기록을 삭제하시겠습니까?`)) return
    try {
        await axios.delete(`${backendUrl}/parking-log/delete/${log.parkingLogId}`, {
            params: { adminStaffId: 1 }
        })
        alert('삭제 완료')
        fetchLogs()
        if (searchActive.value) executeSearch()
    } catch { alert('삭제 실패') }
}

// ── 데이터 로드 ──────────────────────────────────────
const fetchLogs = async () => {
    loading.value = true
    try {
        const res = await axios.get(`${backendUrl}/parking-log/logs`)
        allLogs.value = res.data || []
        currentPage.value = 1
        await nextTick()
        if (!searchActive.value) renderCharts()
    } catch (e) { console.error('로그 조회 실패:', e) }
    finally { loading.value = false }
}

// ── 유틸 ─────────────────────────────────────────────
const formatDT = (dt) => { if(!dt)return''; const d=new Date(dt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}` }
const formatDuration = (m) => { if(m==null||m<=0)return'—'; return `${Math.floor(m/60)}:${String(Math.round(m%60)).padStart(2,'0')}` }
const accuracyText = (log) => `${Math.round(log.countryAccuracy||0)}% | ${Math.round(log.ocrAccuracy||0)}%`
const statusLabel = (log) => log.isModified ? '수정' : '정상'
const statusDotClass = (log) => log.isModified ? 'bg-yellow' : 'bg-green'
const statusTextClass = (log) => log.isModified ? 'text-yellow' : 'text-green'

// ── 캐러셀 ───────────────────────────────────────────
const carouselRef = ref(null)
const recentLogs = computed(() => allLogs.value.slice(0, 10))
const scrollCarousel = (dir) => { if(carouselRef.value) carouselRef.value.scrollBy({left:dir*420,behavior:'smooth'}) }

// ── 통계 ─────────────────────────────────────────────
const memberCount = computed(()=>allLogs.value.filter(r=>r.isMember).length)
const guestCount = computed(()=>allLogs.value.filter(r=>!r.isMember).length)
const memberPct = computed(()=>allLogs.value.length>0?Math.round(memberCount.value/allLogs.value.length*100):0)
const guestPct = computed(()=>allLogs.value.length>0?100-memberPct.value:0)

// ── 차트 ─────────────────────────────────────────────
const durationChartRef = ref(null)
const memberChartRef = ref(null)
let durationChart = null, memberChart = null
const DOW = ['월','화','수','목','금','토','일']

const renderCharts = () => {
    const dowTotals=new Array(7).fill(0), dowCounts=new Array(7).fill(0)
    allLogs.value.forEach(log=>{ if(log.duration&&log.entryTime){ const idx=(new Date(log.entryTime).getDay()+6)%7; dowTotals[idx]+=log.duration; dowCounts[idx]++ }})
    const dowAvg=dowTotals.map((t,i)=>dowCounts[i]>0?Math.round(t/dowCounts[i]):0)

    if(durationChart)durationChart.destroy()
    if(durationChartRef.value){
        durationChart=new Chart(durationChartRef.value,{type:'bar',data:{labels:DOW,datasets:[{data:dowAvg,backgroundColor:['#fbb900','#fbb900','#fbb900','#fbb900','#fbb900','#60a5fa','#ef4444'],borderRadius:4,barPercentage:0.6}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.x}분`}}},scales:{x:{beginAtZero:true,ticks:{color:'#a1a1aa'},grid:{color:'rgba(255,255,255,0.05)'}},y:{ticks:{color:'#d4d4d8'},grid:{display:false}}}}})
    }
    if(memberChart)memberChart.destroy()
    if(memberChartRef.value){
        memberChart=new Chart(memberChartRef.value,{type:'doughnut',data:{labels:['회원','비회원'],datasets:[{data:[memberCount.value,guestCount.value],backgroundColor:['#fbb900','#3b82f6'],borderWidth:0}]},
        options:{responsive:true,maintainAspectRatio:true,cutout:'65%',plugins:{legend:{display:false}}}})
    }
}

onMounted(()=>fetchLogs())
onUnmounted(()=>{ if(durationChart)durationChart.destroy(); if(memberChart)memberChart.destroy() })
</script>

<style scoped>
.control-container { width:100%;height:100vh;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:20px;padding:22px;background-color:#000;color:#f5f5f5;box-sizing:border-box; }
.control-container::-webkit-scrollbar{width:10px}.control-container::-webkit-scrollbar-track{background:transparent}.control-container::-webkit-scrollbar-thumb{background:#444D56;border-radius:4px}

/* Header */
.page-header{margin-bottom:17px}.header-title-area{display:flex;align-items:center;gap:20px}.page-title{font-size:22px;font-weight:700;margin:0}
.tab-group{display:flex;background:#27272a;border-radius:8px;padding:4px}.tab-btn{padding:6px 16px;border:none;background:transparent;color:#a1a1aa;cursor:pointer;border-radius:6px;font-size:14px;font-weight:600;transition:0.2s}.tab-btn.active{background:#3b82f6;color:#fff}

/* Filter bar */
.filter-bar{display:flex;gap:12px;margin-bottom:20px;position:relative}
.date-range-wrap{position:relative}
.date-range{display:flex;align-items:center;background:#18181b;border:1px solid #27272a;border-radius:8px;padding:8px 14px;gap:8px;cursor:pointer;min-width:200px}
.date-display{color:#d4d4d8;font-size:13px}.calendar-icon{width:16px;height:16px;color:#71717a;flex-shrink:0}
.search-box{display:flex;align-items:center;background:#18181b;border:1px solid #3f3f46;border-radius:6px;padding:8px 12px}
.search-box input{background:transparent;border:none;color:#fff;outline:none;width:220px;font-size:14px}.search-box input::placeholder{color:#52525b}.search-icon{width:16px;height:16px;color:#a1a1aa;cursor:pointer}

/* Date picker */
.datepicker-dropdown{position:absolute;top:100%;left:0;margin-top:6px;background:#1f1f23;border:1px solid #3f3f46;border-radius:12px;padding:16px;z-index:100;min-width:320px;box-shadow:0 12px 40px rgba(0,0,0,0.6)}
.dp-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.dp-preset-btn{background:#27272a;border:1px solid #3f3f46;color:#d4d4d8;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;transition:0.2s}.dp-preset-btn:hover{background:#3b82f6;color:#fff;border-color:#3b82f6}
.dp-custom{display:flex;align-items:center;gap:8px;margin-bottom:14px}.dp-sep{color:#52525b}
.dp-input{background:#27272a;border:1px solid #3f3f46;color:#e4e4e7;padding:6px 10px;border-radius:6px;font-size:13px;outline:none}
.dp-input::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.5}
.dp-actions{display:flex;gap:8px;justify-content:flex-end}
.dp-btn{padding:6px 20px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}.dp-btn.apply{background:#3b82f6;color:#fff}.dp-btn.cancel{background:#27272a;color:#d4d4d8;border:1px solid #3f3f46}

/* Search mode */
.search-result-area{display:flex;gap:16px;margin-bottom:20px;min-height:280px}
.search-list-panel{width:380px;flex-shrink:0;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;overflow-y:auto;max-height:340px}
.panel-title{font-size:14px;color:#a1a1aa;margin:0 0 12px}
.search-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid transparent;margin-bottom:6px;transition:0.15s}
.search-item:hover{background:#27272a}.search-item.selected{background:#1e293b;border-color:#3b82f6}
.si-check{color:#3b82f6;font-weight:700;font-size:14px;width:18px}.si-plate{font-size:15px;font-weight:700;color:#e4e4e7;min-width:100px}
.si-badge{font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600}
.badge-member{background:#1e3a2f;color:#22c55e}.badge-guest{background:#3b2a1a;color:#fbb900}
.si-status{font-size:12px;color:#71717a;margin-left:auto;white-space:nowrap}
.search-empty{color:#52525b;text-align:center;padding:30px 0}

.search-detail-panel{flex:1;background:#18181b;border:1px solid #27272a;border-radius:12px;display:flex;overflow:hidden}
.detail-images{display:flex;width:55%}
.detail-car-img,.detail-plate-img{width:50%;height:100%;object-fit:cover;min-height:240px}
.no-detail-img{width:50%;display:flex;align-items:center;justify-content:center;background:#27272a;color:#52525b}
.detail-info-table{width:45%;border-collapse:collapse}
.detail-info-table th{text-align:left;padding:16px 14px;color:#a1a1aa;font-size:13px;font-weight:600;border-bottom:1px solid #27272a;width:80px}
.detail-info-table td{padding:16px 14px;color:#e4e4e7;font-size:14px;font-weight:600;border-bottom:1px solid #27272a}

/* Filter tabs */
.filter-tab{background:#27272a;border:1px solid #3f3f46;color:#a1a1aa;padding:4px 12px;border-radius:15px;font-size:12px;cursor:pointer;transition:0.2s}.filter-tab.active{background:#3b82f6;border-color:#3b82f6;color:#fff}

/* Table */
.full-width{width:100%}
.table-card{flex:1;background:#18181b;border-radius:12px;padding:20px;border:1px solid #27272a;min-width:0;display:flex;flex-direction:column}
.table-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.th-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.th-right{display:flex;align-items:center}
.card-title{font-size:16px;font-weight:700;margin:0}.record-count{background:#27272a;padding:4px 12px;border-radius:15px;font-size:12px;color:#a1a1aa}
.dark-select{background:#27272a;border:1px solid #3f3f46;color:#d4d4d8;padding:5px 10px;border-radius:6px;font-size:12px;outline:none}.dark-select.plain{background:transparent;border:none}
.table-responsive{width:100%;overflow-x:auto;flex:1}
.dark-table{width:100%;border-collapse:collapse;font-size:13px}.dark-table th{background:#1f1f23;color:#a1a1aa;font-weight:600;padding:12px 10px;text-align:center;border-bottom:1px solid #27272a;white-space:nowrap}.dark-table td{padding:12px 10px;text-align:center;border-bottom:1px solid #27272a;color:#e4e4e7;white-space:nowrap}
.text-white{color:#fff;font-weight:600}.text-blue{color:#60a5fa;font-weight:600}.empty-msg{padding:40px!important;color:#52525b!important}
.flag-icon{width:28px;height:20px;object-fit:cover;border-radius:3px;vertical-align:middle}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}.bg-green{background:#22c55e}.bg-yellow{background:#eab308}.bg-red{background:#ef4444}.text-green{color:#22c55e}.text-yellow{color:#eab308}.text-red{color:#ef4444}
.action-cell{display:flex;gap:6px;justify-content:center}
.action-btn{padding:4px 12px;border-radius:4px;border:none;cursor:pointer;font-size:12px;font-weight:600}.edit-btn{background:#3b82f6;color:#fff}.edit-btn:hover{background:#2563eb}.del-btn{background:transparent;border:1px solid #ef4444;color:#ef4444}.del-btn:hover{background:#ef4444;color:#fff}
.pagination{display:flex;justify-content:center;gap:6px;margin-top:18px}.page-btn{background:transparent;border:1px solid #3f3f46;color:#a1a1aa;min-width:32px;height:32px;border-radius:6px;cursor:pointer;transition:0.2s}.page-btn:hover:not(:disabled){border-color:#82c2e3;color:#82c2e3}.page-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}.page-btn:disabled{opacity:0.3;cursor:not-allowed}

/* Carousel */
.carousel-section{position:relative;display:flex;align-items:center;gap:8px;margin-bottom:20px}
.carousel-track{display:flex;gap:16px;overflow-x:hidden;scroll-behavior:smooth;flex:1;padding:4px 0}
.carousel-card{min-width:380px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;position:relative;flex-shrink:0}
.flag-overlay{position:absolute;top:10px;left:10px;width:32px;height:22px;object-fit:cover;border-radius:3px;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,0.5)}
.carousel-images{display:flex;height:160px}.car-thumb,.plate-thumb{width:50%;height:100%;object-fit:cover}.no-thumb{width:50%;height:100%;display:flex;align-items:center;justify-content:center;background:#27272a;color:#52525b;font-size:12px}
.carousel-info{padding:10px 14px}.cinfo-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #27272a;font-size:13px}.cinfo-label{color:#a1a1aa}.cinfo-value{color:#e4e4e7;font-weight:600}
.carousel-arrow{background:rgba(0,0,0,0.6);border:1px solid #3f3f46;color:#d4d4d8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.carousel-arrow:hover{background:#3b82f6;border-color:#3b82f6;color:#fff}

/* Main row & sidebar */
.main-row{display:flex;gap:20px;flex:1;min-height:0}
.sidebar{width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:20px}
.sidebar-card{background:#18181b;border-radius:12px;padding:20px;border:1px solid #27272a}.sidebar-card canvas{max-height:220px}
.donut-wrap{display:flex;flex-direction:column;align-items:center}.donut-container{position:relative;width:180px;height:180px;margin:16px auto 12px}.donut-container canvas{width:100%!important;height:100%!important}
.donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;font-weight:700;color:#e4e4e7;text-align:center}
.donut-legend{display:flex;flex-direction:column;gap:8px;font-size:13px;width:100%}.legend-item{display:flex;align-items:center;gap:8px;color:#d4d4d8}
.dot{display:inline-block;width:12px;height:12px;border-radius:3px}.dot.orange{background:#fbb900}.dot.blue{background:#3b82f6}

/* Modal */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-box{background:#1f1f23;border:1px solid #3f3f46;border-radius:16px;width:560px;max-width:90vw;overflow:hidden}
.modal-images{display:flex;height:220px}.modal-car-img,.modal-plate-img{width:50%;height:100%;object-fit:cover}.modal-no-img{width:50%;display:flex;align-items:center;justify-content:center;background:#27272a;color:#52525b}
.modal-form{padding:20px 28px}
.form-row{display:flex;align-items:center;margin-bottom:14px;gap:14px}
.form-row label{width:70px;font-size:14px;color:#a1a1aa;font-weight:600;flex-shrink:0}
.form-input,.form-select{flex:1;background:#27272a;border:1px solid #3f3f46;color:#e4e4e7;padding:10px 14px;border-radius:8px;font-size:14px;outline:none}
.form-select{cursor:pointer}.form-input:focus,.form-select:focus{border-color:#3b82f6}
.form-input::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.5}
.modal-actions{display:flex;gap:12px;padding:0 28px 24px;justify-content:center}
.modal-btn{flex:1;padding:12px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:0.2s}
.modal-btn.save{background:#60a5fa;color:#fff}.modal-btn.save:hover{background:#3b82f6}
.modal-btn.delete{background:#27272a;color:#ef4444;border:1px solid #ef4444}.modal-btn.delete:hover{background:#ef4444;color:#fff}
</style>
