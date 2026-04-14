import axios from 'axios'

const url = 'http://localhost:8004/api/payment-methods'

// 1. 결제 수단 등록 (Create)
export const addPaymentReq = (data) => {
  return axios.post(url, data)
}

// 2. 결제 수단 목록 조회 (Read)
export const getPaymentReq = (memId) => {
  return axios.get(`${url}/${memId}`)
}

// 3. 대표 결제 수단 설정 (Update)
export const setDefaultPaymentReq = (methodId) => {
  return axios.put(`${url}/${methodId}`, { is_default: true })
}

// 4. 결제 수단 삭제 (Delete)
export const delPaymentReq = (methodId) => {
  return axios.delete(`${url}/${methodId}`)
}