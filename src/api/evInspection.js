import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8003',
  timeout: 5000
})

export async function requestInspection(payload) {
  const response = await api.post('/inspection-request', payload)
  return response.data
}