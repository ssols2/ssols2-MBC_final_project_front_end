// src/api/payment/stats.js
// 관리자 대시보드 - 요금 정산 관리 화면
import axios from 'axios'

const PYTHON_API_URL = 'http://localhost:8004/api/admin-payment'

export const paymentApi = {
  // ================= [탭 1] 매출 통계 현황 =================

  // ── 1. 상단 요약 카드 데이터 ──
  getRevenueSummary(startDate, endDate) {
    return axios.get(`${PYTHON_API_URL}/revenue-summary`, {
      params: { 
        start_date: startDate, 
        end_date: endDate 
      }
    })
  },

  // ── 2. 중앙 매출 추이 그래프 데이터 ──
  getRevenueChart(viewType, startDate, endDate) {
    return axios.get(`${PYTHON_API_URL}/revenue-chart`, {
      params: { 
        view_type: viewType, 
        start_date: startDate, 
        end_date: endDate 
      }
    })
  },

  // ── 3. 하단 상세 정산 내역 요약 테이블 ──
  getRevenueTable(startDate, endDate, skip = 0, limit = 10) {
    return axios.get(`${PYTHON_API_URL}/revenue-table`, {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        skip: skip, 
        limit: limit 
      }
    })
  },

  // ================= [탭 2] 결제 및 할인 분석 =================

  // ── 4. 중앙 영역 비율 분석 데이터 ──
  getAnalysisRatios(startDate, endDate) {
    return axios.get(`${PYTHON_API_URL}/analysis-ratios`, {
      params: { 
        start_date: startDate, 
        end_date: endDate 
      }
    })
  },

  // ── 5. 하단 영역 상세 결제/할인 로그 테이블 ──
  getPaymentLogs(startDate, endDate, skip = 0, limit = 10) {
    return axios.get(`${PYTHON_API_URL}/payment-logs`, {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        skip: skip, 
        limit: limit 
      }
    })
  }
}
