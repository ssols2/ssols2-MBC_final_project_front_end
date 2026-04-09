import axios from 'axios'

const url = 'http://localhost:8000/api/parking-payment'

// 1. 출차 요금 및 정보 조회 (파이썬 calculate_exit_fee 실행)
export const getExitFeeReq = (plateNum) => {
  return axios.post(`${url}/exit`, { vehicle_num: plateNum })
}

// 2. 출차 결제 승인 요청 (파이썬 process_exit_payment 실행)
export const processPaymentReq = (data) => {
  return axios.post(`${url}/pay`, data)
}