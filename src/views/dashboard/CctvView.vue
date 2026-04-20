<template>
  <div class="security-manage-container">
    <header class="security-header">
      <h2 class="page-title">영상 보안 관제</h2>
    </header>

    <div class="cctv-content-wrapper">
      <main class="cctv-main">
        <div class="cctv-grid" :class="gridClass">
          <div
            v-for="cam in displayCams"
            :key="cam.id"
            class="cam-box active-cam"
            @click="openModal(cam)"
          >
            <span class="label">{{ cam.name }}</span>
            <img
              v-if="cam.type === 'stream'"
              :src="cam.url"
              @error="refreshCamStreams"
            />
            <video
              v-else
              :src="cam.url"
              autoplay
              muted
              loop
              playsinline
              preload="auto"
            ></video>
          </div>
        </div>
      </main>

      <aside class="sidebar" :class="{ collapsed: !isSidebarOpen }">
        <div class="sidebar-header">
          <h3 v-if="isSidebarOpen">카메라 목록 및 제어</h3>
          <button class="sidebar-toggle" @click="toggleSidebar">
            {{ isSidebarOpen ? '⟩' : '⟨' }}
          </button>
        </div>

        <div v-show="isSidebarOpen" class="panel-card camera-card">
          <div class="panel-card-title">카메라 목록</div>

          <div class="camera-scroll">
            <div v-for="(isOpen, floor) in openFloors" :key="floor" class="floor-group">
              <div class="tree-node" @click="toggleFloor(floor)">
                <span class="arrow" :class="{ rotated: isOpen }">▶</span> {{ floor }}층
              </div>

              <transition name="slide">
                <ul v-if="isOpen" class="sub-list">
                  <li
                    v-for="cam in cams.filter(c => c.floor === floor)"
                    :key="cam.id"
                    :class="{ 'is-active': activeCamIds.includes(cam.id) }"
                    @click="toggleCamSelection(cam)"
                  >
                    <span class="status-dot" :class="{ online: activeCamIds.includes(cam.id) }"></span>
                    {{ cam.name }}
                  </li>
                </ul>
              </transition>
            </div>
          </div>
        </div>

        <div v-show="isSidebarOpen" class="panel-card calendar-card">
          <div class="panel-card-title">날짜 선택</div>

          <div class="calendar">
            <div class="cal-header">2026년 3월</div>
            <div class="cal-grid">
              <span v-for="d in ['일','월','화','수','목','금','토']" :key="'d'+d" class="day-head">{{ d }}</span>
              <span v-for="n in 31" :key="n" :class="{ 'today': n === 13 }">{{ n }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="selectedCam" class="modal" @click.self="closeCam">
      <div class="modal-content">
        <span class="modal-title">{{ selectedCam.name }}</span>
        <img
          v-if="selectedCam.type === 'stream'"
          :src="selectedCam.url"
          @error="refreshCamStreams"
        />
        <video
          v-else
          :src="selectedCam.url"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
        ></video>
        <button class="close-btn" @click="closeCam">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const makeStreamUrl = (camNo) => `http://127.0.0.1:5000/cam${camNo}?t=${Date.now()}`;
const makeVideoUrl = (fileName) => `/videos/${fileName}`;

// 1. 카메라 전체 데이터
const cams = ref([
  { id: 1, name: 'CAM-01 (B1 Entry)', floor: 'B1', type: 'stream', url: makeStreamUrl(1) },
  { id: 2, name: 'CAM-02 (B1 Ramp)',  floor: 'B1', type: 'stream', url: makeStreamUrl(2) },
  { id: 4, name: 'CAM-04 (B2 Zone)',  floor: 'B2', type: 'video', url: makeVideoUrl('cam4.mp4') },
  { id: 5, name: 'CAM-05 (B3 North)', floor: 'B3', type: 'video', url: makeVideoUrl('cam5.mp4') },
  { id: 6, name: 'CAM-06 (B4 South)', floor: 'B4', type: 'video', url: makeVideoUrl('cam6.mp4') },
  { id: 7, name: 'CAM-07 (B5 West)',  floor: 'B5', type: 'video', url: makeVideoUrl('cam7.mp4') },
]);

// 2. 상태 관리
const selectedCam = ref(null); 
const isSidebarOpen = ref(true); 
const maxVisibleCams = 4;
const openFloors = ref({ B1: true, B2: true, B3: false, B4: false, B5: false });
const activeCamIds = ref([1, 2, 4, 5]);

// 3. Computed (화면 표시용)
const displayCams = computed(() => {
  return cams.value.filter(cam => activeCamIds.value.includes(cam.id));
});

const gridClass = computed(() => {
  const count = displayCams.value.length;
  if (count <= 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count <= 4) return 'grid-4';
  return 'grid-8';
});

// 4. 함수 (액션 처리)
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const refreshCamStreams = () => {
  cams.value = cams.value.map((cam) => ({
    ...cam,
    url: cam.type === 'stream' ? makeStreamUrl(cam.id) : cam.url
  }));

  if (selectedCam.value) {
    const refreshed = cams.value.find((cam) => cam.id === selectedCam.value.id);
    if (refreshed) selectedCam.value = refreshed;
  }
};

const toggleFloor = (floor) => { 
  openFloors.value[floor] = !openFloors.value[floor]; 
};

// 밀어내기 로직
const toggleCamSelection = (cam) => {
  const index = activeCamIds.value.indexOf(cam.id);
  if (index > -1) {
    activeCamIds.value.splice(index, 1); 
  } else {
    if (activeCamIds.value.length >= maxVisibleCams) {
      activeCamIds.value.shift(); 
    }
    activeCamIds.value.push(cam.id);    
  }
};

const openModal = (cam) => { 
  if(!cam.url) return;
  selectedCam.value = cam; 
};

const closeCam = () => { 
  selectedCam.value = null; 
};

onMounted(() => {
  refreshCamStreams();
});
</script>

<style scoped>
/* ── 1. 전체 레이아웃 (세로 배치 후 가로 분할) ── */
.security-manage-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  color: #fff;
  overflow: hidden;
}

.security-header {
  margin-bottom: 25px;
  flex-shrink: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.cctv-content-wrapper {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  gap: 16px;
}

/* ── 2. 메인 카메라 영역 ── */
.cctv-main { 
  flex: 1; 
  min-width: 0; 
  display: flex; 
  flex-direction: column; 
}

.cctv-grid { 
  display: grid; 
  gap: 10px; 
  flex: 1; 
  min-height: 0; 
}

.grid-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.grid-2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; } 
.grid-4 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); } 
.grid-8 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); }

.cam-box { 
  background: #000; 
  border: 1px solid #30363d; 
  border-radius: 6px; 
  width: 100%; 
  height: 100%; 
  position: relative; 
  overflow: hidden; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.active-cam { border-color: #3fb950; border-width: 2px; }

.cam-box img,
.cam-box video { 
  width: 100%; 
  height: 100%; 
  object-fit: contain;
  display: block;
  background: #000;
}

.label { 
  position: absolute; 
  top: 8px; 
  left: 8px; 
  background: rgba(0,0,0,0.7); 
  color: #fff; 
  padding: 4px 8px; 
  font-size: 12px; 
  z-index: 2; 
  border-radius: 4px; 
}

/* ── 3. 우측 사이드바 ── */
.sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: width 0.25s ease, padding 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
  padding: 12px 8px;
}

.sidebar-header {
  margin-bottom: 5px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 10px;
  color: #58a6ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #0d1117;
  color: #e6edf3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  border-color: #58a6ff;
  color: #58a6ff;
}

.panel-card {
  background: #0f1520;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 10px;
}

.panel-card-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #e6edf3;
}

.camera-card {
  flex: 1;
  min-height: 0;
}

.calendar-card {
  flex-shrink: 0;
}

/* 트리 메뉴 */
.camera-scroll {
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}
.tree-node { padding: 10px 0; cursor: pointer; font-weight: bold; font-size: 14px; border-bottom: 1px solid rgba(128,128,128,0.1); }
.sub-list { list-style: none; padding-left: 15px; overflow: hidden; margin: 0; }
.sub-list li { padding: 8px; cursor: pointer; font-size: 13px; color: #8b949e; display: flex; align-items: center; border-radius: 4px; transition: 0.2s; margin-top: 2px;}
.sub-list li:hover { background: rgba(128,128,128,0.1); }
.sub-list li.is-active { color: #3fb950; font-weight: bold; background: rgba(63, 185, 80, 0.1); }
.status-dot { width: 8px; height: 8px; background: #484f58; border-radius: 50%; margin-right: 10px; }
.status-dot.online { background: #3fb950; box-shadow: 0 0 8px #3fb950; }

.arrow { display: inline-block; transition: 0.2s; font-size: 10px; margin-right: 5px; }
.arrow.rotated { transform: rotate(90deg); }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease-out; max-height: 300px; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

/* 달력 */
.calendar { background: transparent; padding: 0; font-size: 11px; border: none; }
.cal-header { text-align: center; font-weight: bold; margin-bottom: 8px; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; gap: 4px; }
.day-head { color: #8b949e; }
.cal-grid span { padding: 4px 0; border-radius: 3px; }
.today { background: #58a6ff; color: #fff; font-weight: bold; }

/* ── 4. 확대 모달 ── */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: #0d1117; padding: 20px; border-radius: 12px; border: 1px solid #30363d; width: 80%; text-align: center; }
.modal-title { display: block; font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 10px; }
.modal-content img,
.modal-content video { width: 100%; max-height: 75vh; object-fit: contain; background: #000; display: block; margin-top: 10px; }
.close-btn { background: #161b22; color: #e6edf3; border: 1px solid #30363d; padding: 10px 30px; border-radius: 6px; margin-top: 15px; cursor: pointer; transition: 0.2s; }
.close-btn:hover { background: #30363d; }
</style>