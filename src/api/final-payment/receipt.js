import axios from 'axios'

const BASE_URL = 'http://localhost:8004/api/payment-receipt'

// 내 결제 내역 목록 조회
export const getMyReceiptsReq = (memId) => {
  // 기존: '/api/payment/my-receipts' -> 수정: prefix에 맞춰 경로 변경
  return axios.get(`${BASE_URL}/my-receipts`, { params: { mem_id: memId } })
}

// 영수증 단건 상세 조회 (모바일 QR용)
export const getReceiptDetailReq = (approvalNumber) => {
  // 기존: `/api/payment/receipt/${approvalNumber}` -> 수정: prefix 반영
  return axios.get(`${BASE_URL}/receipt/${approvalNumber}`)
}