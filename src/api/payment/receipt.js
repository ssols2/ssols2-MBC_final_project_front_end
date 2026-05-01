import axios from 'axios'

const BASE_URL = 'http://localhost:8004/api/payment-receipt'

// 내 결제 내역 목록 조회
export const getMyReceiptsReq = (memId) => {
  // 기존: '/api/payment/my-receipts' -> 수정: prefix에 맞춰 경로 변경
  return axios.get(`${BASE_URL}/my-receipts`, { params: { mem_id: memId } })
}

// 차량번호 뒷자리로 영수증 목록 조회 (비회원 모달용)
export const getReceiptsByVehicleReq = (last4Digits) => {
  // 백엔드 @router.get("/receipts/{last_4_digits}") 주소와 매칭
  return axios.get(`${BASE_URL}/receipts/${last4Digits}`)
}
