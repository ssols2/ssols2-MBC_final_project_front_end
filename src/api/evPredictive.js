import axios from 'axios'

const springApi = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 5000
})

const fastApi = axios.create({
  baseURL: 'http://localhost:8003',
  timeout: 5000
})

export async function getChargerDetail(chargerId) {
  const response = await springApi.get(`/api/ev/predict/${chargerId}`)
  const data = response.data

  const shutdownDone = data.shutdown_done ?? false
  const inspectionRequested = data.inspection_requested ?? false

  return {
    chargerId: chargerId,
    aiStatus: data.ai_status ?? 'NORMAL',
    status: data.status ?? '정상',
    action: data.action ?? '',
    alarm: data.alarm ?? false,

    deviceStatus: shutdownDone
      ? '전원꺼짐'
      : (data.device_status ?? '대기 중'),

    faultProb7d: data.fault_prob_7d ?? 0,

    inspectionRequested: inspectionRequested,
    inspectionStatus: inspectionRequested ? 'REQUESTED' : 'NONE',

    shutdownDone: shutdownDone,

    mainReason: data.main_reason ?? '',
    message: data.message ?? '',

    predClass: data.pred_class ?? null,
    probNormal: data.prob_normal ?? 0,
    probCheck: data.prob_check ?? 0,
    probRisk: data.prob_risk ?? 0,

    temperature: data.temperature ?? null,
    current: data.current ?? null,
    voltage: data.voltage ?? null
  }
}

export async  function getHistoryData(limit = 10) {
  const response = await fastApi.get('/issue-log', {
    params: { limit }
  })

  return response.data.map((row) => ({
    id: row.ev_issue_log_id,
    occurredAt: row.occurred_time,
    chargerId: row.ev_charger_id,
    location: '',
    status: row.issue_status,
    aiStatus: row.issue_status,
    detail: row.detail_content,
    mainReason: row.detail_content,
    message:
      row.issue_status === 'RISK'
        ? '즉시 점검 및 기기 상태 확인 권장'
        : '선제적 점검 및 상태 확인 권장',
    faultProb7d: row.fault_prob_7d ?? null,
    inspectionStatus:
      row.process_status === 'INSPECTION_SENT'
        ? 'REQUESTED'
        : row.process_status === 'CHECK_IN_PROGRESS'
          ? 'IN_PROGRESS'
          : row.process_status === 'DONE'
            ? 'DONE'
            : row.process_status === 'STATUS_UPDATED'
              ? 'STATUS_UPDATED'
              : 'NONE',
    shutdownDone: row.power_off_done ?? false,
    completedBy: null
  }))
}

export async function getChargerList() {
  const response = await fastApi.get('/chargers/summary')

  return response.data.map((row) => ({
    chargerId: row.ev_charger_id,
    chargerType: row.charger_type,
    chargerStatus: row.charger_status,
    parkingFloor: row.parking_floor,
    parkingRow: row.parking_row,
    parkingColumn: row.parking_column,
    aiStatus: row.ai_status,
    faultProb7d: row.fault_prob_7d,
    mainReason: row.main_reason,
    powerOffDone: row.power_off_done ?? false
  }))
}

export async function getSensorHistory(chargerId, limit = 30) {
  const response = await fastApi.get(`/sensor-history/${chargerId}`, {
    params: { limit }
  })

  const rows = Array.isArray(response.data) ? response.data : []

  return {
    temperature: rows.map((row) => ({
      time: row.measured_time,
      value: `${Number(row.temperature ?? 0).toFixed(1)}℃`
    })),
    current: rows.map((row) => ({
      time: row.measured_time,
      value: `${Number(row.current ?? 0).toFixed(1)}A`
    })),
    voltage: rows.map((row) => ({
      time: row.measured_time,
      value: `${Number(row.voltage ?? 0).toFixed(1)}V`
    }))
  }
}

export async function getChargingSummary(startDate, endDate) {
  const response = await springApi.get('/api/ev/chargers/summary', {
    params: { startDate, endDate }
  })

  const rows = Array.isArray(response.data) ? response.data : []

  return rows.map((row) => ({
    hourLabel: Number(row.hourLabel ?? row.hour_label ?? 0),
    hourlyKwh: Number(row.hourlyKwh ?? row.hourlykwh ?? row.hourly_kwh ?? 0)
  }))
}

export async function getChargingLogs(startDate, endDate, status = 'ALL') {
  const response = await springApi.get('/api/ev/chargers/logs', {
    params: { startDate, endDate, status }
  })

  const rows = Array.isArray(response.data) ? response.data : []

  return rows.map((row) => ({
    id: row.ev_charging_log_id,
    time: row.start_time,
    chargerId: row.ev_charger_id,
    status: row.charging_status,
    currentChargeKwh: row.current_charge_kwh,
    totalChargeKwh: row.total_charge_kwh,
    vehicleNumber: row.vehicle_number,
    chargingMinutes: row.chargingminutes ?? null,
    endTime: row.end_time,
    endReason: row.end_reason
  }))
}