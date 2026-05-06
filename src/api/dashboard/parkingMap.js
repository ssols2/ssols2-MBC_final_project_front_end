import axios from 'axios';

const javaUrl = 'http://localhost:8080';

// 주차장 전체 자리 정보 (관리자 맵용)
export function getAllParkingSpots() {
  return axios.get(`${javaUrl}/parking-spot/all`);
}
