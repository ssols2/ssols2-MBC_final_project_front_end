import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000
})

export async function requestForceShutdown(payload) {
  const response = await api.post('/control/power-off', payload)
  return response.data
}