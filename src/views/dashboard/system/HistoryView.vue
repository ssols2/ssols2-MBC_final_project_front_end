<template>
  <div class="history-container">
    <header class="view-header">
      <h3 class="view-title">시스템 통합 알림 및 장애 이력</h3>
    </header>

    <table class="history-table">
      <thead>
        <tr>
          <th>발생 일시</th>
          <th>유형</th>
          <th>상세 내역</th>
          <th>처리 상태</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(log, index) in allLogs" :key="index">
          <td>{{ log.time }}</td>
          <td>
            <span :class="['type-badge', log.typeClass]">{{ log.type }}</span>
          </td>
          <td class="log-message">
            {{ log.content }}
            <small v-if="log.accuracy" class="accuracy-tag">(정확도: {{ log.accuracy }}%)</small>
          </td>
          <td>
            <span :class="['status-badge', log.statusClass]">{{ log.statusLabel }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const evLogs = ref([])
const parkingLogs = ref([])

// 1. 데이터 페칭 로직 (EV 장애 + 주차 OCR 오류)
const fetchAllIssues = async () => {
    try {
        // [백엔드 연동 시나리오]
        const [evRes, parkingRes] = await Promise.all([
            axios.get('http://localhost:8080/api/system/ev-issues'),
            axios.get('http://localhost:8080/api/system/parking-ocr-errors')
        ])
        evLogs.value = evRes.data
        parkingLogs.value = parkingRes.data
    } catch (e) {
        console.error('데이터 로드 실패', e)
    }
}

// 2. 두 소스 통합 및 정렬 (Computed)
const allLogs = computed(() => {
    // EV 로그 가공
    const evMapped = evLogs.value.map(log => ({
        time: log.occurred_time,
        type: log.issue_status === 'RISK' ? '위험' : '점검',
        typeClass: log.issue_status.toLowerCase(),
        content: `[충전기 ${log.ev_charger_id}] ${log.detail_content}`,
        statusLabel: log.process_status === 'DONE' ? '조치 완료' : '미처리',
        statusClass: log.process_status === 'DONE' ? 'done' : 'unprocessed'
    }))

    // 주차 OCR 오류 가공
    const parkingMapped = parkingLogs.value.map(log => ({
        time: log.entry_time,
        type: 'OCR 오류',
        typeClass: 'ocr',
        content: `차량(${log.vehicle_num}) 인식 정확도 저하`,
        accuracy: log.ocr_accuracy,
        statusLabel: log.is_modified ? '수정 완료' : '확인 필요',
        statusClass: log.is_modified ? 'done' : 'unprocessed'
    }))

    // 시간순 합치기 및 정렬 [cite: 2026-01-09]
    return [...evMapped, ...parkingMapped].sort((a, b) => new Date(b.time) - new Date(a.time))
})

onMounted(() => {
    fetchAllIssues()
})
</script>