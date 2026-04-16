import axios from 'axios'

const javaUrl = 'http://localhost:8080/ev-charge'       // 자바 백엔드 주소 (중계 및 검색 역할)
const pythonUrl = 'http://localhost:8004/api/ev-charge' // 파이썬 백엔드 주소 (충전 로직 및 정산)

// ==========================================
// 1. [JAVA] 전기차 번호판 사진 전송 및 OCR 인식
// 맵핑 예정: 자바 @PostMapping("/ev-charge/scan")
// ==========================================
export const scanEvPlateReq = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return axios.post(`${javaUrl}/scan`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ==========================================
// 2. [JAVA] 차량 번호 수동 검색 (4자리)
// 맵핑 예정: 자바 @PostMapping("/ev-charge/search")
// ==========================================
export const searchManualPlateReq = (data) => {
  // 프론트에서 { last_four_digits: '1234' } 형태로 보냄
  return axios.post(`${javaUrl}/search`, data)
}

// ==========================================
// 3. [PYTHON] 충전 시작 (시뮬레이션 가동 및 세션 ID 발급)
// 맵핑 예정: 파이썬 @router.post("/start")
// ==========================================
export const startEvChargeReq = (data) => {
  return axios.post(`${pythonUrl}/start`, data)
}

// ==========================================
// 4. [PYTHON] 충전 완료/중단 (최종 요금 정산 및 DB 덮어쓰기)
// 맵핑 예정: 파이썬 @router.post("/stop")
// ==========================================
export const stopEvChargeReq = (data) => {
  return axios.post(`${pythonUrl}/stop`, data)
}