<template>
  <div class="search-wrap">
    <div class="search-container">
      <header class="page-header">
        <h2>의료진 찾기</h2>
        <div class="title-bar"></div>
        <p class="page-desc">우리 병원의 전문 의료진을 확인하고 바로 예약해보세요.</p>
      </header>

      <div class="filter-box">
        <select v-model="selectedDeptId" class="search-input select-icon" @change="fetchDoctors">
          <option value="">진료과 전체 보기</option>
          <option v-for="dept in depts" :key="dept.med_dept_id" :value="dept.med_dept_id"> {{ dept.med_dept_name }}
          </option>
        </select>
        <input type="text" v-model="searchName" placeholder="의사 성함 입력" class="search-input name-input">
      </div>

      <div class="doctor-grid">
        <div v-for="doc in filteredDoctors" :key="doc.staff_id" class="doc-card">
          <div class="doc-img-area">
            <!-- 전문적인 의사 실루엣 SVG -->
            <svg class="placeholder-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="5" fill="#CBD5E1" />
              <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="#CBD5E1" stroke-width="2.5"
                stroke-linecap="round" />
              <path d="M9 13L10 16L12 17L14 16L15 13" fill="#94A3B8" />
            </svg>
            <!-- <span class="img-label">PREPARING</span> -->
          </div>
          <div class="doc-info">
            <div class="doc-header">
              <h4>{{ doc.staff_name }} <span class="doc-role">{{ doc.role }}</span></h4>
            </div>
            <div class="doc-details">
              <p>
                <span class="label">진료과</span>
                <!-- 1순위: 데이터에 있는 이름 / 2순위: 내 데이터 ID로 찾기 / 3순위: 선택된 필터 ID로 찾기 -->
                {{doc.med_dept_name ||
                  depts.find(d => d.med_dept_id == doc.med_dept_id)?.med_dept_name ||
                  depts.find(d => d.med_dept_id == selectedDeptId)?.med_dept_name ||
                  '정보 없음'}}
              </p>
              <p><span class="label">상태</span> {{ doc.status || '진료가능' }}</p>
            </div>
            <button v-if="!isEmergencyDept(doc)" @click="goToReserve(doc)" class="btn-reserve">
              진료 예약하기
            </button>
            <div v-else class="emergency-guide">
              응급실 현장 접수만 가능
            </div>
          </div>
        </div>

        <div v-if="filteredDoctors.length === 0" class="no-result">
          <p>검색 결과가 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// API 파일 가져오기 (진료과 목록 조회, 의사 목록 조회)
import { getDeptsReq, getDoctorsReq, getAllDoctorsReq } from '@/api/reservation'

// =========================================
// 1. 기본 설정 및 상태 변수 (Data)
// =========================================
const router = useRouter() // 페이지 이동 도구
const route = useRoute()   // 현재 주소 정보 (쿼리스트링 확인용)

// 검색 및 필터용 변수
const selectedDeptId = ref('') // 선택된 진료과 ID
const searchName = ref('')     // 검색창에 입력한 의사 이름

// 서버에서 받아올 데이터 저장소
const depts = ref([])      // 진료과 목록 (드롭다운용)
const allDoctors = ref([]) // 전체(혹은 해당 과) 의사 목록


// =========================================
// 2. Computed (자동 필터링 로직)
// =========================================

// 화면에 보여줄 진짜 의사만 걸러내는 필터
const filteredDoctors = computed(() => {
  return allDoctors.value.filter(doc => {
    // 검색어의 앞뒤 공백을 제거하고 소문자로 변환
    const keyword = searchName.value.trim().toLowerCase();

    // 검색어가 없으면 '의사' 역할인 분들만 모두 표시
    if (!keyword) {
      return (doc.role || '').toUpperCase() === '의사' || (doc.role || '').toUpperCase() === 'DOCTOR';
    }

    // (1) 이름 매칭 확인
    const nameMatch = (doc.staff_name || '').toLowerCase().includes(keyword);
    // (2) 진료과 이름 매칭 확인 (추가 설명 / 참고)
    const deptMatch = (doc.med_dept_name || '').toLowerCase().includes(keyword);

    // 직업이 의사인지 확인
    const role = (doc.role || '').toUpperCase();
    const isDoctor = role === '의사' || role === 'DOCTOR';

    // 이름 혹은 진료과 중 하나라도 맞고 + 의사여야 함
    return (nameMatch || deptMatch) && isDoctor;
  })
})

// =========================================
// 3. 페이지 이동 함수
// =========================================

// '예약하기' 버튼 클릭 시 실행
const goToReserve = (doc) => {
  // 예약 페이지(/reservation)로 이동하면서, 선택한 의사 정보를 쿼리로 넘겨줌
  router.push({
    path: '/reservation',
    query: {
      docId: doc.staff_id,
      docName: doc.staff_name,
      deptId: doc.med_dept_id || selectedDeptId.value,
      deptName: doc.med_dept_name
    }
  })
}

// =========================================
// 4. 서버 데이터 조회 함수
// =========================================

// (A) 초기 데이터 로딩 (진료과 목록 + 의사 목록)
const fetchData = async () => {
  try {
    // 1. 진료과 목록 가져오기 (드롭다운 채우기)
    const resDept = await getDeptsReq()
    depts.value = resDept.data

    // 2. 만약 주소창에 특정 진료과 ID가 있다면? (예: ?deptId=3)
    if (route.query.deptId) {
      selectedDeptId.value = Number(route.query.deptId) // 드롭다운 값 세팅
      await fetchDoctors() // 그 과의 의사만 가져옴
    } else {
      await fetchDoctors() // 전체 의사 가져옴
    }
  } catch (err) {
    console.error('데이터 로드 실패')
  }
}

// (B) 의사 목록 가져오기 (진료과 선택 변경 시에도 실행됨)
const fetchDoctors = async () => {
  try {
    let res;
    // 진료과가 선택되어 있으면 -> 그 과 의사만 조회
    if (selectedDeptId.value) {
      res = await getDoctorsReq(selectedDeptId.value)
    }
    // 선택 안 되어 있으면 -> 전체 의사 조회
    else {
      res = await getAllDoctorsReq()
    }
    allDoctors.value = res.data // 받아온 데이터를 변수에 저장
  } catch (err) {
    console.error('의료진 로드 실패')
    allDoctors.value = [] // 에러나면 빈 목록으로 초기화
  }
}

// 외부(메가메뉴 등) 검색어 수신 로직
// 주소창의 쿼리 파라미터(q)가 바뀔 때마다 실행됨
watch(() => route.query.q, (newKeyword) => {
  if (newKeyword !== undefined) {
    searchName.value = newKeyword;
  }
}, { immediate: true }); // immediate: true를 주면 페이지 처음 들어올 때도 바로 실행함

// 최종 프로젝트 추가
const isEmergencyDept = (doc) => {
  // 데이터에 이름이 바로 있으면 체크
  if (doc.med_dept_name && doc.med_dept_name.includes('응급')) return true;

  // 내 데이터의 ID 혹은 현재 필터링된 부서 ID로 부서 찾기
  const targetId = doc.med_dept_id || selectedDeptId.value;
  const foundDept = depts.value.find(d => d.med_dept_id == targetId);

  if (foundDept && foundDept.med_dept_name.includes('응급')) return true;

  // (보험용) 의사 성함에 '응급'이 들어있는지도 체크
  if (doc.staff_name && doc.staff_name.includes('응급')) return true;

  return false;
}

// =========================================
// 5. 페이지 시작 (Life Cycle)
// =========================================

// 화면이 다 그려지자마자 fetchData 함수 실행!
onMounted(fetchData)
</script>

<style scoped>
.search-wrap {
  background-color: #ffffff;
  min-height: 100vh;
  padding: 60px 20px;
}

.search-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 50px;
}

.page-header h2 {
  font-size: 42px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 800;
}

.title-bar {
  width: 120px;
  height: 3px;
  background: #005baa;
  margin: 0 auto 15px;
}

.page-desc {
  color: #666;
  font-size: 18px;
}

.filter-box {
  display: flex;
  gap: 15px;
  margin-bottom: 40px;
  background: #fff;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #eee;
}

.search-input {
  flex: 1;
  padding: 15px;
  border: 1px solid #ddd;
  font-size: 15px;
  color: #4e4e4e;
  transition: 0.3s;
  background-color: #f9f9f9;
}

.search-input:focus {
  border-color: #005baa;
  outline: none;
  background-color: #fff;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 25px;
}

.doc-card {
  background: #fff;
  border: 1px solid #eee;
  padding: 25px;
  display: flex;
  gap: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  align-items: center;
}

.doc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(1, 113, 233, 0.08);
}

.doc-img-area {
  width: 110px;
  height: 130px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
}

.placeholder-svg {
  width: 80px;
  height: 80px;
  margin-bottom: 5px;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.doc-card:hover .placeholder-svg {
  transform: scale(1.1);
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-header h4 {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-role {
  font-size: 13px;
  color: #005baa;
  background: #e0f2fe;
  padding: 3px 8px;
  font-weight: 600;
}

.doc-details p {
  margin: 0;
  font-size: 15px;
  color: #555;
  line-height: 1.5;
}

.doc-details .label {
  color: #005baa;
  font-weight: 600;
  margin-right: 8px;
  display: inline-block;
  width: 60px;
}

.btn-reserve {
  margin-top: 10px;
  padding: 12px;
  width: 100%;
  background: #005baa;
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.no-result {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.emergency-guide {
  margin-top: 10px;
  padding: 10px;
  background: #fff5f5;
  color: #e03131;
  border: 1px solid #ffc9c9;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
</style>