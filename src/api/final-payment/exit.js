import axios from 'axios'

const url = 'http://localhost:8000/api/parking-payment'

// 출차 요금 및 정보 조회 (수동 번호 입력 - 테스트)
// 매핑: 파이썬 @router.post("/exit")
export const getExitFeeReq = (plateNum) => {
  // 백엔드 ExitSearchRequest 스키마에 맞춰 { vehicle_num: "번호" } 형태로 전송
  return axios.post(`${url}/exit`, { vehicle_num: plateNum })
}

// 출차 요금 및 정보 조회 (OCR 카메라 인식 - 추후 연동용)
// 매핑: 파이썬 @router.post("/exit/ocr")
export const getExitFeeByOcrReq = (file) => {
  // 이미지는 JSON이 아니라 FormData로 감싸서 보내야 FastAPI UploadFile이 인식함
  const formData = new FormData()
  formData.append('file', file)
  
  return axios.post(`${url}/exit/ocr`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 출차 결제 승인 요청 및 영수증 발급
// 매핑: 파이썬 @router.post("/pay")
export const processPaymentReq = (data) => {
  // 프론트에서 만든 결제 정보 객체를 그대로 전송
  return axios.post(`${url}/pay`, data)
}