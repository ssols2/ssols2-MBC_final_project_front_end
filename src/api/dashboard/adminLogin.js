import axios from 'axios'

const javaUrl = 'http://localhost:8080/admin'

// ==========================================
// 1. 사원번호 찾기 API (Java 연동)
// ==========================================
export const findAdminIdReq = (data) => {
    return axios.post(`${javaUrl}/find-id`, data)
}

// ==========================================
// 2. 관리자 로그인 인증 API (Java 연동)
// ==========================================
export const loginAdminReq = (data) => {
    return axios.post(`${javaUrl}/dashboard-login`, data)
}