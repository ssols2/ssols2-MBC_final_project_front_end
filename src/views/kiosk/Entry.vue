<template>
  <div class="kiosk-main-wrapper">
    <div v-if="viewMode === 'idle'" class="screen-container screen-idle" @click="startEntry">
      <div class="center-content">
        <div class="logo-box">
          <img class="main-logo-img" src="@/assets/txtlogo2.png" alt="S-HOSPITAL" />
        </div>
        <div class="touch-guidance pulse-animation">
          <h2 class="touch-main-msg">SMART PARKING SYSTEM</h2>
          <p class="touch-sub-msg">주차장 입차를 시작합니다</p>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'input'" class="screen-container screen-input">
      <div class="center-content">
        <h1 class="page-title">주차장 입차 안내</h1>

        <div v-if="!isLoading" class="upload-section">
          <p class="guide-text">인식할 차량의 정면 사진을 선택해 주세요.</p>
          <label for="fileInput" class="professional-btn">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor"
                d="M4,4H7L9,2H15L17,4H20A2,2,0,0,1,22,6V18A2,2,0,0,1,20,20H4A2,2,0,0,1,2,18V6A2,2,0,0,1,4,4M12,7A5,5,0,1,0,17,12A5,5,0,0,0,12,7M12,9A3,3,0,1,1,9,12A3,3,0,0,1,12,9Z" />
            </svg>
            차량 사진 선택하기
          </label>
          <input type="file" id="fileInput" @change="handleFileUpload" accept="image/*" hidden />
        </div>

        <div v-if="isLoading" class="loading-section">
          <div class="modern-spinner"></div>
          <h3 class="loading-msg">AI 번호판 인식중...</h3>
          <p class="loading-sub">잠시만 기다려 주십시오</p>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'result'" class="screen-container screen-result">
      <div class="center-content">
        <h1 class="page-title highlight-title">{{ t.resultTitle }}</h1>

        <div class="result-card-container">
          <div class="info-card image-card">
            <h2 class="card-title">{{ t.aiImageTitle }}</h2>

            <div class="image-grid">
              <div class="image-box">
                <p class="img-label">{{ t.vehicleOriginal }}</p>
                <div class="image-wrapper">
                  <img v-if="vehicleImg" :src="`${backendUrl}${vehicleImg}`" class="captured-img" />
                  <div v-else class="no-image-placeholder">{{ t.noImage }}</div>
                </div>
              </div>
              <div class="image-box">
                <p class="img-label">{{ t.plateCrop }}</p>
                <div class="image-wrapper plate-wrapper">
                  <img v-if="licensePlateImg" :src="`${backendUrl}${licensePlateImg}`" class="captured-img" />
                  <div v-else class="no-image-placeholder">{{ t.noImage }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card data-card">
            <template v-if="resultText && !isAlreadyParked">
              <h2 class="card-title">{{ t.resultDetail }}</h2>
              <table class="res-table">
                <tbody>
                  <tr>
                    <th>{{ t.vehicleNum }}</th>
                    <td class="plate-num">
                      {{ resultText }}
                      <span v-if="isMember" class="badge member-badge">{{ t.member }}</span>
                      <span v-else class="badge normal-badge">{{ t.guest }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>{{ t.country }}</th>
                    <td>
                      <span class="badge country-badge">{{ licensePlateCountry }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>{{ t.entryTime }}</th>
                    <td>{{ formatDateTime(entryTime) }}</td>
                  </tr>
                  <tr v-if="recommendedSpot">
                    <th>{{ t.recommendedSpot }}</th>
                    <td>{{ translatedSpot }}</td>
                  </tr>
                  <tr>
                    <th>{{ t.status }}</th>
                    <td class="status-success">{{ t.normalEntry }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="welcome-msg">{{ t.welcomeMsg }}</p>
            </template>

            <template v-else-if="isAlreadyParked">
              <h2 class="card-title warning-title">{{ t.duplicateTitle }}</h2>
              <table class="res-table warning">
                <tbody>
                  <tr>
                    <th>{{ t.vehicleNum }}</th>
                    <td class="plate-num warn">{{ resultText }}</td>
                  </tr>
                  <tr>
                    <th>{{ t.alert }}</th>
                    <td class="status-warn">{{ t.alreadyParked }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="warning-guide-box">
                <p>{{ t.duplicateGuide }}</p>
              </div>
            </template>

            <template v-else>
              <h2 class="card-title error-title">{{ t.errorTitle }}</h2>
              <div class="error-visual-box">
                <svg viewBox="0 0 24 24" class="svg-error">
                  <path fill="currentColor"
                    d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
                </svg>
                <p class="error-msg">{{ t.errorMsg }}</p>
                <p class="sub-guide">{{ t.errorGuide }}</p>
              </div>
            </template>
          </div>
        </div>

        <div class="timer-section">
          <div class="timer-bar">
            <div class="timer-progress" :style="{ width: (countdown / 5) * 100 + '%' }"></div>
          </div>
          <p class="timer-text"><b>{{ countdown }}</b>{{ t.timerText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { uploadEntryImage } from '@/api/entry.js'; // 실제 사용하는 axios 모듈에 맞게 경로 확인

// 자바 스프링부트 서버 주소 (포트가 다르면 수정하세요)
const backendUrl = 'http://localhost:8080';

// 국가별 안내 언어
const TRANSLATIONS = {
  KOR: {
    locale: 'ko-KR',
    floor: '층',
    noTime: '시간 정보 없음',
    resultTitle: '입차 결과 안내',
    aiImageTitle: 'AI 인식 이미지',
    vehicleOriginal: '차량 원본',
    plateCrop: '번호판 크롭 (YOLO)',
    noImage: '이미지 없음',
    resultDetail: '인식 결과 상세',
    vehicleNum: '차량 번호',
    member: '등록회원',
    guest: '일반차량',
    country: '국가',
    entryTime: '입차 시각',
    recommendedSpot: '추천 주차 위치',
    status: '상태',
    normalEntry: '정상 입차',
    welcomeMsg: '어서 오십시오. 즐거운 하루 되세요!',
    duplicateTitle: '중복 입차 안내',
    alert: '알림',
    alreadyParked: '이미 입차된 차량',
    duplicateGuide: '차단기가 열리지 않으면 호출 버튼을 눌러주세요',
    errorTitle: '인식 오류',
    errorMsg: '번호판 인식에 실패했습니다',
    errorGuide: '관리자 호출 또는 다시 시도해 주세요',
    timerText: '초 후 초기 화면으로 돌아갑니다',
  },
  BRA: {
    locale: 'pt-BR',
    floor: 'F',
    noTime: 'Sem informacao de horario',
    resultTitle: 'Resultado da Entrada',
    aiImageTitle: 'Imagem Reconhecida por IA',
    vehicleOriginal: 'Veiculo Original',
    plateCrop: 'Recorte da Placa (YOLO)',
    noImage: 'Sem imagem',
    resultDetail: 'Detalhes do Reconhecimento',
    vehicleNum: 'Placa do Veiculo',
    member: 'Membro',
    guest: 'Visitante',
    country: 'Pais',
    entryTime: 'Hora de Entrada',
    recommendedSpot: 'Vaga Recomendada',
    status: 'Status',
    normalEntry: 'Entrada Normal',
    welcomeMsg: 'Bem-vindo! Tenha um otimo dia!',
    duplicateTitle: 'Aviso de Entrada Duplicada',
    alert: 'Aviso',
    alreadyParked: 'Veiculo ja estacionado',
    duplicateGuide: 'Se a cancela nao abrir, pressione o botao de chamada',
    errorTitle: 'Erro de Reconhecimento',
    errorMsg: 'Falha no reconhecimento da placa',
    errorGuide: 'Chame o administrador ou tente novamente',
    timerText: ' segundo(s) para retornar a tela inicial',
  },
  CHN: {
    locale: 'zh-CN',
    floor: '层',
    noTime: '无时间信息',
    resultTitle: '入场结果通知',
    aiImageTitle: 'AI识别图像',
    vehicleOriginal: '车辆原图',
    plateCrop: '车牌裁剪 (YOLO)',
    noImage: '无图像',
    resultDetail: '识别结果详情',
    vehicleNum: '车牌号码',
    member: '注册会员',
    guest: '普通车辆',
    country: '国家',
    entryTime: '入场时间',
    recommendedSpot: '推荐车位',
    status: '状态',
    normalEntry: '正常入场',
    welcomeMsg: '欢迎光临，祝您愉快！',
    duplicateTitle: '重复入场通知',
    alert: '提醒',
    alreadyParked: '车辆已入场',
    duplicateGuide: '如果闸门未打开，请按呼叫按钮',
    errorTitle: '识别错误',
    errorMsg: '车牌识别失败',
    errorGuide: '请呼叫管理员或重试',
    timerText: '秒后返回初始画面',
  },
  EUR: {
    locale: 'en-GB',
    floor: 'F',
    noTime: 'No time info',
    resultTitle: 'Entry Result',
    aiImageTitle: 'AI Recognized Image',
    vehicleOriginal: 'Vehicle Original',
    plateCrop: 'Plate Crop (YOLO)',
    noImage: 'No image',
    resultDetail: 'Recognition Details',
    vehicleNum: 'Vehicle Number',
    member: 'Member',
    guest: 'Guest',
    country: 'Country',
    entryTime: 'Entry Time',
    recommendedSpot: 'Recommended Spot',
    status: 'Status',
    normalEntry: 'Normal Entry',
    welcomeMsg: 'Welcome! Have a great day!',
    duplicateTitle: 'Duplicate Entry Notice',
    alert: 'Alert',
    alreadyParked: 'Vehicle already parked',
    duplicateGuide: 'If the gate does not open, press the call button',
    errorTitle: 'Recognition Error',
    errorMsg: 'License plate recognition failed',
    errorGuide: 'Please call an administrator or try again',
    timerText: ' second(s) to return to the home screen',
  },
  IND: {
    locale: 'hi-IN',
    floor: 'F',
    noTime: 'समय की जानकारी नहीं',
    resultTitle: 'प्रवेश परिणाम सूचना',
    aiImageTitle: 'AI पहचान छवि',
    vehicleOriginal: 'वाहन मूल',
    plateCrop: 'नंबर प्लेट क्रॉप (YOLO)',
    noImage: 'कोई छवि नहीं',
    resultDetail: 'पहचान परिणाम विवरण',
    vehicleNum: 'वाहन संख्या',
    member: 'सदस्य',
    guest: 'आगंतुक',
    country: 'देश',
    entryTime: 'प्रवेश समय',
    recommendedSpot: 'अनुशंसित पार्किंग स्थान',
    status: 'स्थिति',
    normalEntry: 'सामान्य प्रवेश',
    welcomeMsg: 'स्वागत है! आपका दिन शुभ हो!',
    duplicateTitle: 'डुप्लिकेट प्रवेश सूचना',
    alert: 'सूचना',
    alreadyParked: 'वाहन पहले से पार्क है',
    duplicateGuide: 'यदि बैरियर नहीं खुलता है, तो कॉल बटन दबाएं',
    errorTitle: 'पहचान त्रुटि',
    errorMsg: 'नंबर प्लेट पहचान विफल',
    errorGuide: 'कृपया प्रबंधक को कॉल करें या पुनः प्रयास करें',
    timerText: ' सेकंड बाद होम स्क्रीन पर वापस',
  },
};

const t = computed(() => TRANSLATIONS[licensePlateCountry.value] || TRANSLATIONS['KOR']);

const viewMode = ref('idle');
const isLoading = ref(false);
const selectedFile = ref(null);

// AI 및 백엔드 응답 데이터 상태 관리
const resultText = ref('');
const vehicleImg = ref('');
const licensePlateImg = ref('');
const licensePlateCountry = ref('');
const ocrAccuracy = ref(0);
const isEvLicensePlate = ref(false);
const isMember = ref(false);
const entryTime = ref('');
const recommendedSpot = ref('');

const isAlreadyParked = ref(false);
const countdown = ref(5); // 결과 확인을 위해 5초로 변경
let timerId = null;

const startEntry = () => {
  viewMode.value = 'input';
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = file;
  await submitImage();
};

const submitImage = async () => {
  isLoading.value = true;

  // 상태 초기화
  resultText.value = '';
  vehicleImg.value = '';
  licensePlateImg.value = '';
  licensePlateCountry.value = '';
  ocrAccuracy.value = 0;
  isEvLicensePlate.value = false;
  isMember.value = false;
  entryTime.value = '';
  isAlreadyParked.value = false;
  recommendedSpot.value = '';

  try {
    const response = await uploadEntryImage(selectedFile.value);
    const data = response.data;

    //console.log("🚀 백엔드 수신 데이터:", data);

    // Spring Boot(Jackson)는 변수명을 CamelCase로 반환합니다.
    resultText.value = (data.vehicleNum && data.vehicleNum !== 'Unknown' && data.vehicleNum !== '인식불가') ? data.vehicleNum : '';
    vehicleImg.value = data.vehicleImg || '';
    licensePlateImg.value = data.licensePlateImg || '';
    licensePlateCountry.value = data.licensePlateCountry || 'KOR';
    ocrAccuracy.value = data.ocrAccuracy || 0;
    isEvLicensePlate.value = data.isEvLicensePlate || false;
    isMember.value = data.isMember || false;
    entryTime.value = data.entryTime || '';
    recommendedSpot.value = data.recommendedSpot || '';

    // 중복 입차 로직 (필요시 백엔드 응답 규격에 맞춰 수정)
    if (data.parkingStatus === 'ALREADY_PARKED') {
      isAlreadyParked.value = true;
    }

    viewMode.value = 'result';
    countdown.value = 5;

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timerId);
        resetToIdle();
      }
    }, 1000);

  } catch (error) {
    console.error("❌ 이미지 전송 실패:", error);
    alert('인식에 실패했습니다. 다시 시도해주세요.');
    resetToIdle();
  } finally {
    if (viewMode.value !== 'result') {
      isLoading.value = false;
    }
  }
};

const resetToIdle = () => {
  viewMode.value = 'idle';
  isLoading.value = false;
  selectedFile.value = null;
  recommendedSpot.value = '';
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  const input = document.getElementById('fileInput');
  if (input) input.value = '';
};

// 날짜 포맷팅 (인식된 국가의 로케일 적용)
const formatDateTime = (dateString) => {
  if (!dateString) return t.value.noTime;
  const d = new Date(dateString);
  return d.toLocaleString(t.value.locale, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

// 추천 주차 위치 번역 (백엔드: "B1층 2-3" → 국가별: "B1F 2-3", "B1层 2-3" 등)
const translatedSpot = computed(() => {
  if (!recommendedSpot.value) return '';
  return recommendedSpot.value.replace('층', t.value.floor);
});
</script>

<style scoped>
/* 기존 스타일은 유지하고, 새로 추가된 이미지 그리드와 뱃지 스타일을 추가합니다. */
.kiosk-main-wrapper {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: linear-gradient(135deg, var(--bg-light) 0%, #e0eafc 100%);
  overflow: hidden;
}

.screen-container {
  width: 100%;
  min-height: 90%;
  flex-direction: column;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 60px;
}

.center-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-box {
  width: 100%;
  height: 170px;
  display: flex;
  justify-content: center;
  margin-bottom: 80px;
  margin-top: 50px;
}

.main-logo-img {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.pulse-animation {
  animation: pulseBtn 2s infinite ease-in-out;
}

@keyframes pulseBtn {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.touch-guidance {
  margin-top: 120px;
  text-align: center;
}

.touch-main-msg {
  font-size: 30px;
  margin-bottom: 12px;
}

.touch-sub-msg {
  font-size: 22px;
}

.page-title {
  font-size: 70px;
  margin-bottom: 20px;
  margin-top: 30px;
}

.upload-section {
  text-align: center;
}

.guide-text {
  font-size: 28px;
  margin-bottom: 80px;
  letter-spacing: -1.8px;
  text-align: center;
}

.professional-btn {
  background: #005baa;
  color: #ffffff;
  padding: 50px 60px;
  font-size: 30px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 91, 170, 0.2);
  border: none;
}

.svg-icon {
  width: 32px;
  height: 32px;
  margin-right: 15px;
}

/* 입차 결과 (이미지 & 데이터 분할) */
.result-card-container {
  display: flex;
  gap: 40px;
  width: 100%;
  margin-bottom: 20px;
}

.info-card {
  flex: 1;
  background: #fff;
  padding: 40px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  border-radius: 15px;
}

/* 이미지 2개 출력용 그리드 */
.image-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.image-box {
  width: 100%;
}

.img-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.image-wrapper {
  width: 100%;
  height: 250px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e2e8f0;
}

.plate-wrapper {
  height: 120px;
  /* 번호판은 위아래가 좁으므로 높이를 낮춤 */
}

.captured-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image-placeholder {
  color: #94a3b8;
  font-size: 1.2rem;
}

.res-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.res-table th {
  text-align: left;
  font-size: 1.6rem;
  color: #64748b;
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
  width: 35%;
}

.res-table td {
  text-align: left;
  font-size: 1.8rem;
  font-weight: 700;
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
}

.plate-num {
  font-size: 4rem;
  color: #005baa;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.plate-num.warn {
  color: #fb6900;
}

.highlight-title {
  font-size: 70px;
}

.welcome-msg {
  font-size: 32px;
  font-weight: 500;
  color: #005baa;
  margin-top: 40px;
  text-align: center;
}

/* 뱃지 디자인 (회원, EV, 국가 등) */
.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 1.2rem;
  font-weight: 600;
  margin-right: 10px;
}

.member-badge {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  font-size: 1.4rem;
  padding: 8px 15px;
}

.country-badge {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.ev-badge {
  background: #ecfeff;
  color: #0891b2;
  border: 1px solid #a5f3fc;
}

.normal-badge {
  background: #f8fafc;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.warning-guide-box {
  margin-top: 40px;
  padding: 30px;
  background: #fff8e6;
  border-radius: 12px;
  border-left: 8px solid #ffc107;
  text-align: center;
}

.warning-guide-box p {
  font-size: 26px;
  font-weight: 600;
  color: #856404;
  margin: 0;
}

.error-visual-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px 0;
}

.svg-error {
  width: 100px;
  height: 100px;
  color: #e74c3c;
  margin-bottom: 30px;
}

.error-msg {
  font-size: 38px !important;
  font-weight: 700;
  color: #e74c3c;
  margin: 0 0 15px 0;
}

.sub-guide {
  font-size: 24px !important;
  color: #64748b;
  font-weight: 500;
}

.timer-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  padding-bottom: 30px;
}

.timer-bar {
  width: 100%;
  height: 14px;
  background: rgba(0, 91, 170, 0.15);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 40px;
}

.timer-progress {
  height: 100%;
  background: #005baa;
  animation: timerShrink 5s linear forwards;
}

@keyframes timerShrink {
  from {
    width: 100%;
  }

  to {
    width: 0%;
  }
}

.timer-text {
  font-size: 24px;
  color: #333;
  margin-top: 20px;
  text-align: center;
}

.loading-section {
  margin-top: 80px;
}

.loading-msg {
  text-align: center;
  font-size: 30px;
}

.loading-sub {
  text-align: center;
  font-size: 24px;
}

.modern-spinner {
  width: 80px;
  height: 80px;
  border: 8px solid rgba(0, 91, 170, 0.1);
  border-top: 8px solid #005baa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>