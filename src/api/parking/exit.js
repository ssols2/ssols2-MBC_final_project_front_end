import axios from 'axios'

const url = 'http://localhost:8004/api/parking-payment'
const javaUrl = 'http://localhost:8080/parking-log'     // [추가] 자바 백엔드 주소

// 출차 요금 및 정보 조회 - 자바 연동
// 매핑: 자바 @PostMapping("/exit")
export const getExitFeeByOcrReq = (file) => {
  // 이미지는 JSON이 아니라 FormData로 감싸서 보내야 FastAPI UploadFile이 인식함 -> 자바 MultipartFile이 인식함
  const formData = new FormData()
  formData.append('file', file)
  
  // 자바(8080)로 사진을 보냄
  return axios.post(`${javaUrl}/exit`, formData, {
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

// 자바 서버(ACR122U 리더기)에 카드 UID 읽기 요청
// 매핑: 자바 @PostMapping("/api/nfc/read")
export const readNfcCardReq = () => {
  return axios.post(`http://localhost:8080/api/nfc/read`)
}