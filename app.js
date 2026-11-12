/**
 * 부광고등학교 교육용 태양광 & 편광 광학 시뮬레이터
 * 인천광역시 부평구 부흥로115번길 57 (위도 37.4975° N, 경도 126.7380° E)
 */

// ==========================================
// 1. 상태(State) 관리
// ==========================================
const state = {
  // 기준 위치 (인천 부광고)
  location: {
    name: '인천 부광고등학교',
    lat: 37.4975,
    lon: 126.7380
  },
  // 편광판 설정
  polarMode: 'dual', // 'none' | 'single' | 'dual'
  polar1: 0,         // 제1 편광판 각도 (0 ~ 180도)
  polar2: 45,        // 제2 편광판 각도 (0 ~ 180도)
  filmTransmittance: 0.86, // 편광필름 자체 단일 투과율 (약 86%)
  extinctionRatio: 0.0005, // 0.05% 직교 시 누설광

  // 패널 설치 각도
  tilt: 30,          // 경사각 (0 ~ 90도, 30도 기본)
  azimuth: 180,      // 방위각 (남향 180도)

  // 환경 및 날씨
  weatherSource: 'live', // 'live' | 'manual'
  baseIrradiance: 950,   // 기준 일사량 W/m²
  temperature: 22,       // 기온 °C
  simHour: 12.5,         // 시뮬레이션 시간대 (12:30)
  cloudCover: 10,        // 운량 %
  weatherDesc: '실시간 날씨 로딩 중...',

  // API 원본 응답 저장
  rawApiData: {
    dni: 0,
    dhi: 0,
    ghi: 0,
    temp: 0,
    cloud: 0,
    humidity: 0,
    sunrise: '-',
    sunset: '-'
  },

  // 패널 스펙 (교육용 소형 모듈 기준)
  panelArea: 0.05,       // 면적 m² (약 20x25cm)
  panelEfficiency: 0.185,// 효율 18.5%
  tempCoeff: -0.0038,    // 온도계수 -0.38%/°C

  // 계산된 실시간 물리량
  calc: {
    sunElev: 0,
    sunAzim: 180,
    incAngle: 0,
    diffAngle: 45,
    polarTrans: 0.25,
    effectiveIrr: 0,
    power: 0,
    baselinePower: 0,
    ratioNoPolar: 100,
    estVoltage: 6.0,
    estCurrent: 0
  },

  // 엑셀 비교용 실험 데이터
  experimentData: null,
  activeDataset: 'caseA', // 'caseA' | 'caseB' | 'custom'
  activeMetric: 'bright',  // 'bright' | 'volt' | 'power'
  mainChartMetric: 'power',// 메인 차트 표시 지표: 'power' | 'volt' | 'bright'
  showRealOverlay: true,  // 메인 차트에 실측치 오버레이 여부

  // 애니메이션 프레임
  animFrame: 0
};

// ==========================================
// 1-1. 부광고 실제 실험 [측정값 (1)~(10)] 평균 데이터셋 (총 688개 데이터 집계)
// ==========================================
const BUKWANG_REAL_DATA = {
  caseA: [
    { angle: 0, file: '측정값 (1).zip', num: 1, volt: 6.391, bright: 898.4, temp: 18.7, count: 68, minV: 6.35, maxV: 6.59, minB: 887, maxB: 914 },
    { angle: 10, file: '측정값 (2).zip', num: 2, volt: 6.445, bright: 932.8, temp: 22.4, count: 73, minV: 6.35, maxV: 6.54, minB: 920, maxB: 941 },
    { angle: 20, file: '측정값 (3).zip', num: 3, volt: 6.424, bright: 936.9, temp: 27.4, count: 67, minV: 6.32, maxV: 6.49, minB: 929, maxB: 945 },
    { angle: 30, file: '측정값 (4).zip', num: 4, volt: 5.848, bright: 863.8, temp: 20.4, count: 70, minV: 5.71, maxV: 6.00, minB: 848, maxB: 878 },
    { angle: 40, file: '측정값 (5).zip', num: 5, volt: 6.107, bright: 882.3, temp: 24.8, count: 90, minV: 5.76, maxV: 6.57, minB: 846, maxB: 935 },
    { angle: 50, file: '측정값 (6).zip', num: 6, volt: 5.741, bright: 843.2, temp: 22.4, count: 64, minV: 5.64, maxV: 5.83, minB: 835, maxB: 852 },
    { angle: 60, file: '측정값 (7).zip', num: 7, volt: 6.607, bright: 935.9, temp: 22.2, count: 63, minV: 6.47, maxV: 6.69, minB: 917, maxB: 947 },
    { angle: 70, file: '측정값 (8).zip', num: 8, volt: 6.210, bright: 874.8, temp: 21.2, count: 69, minV: 6.18, maxV: 6.25, minB: 869, maxB: 880 },
    { angle: 80, file: '측정값 (9).zip', num: 9, volt: 6.621, bright: 925.4, temp: 21.7, count: 79, minV: 6.54, maxV: 6.69, minB: 914, maxB: 935 },
    { angle: 90, file: '측정값 (10).zip', num: 10, volt: 6.125, bright: 879.3, temp: 23.0, count: 62, minV: 6.08, maxV: 6.35, minB: 870, maxB: 907 }
  ],
  caseB: [
    { angle: 0, file: '측정값 (1) [13:10]', num: 1, volt: 6.391, bright: 898.4, temp: 18.7, count: 68, minV: 6.35, maxV: 6.59, minB: 887, maxB: 914 },
    { angle: 10, file: '측정값 (9) [13:12]', num: 9, volt: 6.621, bright: 925.4, temp: 21.7, count: 79, minV: 6.54, maxV: 6.69, minB: 914, maxB: 935 },
    { angle: 20, file: '측정값 (10) [13:13]', num: 10, volt: 6.125, bright: 879.3, temp: 23.0, count: 62, minV: 6.08, maxV: 6.35, minB: 870, maxB: 907 },
    { angle: 30, file: '측정값 (8) [13:15]', num: 8, volt: 6.210, bright: 874.8, temp: 21.2, count: 69, minV: 6.18, maxV: 6.25, minB: 869, maxB: 880 },
    { angle: 40, file: '측정값 (7) [13:17]', num: 7, volt: 6.607, bright: 935.9, temp: 22.2, count: 63, minV: 6.47, maxV: 6.69, minB: 917, maxB: 947 },
    { angle: 50, file: '측정값 (5) [13:19]', num: 5, volt: 6.107, bright: 882.3, temp: 24.8, count: 90, minV: 5.76, maxV: 6.57, minB: 846, maxB: 935 },
    { angle: 60, file: '측정값 (6) [13:20]', num: 6, volt: 5.741, bright: 843.2, temp: 22.4, count: 64, minV: 5.64, maxV: 5.83, minB: 835, maxB: 852 },
    { angle: 70, file: '측정값 (4) [13:22]', num: 4, volt: 5.848, bright: 863.8, temp: 20.4, count: 70, minV: 5.71, maxV: 6.00, minB: 848, maxB: 878 },
    { angle: 80, file: '측정값 (2) [13:24]', num: 2, volt: 6.445, bright: 932.8, temp: 22.4, count: 73, minV: 6.35, maxV: 6.54, minB: 920, maxB: 941 },
    { angle: 90, file: '측정값 (3) [13:26]', num: 3, volt: 6.424, bright: 936.9, temp: 27.4, count: 67, minV: 6.32, maxV: 6.49, minB: 929, maxB: 945 }
  ]
};

// ==========================================
// 2. 물리 & 천문학 계산 엔진
// ==========================================

// 날짜와 시간에 따른 인천 부광고의 태양 고도(Elevation) 및 방위각(Azimuth) 근사 계산
function calculateSolarPosition(latDeg, lonDeg, hourFloat) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // 태양 적위 (Declination)
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180));
  const declRad = declination * (Math.PI / 180);
  const latRad = latDeg * (Math.PI / 180);

  // 태양 시각각 (Hour Angle, H) - 정오 12시 기준 (1시간 = 15도)
  // 한국 표준시(KST, 135°E)와 인천 경도(126.74°E) 사이의 경도 시차 보정: (126.74 - 135) * 4분 = 약 -33분
  const solarTimeCorrection = (lonDeg - 135) / 15.0; // 시간 단위
  const solarTime = hourFloat + solarTimeCorrection;
  const hourAngleDeg = (solarTime - 12) * 15;
  const hourAngleRad = hourAngleDeg * (Math.PI / 180);

  // 태양 고도각 (Elevation angle, alpha)
  const sinElev = Math.sin(latRad) * Math.sin(declRad) + Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngleRad);
  const elevRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  const elevDeg = elevRad * (180 / Math.PI);

  // 태양 방위각 (Azimuth angle, gamma) - 북 0°, 동 90°, 남 180°, 서 270°
  const cosAzim = (Math.sin(declRad) * Math.cos(latRad) - Math.cos(declRad) * Math.sin(latRad) * Math.cos(hourAngleRad)) / Math.cos(elevRad);
  let azimDeg = Math.acos(Math.max(-1, Math.min(1, cosAzim))) * (180 / Math.PI);
  if (hourAngleDeg > 0) {
    azimDeg = 360 - azimDeg;
  }
  azimDeg = (azimDeg + 180) % 360; // 남향 기준 180도로 정렬

  return {
    elev: Math.max(0, elevDeg),
    azim: azimDeg,
    isDaylight: elevDeg > 0
  };
}

// 패널 표면 입사각 (Incidence Angle, theta_inc)
function calculateIncidenceAngle(sunElevDeg, sunAzimDeg, tiltDeg, panelAzimDeg) {
  if (sunElevDeg <= 0) return 90;

  const alpha = sunElevDeg * (Math.PI / 180);     // 태양 고도
  const beta = tiltDeg * (Math.PI / 180);         // 패널 경사각
  const gammaS = sunAzimDeg * (Math.PI / 180);    // 태양 방위각
  const gammaP = panelAzimDeg * (Math.PI / 180);  // 패널 방위각

  // 입사각 공식: cos(theta) = sin(alpha)cos(beta) + cos(alpha)sin(beta)cos(gammaS - gammaP)
  const cosInc = Math.sin(alpha) * Math.cos(beta) + Math.cos(alpha) * Math.sin(beta) * Math.cos(gammaS - gammaP);
  const incDeg = Math.acos(Math.max(0, Math.min(1, cosInc))) * (180 / Math.PI);

  return incDeg;
}

// 편광판 투과율 계산 (말뤼스의 법칙 + 소광비 + 필름투과계수)
function calculatePolarizerTransmittance(mode, theta1, theta2, filmTrans, extinction) {
  if (mode === 'none') {
    return 1.0; // 편광판 없음 (100%)
  }

  if (mode === 'single') {
    // 자연광(무편광) 통과 시: 이상적으로 50% * 필름 투과계수
    return 0.5 * filmTrans;
  }

  // 이중 편광판: 말뤼스의 법칙 (Malus's Law)
  const diffDeg = Math.abs(theta2 - theta1) % 180;
  const diffRad = diffDeg * (Math.PI / 180);

  // I = 0.5 * T_film^2 * (cos^2(diff) + extinction)
  const malusCos2 = Math.pow(Math.cos(diffRad), 2);
  const trans = 0.5 * Math.pow(filmTrans, 2) * (malusCos2 + extinction);

  return Math.min(1.0, trans);
}

// 전체 발전량 재계산
function updateCalculations() {
  const solar = calculateSolarPosition(state.location.lat, state.location.lon, state.simHour);
  state.calc.sunElev = solar.elev;
  state.calc.sunAzim = solar.azim;

  // 패널 입사각
  const incAngle = calculateIncidenceAngle(solar.elev, solar.azim, state.tilt, state.azimuth);
  state.calc.incAngle = incAngle;

  // 편광판 각도차 & 투과율
  const diffAngle = Math.abs(state.polar2 - state.polar1) % 180;
  state.calc.diffAngle = diffAngle;

  const polarTrans = calculatePolarizerTransmittance(
    state.polarMode,
    state.polar1,
    state.polar2,
    state.filmTransmittance,
    state.extinctionRatio
  );
  state.calc.polarTrans = polarTrans;

  // 유효 일사량 (W/m²)
  // 입사각 코사인 성분 + 산란광 성분(기본 약 15%)
  const cosFactor = Math.max(0, Math.cos(incAngle * (Math.PI / 180)));
  const directIrr = state.baseIrradiance * cosFactor;
  const diffuseIrr = state.baseIrradiance * 0.15 * ((1 + Math.cos(state.tilt * (Math.PI / 180))) / 2);
  const totalIncidentIrr = (solar.elev > 0) ? (directIrr + diffuseIrr) : 0;

  const effectiveIrr = totalIncidentIrr * polarTrans;
  state.calc.effectiveIrr = effectiveIrr;

  // 셀 온도 및 온도 저하 계수
  const cellTemp = state.temperature + (effectiveIrr / 800) * 25; // NOCT 모델 간이화
  const tempFactor = 1 + (state.tempCoeff * (cellTemp - 25));

  // 발전 전력 P = Area * Efficiency * EffectiveIrr * tempFactor
  const power = Math.max(0, state.panelArea * state.panelEfficiency * effectiveIrr * tempFactor);
  state.calc.power = power;

  // 편광판이 아예 없을 때의 기준 전력 (비교용)
  const baselineEffectiveIrr = totalIncidentIrr * 1.0;
  const baselineCellTemp = state.temperature + (baselineEffectiveIrr / 800) * 25;
  const baselineTempFactor = 1 + (state.tempCoeff * (baselineCellTemp - 25));
  const baselinePower = Math.max(0, state.panelArea * state.panelEfficiency * baselineEffectiveIrr * baselineTempFactor);
  state.calc.baselinePower = baselinePower;

  // 무편광 대비 비율
  state.calc.ratioNoPolar = (baselinePower > 0) ? ((power / baselinePower) * 100) : 0;

  // 전압 및 전류 근사값
  state.calc.estVoltage = (power > 0) ? (5.8 + (effectiveIrr / 1000) * 0.4) : 0;
  state.calc.estCurrent = (state.calc.estVoltage > 0) ? (power / state.calc.estVoltage * 1000) : 0; // mA 단위

  // UI 반영
  updateUI();
  updateCharts();
}

// ==========================================
// 3. UI 갱신 및 데이터 바인딩
// ==========================================
function updateUI() {
  // 수치 디스플레이
  const elValP1 = document.getElementById('val-polar1');
  if (elValP1) elValP1.textContent = `${state.polar1}°`;
  const elValP2 = document.getElementById('val-polar2');
  if (elValP2) elValP2.textContent = `${state.polar2}°`;

  const elDiff = document.getElementById('diff-angle-display');
  if (elDiff) elDiff.textContent = `${Math.round(state.calc.diffAngle)}°`;
  const elTrans = document.getElementById('transmittance-display');
  if (elTrans) elTrans.textContent = `${(state.calc.polarTrans * 100).toFixed(0)}%`;

  const elMainSlider = document.getElementById('slider-main-angle');
  if (elMainSlider && parseInt(elMainSlider.value) !== Math.round(state.calc.diffAngle)) {
    elMainSlider.value = Math.round(state.calc.diffAngle);
  }

  // 10도 버튼 활성화 상태 동기화
  document.querySelectorAll('.fast-deg-btn').forEach(btn => {
    const deg = parseInt(btn.textContent);
    if (deg === Math.round(state.calc.diffAngle)) {
      btn.classList.add('active', 'bg-indigo-600', 'text-white', 'font-bold');
      btn.classList.remove('bg-slate-800', 'text-slate-300');
    } else {
      btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'font-bold');
      btn.classList.add('bg-slate-800', 'text-slate-300');
    }
  });

  const elTilt = document.getElementById('val-tilt');
  if (elTilt) elTilt.textContent = `${state.tilt}° (인천 최적)`;
  const azimLabel = (state.azimuth === 180) ? '180° (정남향)' :
                    (state.azimuth === 90) ? '90° (정동향)' :
                    (state.azimuth === 270) ? '270° (정서향)' : `${state.azimuth}°`;
  const elAzim = document.getElementById('val-azimuth');
  if (elAzim) elAzim.textContent = azimLabel;

  // 시간 표시 (ex: 12.5 -> 12:30)
  const hours = Math.floor(state.simHour);
  const minutes = Math.round((state.simHour - hours) * 60);
  const elHour = document.getElementById('val-hour');
  if (elHour) elHour.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  // 상단 지표 카드
  const elEffIrr = document.getElementById('metric-effective-irr');
  if (elEffIrr) elEffIrr.textContent = state.calc.effectiveIrr.toFixed(1);
  const elSunElev = document.getElementById('metric-sun-elev');
  if (elSunElev) elSunElev.textContent = `${state.calc.sunElev.toFixed(1)}°`;
  const elInc = document.getElementById('metric-inc-angle');
  if (elInc) elInc.textContent = `${state.calc.incAngle.toFixed(1)}°`;

  const elPolarTrans = document.getElementById('metric-polar-trans');
  if (elPolarTrans) elPolarTrans.textContent = (state.calc.polarTrans * 100).toFixed(1);
  const polarDesc = (state.polarMode === 'none') ? '편광판 미적용 상태 (자연광 100%)' :
                    `회전 각도차: ${Math.round(state.calc.diffAngle)}° (말뤼스 cos²Δθ)`;
  const elPolarDesc = document.getElementById('metric-polar-desc');
  if (elPolarDesc) elPolarDesc.textContent = polarDesc;

  const elPowerWatt = document.getElementById('metric-power-watt');
  if (elPowerWatt) elPowerWatt.textContent = state.calc.power.toFixed(3);
  const elVolt = document.getElementById('metric-voltage');
  if (elVolt) elVolt.textContent = `${state.calc.estVoltage.toFixed(2)}V`;

  const elRatio = document.getElementById('metric-ratio-nopolar');
  if (elRatio) elRatio.textContent = `${state.calc.ratioNoPolar.toFixed(1)}%`;

  // HUD
  const elHudInc = document.getElementById('hud-inc');
  if (elHudInc) elHudInc.textContent = `${state.calc.incAngle.toFixed(0)}°`;
  const elHudDelta = document.getElementById('hud-delta');
  if (elHudDelta) elHudDelta.textContent = `${Math.round(state.calc.diffAngle)}°`;

  // 캔버스 안내 문구
  const canvasText = (state.polarMode === 'none')
    ? '현재 편광판이 없는 상태입니다. 입사각(θi)에 따른 코사인 발전량 변화를 관찰할 수 있습니다.'
    : `두 편광판이 포개어진 원형 카세트(회전각 ${Math.round(state.calc.diffAngle)}°): 각도가 커질수록 겹친 영역이 어두워지며 90°에서 빛이 차단됩니다.`;
  const elOverlay = document.getElementById('canvas-overlay-text');
  if (elOverlay) elOverlay.textContent = canvasText;

  const polarMainControl = document.getElementById('polar-main-control');
  if (polarMainControl) {
    polarMainControl.style.opacity = (state.polarMode === 'none') ? '0.35' : '1';
    polarMainControl.style.pointerEvents = (state.polarMode === 'none') ? 'none' : 'auto';
  }

  // 데이터 테이블 갱신
  populateDataTable();
}

// 하단 시뮬레이션 데이터 테이블 채우기 (각도차 0° ~ 90° 스위프 표)
function populateDataTable() {
  const tbody = document.getElementById('sim-data-tbody');
  if (!tbody) return;

  const angles = [0, 15, 30, 45, 60, 75, 90];
  let html = '';

  angles.forEach((diff) => {
    const isCurrent = Math.abs(diff - state.calc.diffAngle) < 5;
    const trans = calculatePolarizerTransmittance(
      state.polarMode,
      0,
      diff,
      state.filmTransmittance,
      state.extinctionRatio
    );
    const effIrr = (state.calc.effectiveIrr / (state.calc.polarTrans || 1)) * trans;
    const p = Math.max(0, state.panelArea * state.panelEfficiency * effIrr);
    const ratio = (state.calc.baselinePower > 0) ? (p / state.calc.baselinePower * 100) : 0;

    html += `
      <tr class="${isCurrent ? 'bg-indigo-950/60 font-bold text-amber-300' : 'hover:bg-slate-800/50'}">
        <td class="p-2">${isCurrent ? '👉 현재 설정' : '샘플각'}</td>
        <td class="p-2">${state.polarMode === 'dual' ? '이중 편광' : state.polarMode === 'single' ? '단일 편광' : '무편광'}</td>
        <td class="p-2">${state.polarMode === 'dual' ? '0°' : `${state.polar1}°`}</td>
        <td class="p-2">${state.polarMode === 'dual' ? `${diff}°` : '-'}</td>
        <td class="p-2 font-bold text-sky-400">${diff}°</td>
        <td class="p-2">${(trans * 100).toFixed(1)}%</td>
        <td class="p-2">${state.tilt}°</td>
        <td class="p-2">${effIrr.toFixed(1)} W/m²</td>
        <td class="p-2 font-bold text-emerald-400">${p.toFixed(3)} W</td>
        <td class="p-2 text-indigo-300">${ratio.toFixed(1)}%</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ==========================================
// 4. 실시간 날씨 API 연동 (인천 부광고 좌표)
// ==========================================
async function fetchIncheonWeather() {
  const weatherSummaryEl = document.getElementById('weather-summary');
  weatherSummaryEl.textContent = '인천 기상 관측소 일사량 동기화 중...';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.location.lat}&longitude=${state.location.lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,weather_code,direct_normal_irradiance,diffuse_radiation,shortwave_radiation_instant&daily=sunrise,sunset&timezone=Asia%2FSeoul`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    const curr = data.current;
    state.temperature = Math.round(curr.temperature_2m);
    state.cloudCover = curr.cloud_cover || 0;

    // API 원본 데이터 보관
    state.rawApiData = {
      dni: curr.direct_normal_irradiance ?? 0,
      dhi: curr.diffuse_radiation ?? 0,
      ghi: curr.shortwave_radiation_instant ?? 0,
      temp: curr.temperature_2m ?? 0,
      cloud: curr.cloud_cover ?? 0,
      humidity: curr.relative_humidity_2m ?? 0,
      sunrise: (data.daily && data.daily.sunrise) ? data.daily.sunrise[0]?.split('T')[1] : '07:05',
      sunset: (data.daily && data.daily.sunset) ? data.daily.sunset[0]?.split('T')[1] : '17:25'
    };

    // 일사량 산출 (직달일사량 + 단파 복사량 활용)
    let irr = curr.shortwave_radiation_instant || (curr.direct_normal_irradiance + curr.diffuse_radiation);
    if (!irr || irr < 50) {
      // 밤이거나 실내 실험을 고려한 주간 맑은 날 디폴트값 (950 W/m²)
      irr = 920 * (1 - (state.cloudCover / 100) * 0.7);
    }
    state.baseIrradiance = Math.round(irr);

    // 날씨 설명
    const weatherMap = {
      0: '☀️ 맑음',
      1: '🌤️ 대체로 맑음',
      2: '⛅ 구름 조금',
      3: '☁️ 흐림',
      45: '🌫️ 안개',
      51: '🌦️ 이슬비',
      61: '🌧️ 비',
      71: '❄️ 눈'
    };
    const desc = weatherMap[curr.weather_code] || '☀️ 맑음';
    state.weatherDesc = `${desc} (${state.temperature}°C, 운량 ${state.cloudCover}%)`;

    weatherSummaryEl.textContent = `인천 부광고: ${state.weatherDesc} | 외기일사 ${state.baseIrradiance}W/m²`;

    // 인풋 필드 동기화
    document.getElementById('input-irradiance').value = state.baseIrradiance;
    document.getElementById('input-temperature').value = state.temperature;

    updateCalculations();
    updateApiModalUI();
  } catch (err) {
    console.warn('Weather API load failed, using local simulation presets:', err);
    weatherSummaryEl.textContent = '인천 부광고: ☀️ 쾌청 (22°C, 일사 950 W/m² - 표준 시뮬레이션)';
    state.baseIrradiance = 950;
    state.temperature = 22;
    state.rawApiData = {
      dni: 780,
      dhi: 170,
      ghi: 950,
      temp: 22,
      cloud: 10,
      humidity: 55,
      sunrise: '07:05',
      sunset: '17:25'
    };
    updateCalculations();
    updateApiModalUI();
  }
}

function updateApiModalUI() {
  const d = state.rawApiData;
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('api-dni', `${d.dni.toFixed(1)} W/m²`);
  setEl('api-dhi', `${d.dhi.toFixed(1)} W/m²`);
  setEl('api-ghi', `${d.ghi.toFixed(1)} W/m²`);
  setEl('api-temp', `${d.temp.toFixed(1)} °C`);
  setEl('api-cloud', `${d.cloud} %`);
  setEl('api-humidity', `${d.humidity} %`);
  setEl('api-suntime', `${d.sunrise} / ${d.sunset}`);
}

// ==========================================
// 5. 차트 시각화 (Chart.js)
// ==========================================
let malusChartInstance = null;
let diurnalChartInstance = null;
let compareChartInstance = null;

function initCharts() {
  // 1. 말뤼스의 법칙 차트 초기화 (linear scale 적용으로 0°~90° 10개 실측점 완벽 표시)
  const elMalus = document.getElementById('malusChart');
  if (elMalus) {
    const ctxMalus = elMalus.getContext('2d');
    malusChartInstance = new Chart(ctxMalus, {
      type: 'line',
      data: {
        datasets: [
          {
            label: '말뤼스 이론 곡선',
            data: [],
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 0
          },
          {
            label: '현재 설정 각도 위치',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            pointRadius: 7,
            pointHoverRadius: 9,
            showLine: false
          },
          {
            label: '부광고 실측값 (측정값 1~10)',
            data: [],
            borderColor: '#10b981',
            backgroundColor: '#34d399',
            pointRadius: 6,
            pointHoverRadius: 9,
            pointStyle: 'rectRot',
            showLine: true,
            borderDash: [3, 3],
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Pretendard', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = ctx.raw;
                if (ctx.datasetIndex === 2) {
                  return `[실측] ${raw.file || ''} (${raw.x}°): 전압 ${raw.volt}V, 밝기 ${raw.bright}Lux, 값 ${raw.y?.toFixed(3)}`;
                }
                return `${ctx.dataset.label}: ${raw.y?.toFixed(3)} (${raw.x}°)`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 180,
            title: { display: true, text: '편광판 사이 각도차 (Δθ, 도)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: {
              color: '#94a3b8',
              stepSize: 15,
              callback: (val) => `${val}°`
            }
          },
          y: {
            title: { display: true, text: '발전 전력 (W)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        }
      }
    });
  }

  // 2. 시간대별 발전량 차트 초기화
  const elDiurnal = document.getElementById('diurnalChart');
  if (elDiurnal) {
    const ctxDiurnal = elDiurnal.getContext('2d');
    diurnalChartInstance = new Chart(ctxDiurnal, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '무편광 시 하루 발전 곡선 (W)',
            data: [],
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: '현재 편광 설정 하의 발전 곡선 (W)',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Pretendard', size: 11 } }
          }
        },
        scales: {
          x: {
            title: { display: true, text: '하루 시간 (06:00 ~ 19:00)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            title: { display: true, text: '발전 전력 (W)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        }
      }
    });
  }
}

function updateCharts() {
  if (malusChartInstance) {
    const metric = state.mainChartMetric || 'power';
    const activeData = (state.activeDataset === 'caseB') ? BUKWANG_REAL_DATA.caseB : BUKWANG_REAL_DATA.caseA;
    const baseP = (state.calc.baselinePower > 0) ? state.calc.baselinePower : 0.85;
    const baseB = activeData[0].bright;
    const baseV = activeData[0].volt;

    // 1. 말뤼스 곡선 데이터 생성 (0° ~ 180°, 1° 간격의 정확한 객체 배열)
    const malusCurve = [];
    for (let d = 0; d <= 180; d += 1) {
      const trans = calculatePolarizerTransmittance(
        state.polarMode,
        0,
        d,
        state.filmTransmittance,
        state.extinctionRatio
      );
      let valY = 0;
      if (metric === 'power') {
        const eff = (state.calc.effectiveIrr / (state.calc.polarTrans || 1)) * trans;
        valY = Math.max(0, state.panelArea * state.panelEfficiency * eff);
      } else if (metric === 'volt') {
        // 태양전지 개방전압 Voc 모델 (빛이 차단되어도 5.5~6.4V 유지되는 물리 특성)
        const relI = Math.max(0.001, trans / 0.43);
        valY = baseV + 0.35 * Math.log10(relI);
      } else if (metric === 'bright') {
        // 밝기 모델: 기저 배경광(약 830Lux) + 편광 투과광
        valY = 840 + (baseB - 840) * (trans / 0.43);
      }
      malusCurve.push({ x: d, y: Number(valY.toFixed(4)) });
    }

    // 2. 현재 설정 각도 마커
    let currentValY = 0;
    if (metric === 'power') {
      currentValY = state.calc.power;
    } else if (metric === 'volt') {
      const relI = Math.max(0.001, state.calc.polarTrans / 0.43);
      currentValY = baseV + 0.35 * Math.log10(relI);
    } else {
      currentValY = 840 + (baseB - 840) * (state.calc.polarTrans / 0.43);
    }

    // 3. 부광고 실측값 10개 점 (0°, 10°, 20°, ..., 90°)
    const overlayPoints = activeData.map(d => {
      let actY = 0;
      if (metric === 'power') {
        const effRatio = Math.max(0.01, (d.bright - 830) / (baseB - 830));
        actY = baseP * 0.43 * effRatio;
      } else if (metric === 'volt') {
        actY = d.volt;
      } else if (metric === 'bright') {
        actY = d.bright;
      }
      return {
        x: d.angle,
        y: Number(actY.toFixed(3)),
        file: d.file,
        volt: d.volt,
        bright: d.bright
      };
    });

    // y축 라벨 및 제목 설정
    let yTitle = '발전 전력 (W)';
    let curveLabel = '말뤼스 이론 전력 곡선 (W)';
    let pointLabel = '부광고 실측 환산 전력 (W)';
    let beginZero = true;

    if (metric === 'volt') {
      yTitle = '전압 (V)';
      curveLabel = '태양전지 Voc 이론 곡선 (V)';
      pointLabel = '부광고 실측 전압 (V)';
      beginZero = false;
    } else if (metric === 'bright') {
      yTitle = '밝기 (Lux)';
      curveLabel = '이론 투과 밝기 곡선 (Lux)';
      pointLabel = '부광고 실측 센서 밝기 (Lux)';
      beginZero = false;
    }

    if (malusChartInstance.options.scales.y) {
      malusChartInstance.options.scales.y.title.text = yTitle;
      malusChartInstance.options.scales.y.beginAtZero = beginZero;
    }

    malusChartInstance.data.datasets[0].label = curveLabel;
    malusChartInstance.data.datasets[0].data = malusCurve;

    malusChartInstance.data.datasets[1].data = [
      { x: Math.round(state.calc.diffAngle), y: Number(currentValY.toFixed(4)) }
    ];

    if (state.showRealOverlay) {
      malusChartInstance.data.datasets[2].label = pointLabel;
      malusChartInstance.data.datasets[2].data = overlayPoints;
      malusChartInstance.data.datasets[2].hidden = false;
    } else {
      malusChartInstance.data.datasets[2].data = [];
      malusChartInstance.data.datasets[2].hidden = true;
    }

    malusChartInstance.update('none');
  }

  // 2. 시간대별 발전량 차트 갱신
  if (diurnalChartInstance) {
    const hourLabels = [];
    const baseCurve = [];
    const polarCurve = [];
    for (let h = 6; h <= 19; h += 0.5) {
      const hh = Math.floor(h);
      const mm = (h % 1 === 0) ? '00' : '30';
      hourLabels.push(`${hh}:${mm}`);

      const sol = calculateSolarPosition(state.location.lat, state.location.lon, h);
      if (sol.elev <= 0) {
        baseCurve.push(0);
        polarCurve.push(0);
      } else {
        const inc = calculateIncidenceAngle(sol.elev, sol.azim, state.tilt, state.azimuth);
        const cosF = Math.max(0, Math.cos(inc * (Math.PI / 180)));
        const baseIrr = state.baseIrradiance * cosF;
        const baseP = Math.max(0, state.panelArea * state.panelEfficiency * baseIrr);
        baseCurve.push(baseP);
        polarCurve.push(baseP * state.calc.polarTrans);
      }
    }

    diurnalChartInstance.data.labels = hourLabels;
    diurnalChartInstance.data.datasets[0].data = baseCurve;
    diurnalChartInstance.data.datasets[1].data = polarCurve;
    diurnalChartInstance.update('none');
  }
}

// ==========================================
// 6. 인터랙티브 3D/2D 광학 캔버스 렌더링
// ==========================================
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
window.addEventListener('resize', resizeCanvas);

function drawOpticalScene() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.clearRect(0, 0, w, h);
  state.animFrame += 0.03;

  // 배경 별빛 / 대기 광학 분위기
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#020617');
  grad.addColorStop(0.6, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 1. 태양 위치 계산 (고도와 방위각에 따른 화면 좌표 매핑)
  // 좌상단 영역에 태양 렌더링 (고도 0°~90°에 따라 수직 이동)
  const elevNorm = Math.min(1, Math.max(0, state.calc.sunElev / 85));
  const sunX = w * 0.16 + ((state.calc.sunAzim - 180) / 180) * (w * 0.12);
  const sunY = h * 0.65 - (elevNorm * (h * 0.5));

  // 태양 그리기 (발광 코로나 및 글로우)
  ctx.save();
  const sunRadius = 26;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 70);
  sunGlow.addColorStop(0, 'rgba(251, 191, 36, 1)');
  sunGlow.addColorStop(0.3, 'rgba(245, 158, 11, 0.6)');
  sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px Pretendard';
  ctx.textAlign = 'center';
  ctx.fillText('☀️ 태양', sunX, sunY - 32);
  ctx.restore();

  // 2. 우측 하단 태양광 패널 (3D 투시 렌더링)
  const panelCenterX = w * 0.78;
  const panelCenterY = h * 0.68;
  const panelTiltRad = (state.tilt * Math.PI) / 180;

  // 패널 지지대 및 바닥 그라운드 라인
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, panelCenterY + 55);
  ctx.lineTo(w * 0.95, panelCenterY + 55);
  ctx.stroke();

  // 지지대 삼각 프레임
  ctx.strokeStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(panelCenterX - 20, panelCenterY + 55);
  ctx.lineTo(panelCenterX, panelCenterY);
  ctx.lineTo(panelCenterX + 20, panelCenterY + 55);
  ctx.stroke();
  ctx.restore();

  // 패널 회전 그리기
  ctx.save();
  ctx.translate(panelCenterX, panelCenterY);
  ctx.rotate(-panelTiltRad * 0.7); // 3D 시각적 원근을 위한 회전

  const pWidth = 120;
  const pHeight = 22;

  // 패널 셀 본체 (푸른 태양전지 실리콘 웨이퍼)
  const panelGrad = ctx.createLinearGradient(-pWidth / 2, 0, pWidth / 2, 0);
  panelGrad.addColorStop(0, '#1e3a8a');
  panelGrad.addColorStop(0.5, '#2563eb');
  panelGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = panelGrad;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-pWidth / 2, -pHeight / 2, pWidth, pHeight, 4);
  ctx.fill();
  ctx.stroke();

  // 패널 그리드 라인 (태양전지 전극 버스바)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  for (let gx = -pWidth / 2 + 15; gx < pWidth / 2; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, -pHeight / 2);
    ctx.lineTo(gx, pHeight / 2);
    ctx.stroke();
  }

  // 발전 중일 때 패널 발광 에너지 이펙트
  if (state.calc.power > 0.05) {
    ctx.strokeStyle = `rgba(52, 211, 153, ${Math.min(0.8, state.calc.power * 0.5)})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();

  // 패널 라벨
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Pretendard';
  ctx.textAlign = 'center';
  ctx.fillText(`태양광 패널 (경사 ${state.tilt}°)`, panelCenterX, panelCenterY + 75);

  // 3. 광선 경로 및 포개어진 이중 편광판 카세트 시각화
  const targetX = panelCenterX;
  const targetY = panelCenterY;

  // 편광판 카세트 위치 (광선 경로 중간 지점)
  const cassettePos = {
    x: sunX + (targetX - sunX) * 0.52,
    y: sunY + (targetY - sunY) * 0.52
  };

  if (state.polarMode === 'none') {
    // 편광판 없음: 태양에서 패널로 자연광 직접 입사
    drawLightRay(sunX, sunY, targetX, targetY, 1.0, 'unpolarized');
  } else {
    // 편광판 2장 겹침: 태양 -> 카세트(자연광) -> 패널(말뤼스 투과광)
    drawLightRay(sunX, sunY, cassettePos.x, cassettePos.y, 1.0, 'unpolarized');
    
    // 카세트 통과 후 빛: 투과율(cos²Δθ)에 따라 굵기와 밝기가 줄어듦
    const postIntensity = state.calc.polarTrans;
    drawLightRay(cassettePos.x, cassettePos.y, targetX, targetY, postIntensity, 'polarized-post');

    // 실제 실험실 2장 포개어진 회전 편광 카세트 렌더링
    drawLayeredPolarizerCassette(cassettePos.x, cassettePos.y, state.calc.diffAngle);
  }

  requestAnimationFrame(drawOpticalScene);
}

// 실제 실험실 형태의 [2장 포개어진 원형 편광판 카세트] 렌더링
function drawLayeredPolarizerCassette(cx, cy, deltaDeg) {
  ctx.save();
  ctx.translate(cx, cy);

  const r = 44; // 렌즈 반경
  const transRatio = Math.max(0.005, Math.pow(Math.cos(deltaDeg * Math.PI / 180), 2)); // 말뤼스 투과비 (0 ~ 1)

  // 1. 외곽 회전 다이얼 베젤 링 (금속/플라스틱 프레임)
  ctx.beginPath();
  ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 각도 눈금 마킹 (0°, 30°, 60°, 90°)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let a = 0; a <= 90; a += 15) {
    const rad = (a * Math.PI) / 180;
    const x1 = Math.cos(rad) * (r + 7);
    const y1 = Math.sin(rad) * (r + 7);
    const x2 = Math.cos(rad) * (r + 13);
    const y2 = Math.sin(rad) * (r + 13);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 2. 포개어진 두 편광판의 겹친 광학 렌즈 중심
  // 투과율(cos²Δθ)에 따라 렌즈 밝기가 청록색(투명 100%) -> 짙은 남색 -> 완전 암흑(90° 직교 0%)으로 변화
  const alphaDark = 1 - transRatio; // 어두움 정도 (0: 투명, 1: 완전 차단)
  const lensGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
  lensGrad.addColorStop(0, `rgba(${Math.round(6 + 30 * transRatio)}, ${Math.round(182 * transRatio)}, ${Math.round(212 * transRatio)}, ${0.3 + 0.6 * transRatio})`);
  lensGrad.addColorStop(0.85, `rgba(15, 23, 42, ${0.4 + 0.55 * alphaDark})`);
  lensGrad.addColorStop(1, '#020617');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = lensGrad;
  ctx.fill();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 직교 시 렌즈 내부가 완전히 암전되는 딤 레이어
  if (alphaDark > 0.1) {
    ctx.beginPath();
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(2, 6, 23, ${Math.min(0.96, alphaDark * 1.05)})`;
    ctx.fill();
  }

  // 3. 제 1 편광판 격자 슬릿 (고정 0° 투과축: 수직선)
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.2;
  for (let x = -r + 6; x < r; x += 8) {
    const chord = Math.sqrt(Math.max(0, r * r - x * x));
    ctx.beginPath();
    ctx.moveTo(x, -chord);
    ctx.lineTo(x, chord);
    ctx.stroke();
  }
  ctx.restore();

  // 4. 제 2 편광판 격자 슬릿 (Δθ 각도만큼 회전되어 겹침)
  ctx.save();
  ctx.rotate((deltaDeg * Math.PI) / 180);
  ctx.strokeStyle = `rgba(192, 132, 252, ${Math.max(0.2, 0.7 * transRatio)})`;
  ctx.lineWidth = 1.2;
  for (let x = -r + 6; x < r; x += 8) {
    const chord = Math.sqrt(Math.max(0, r * r - x * x));
    ctx.beginPath();
    ctx.moveTo(x, -chord);
    ctx.lineTo(x, chord);
    ctx.stroke();
  }

  // 회전판 투과축 화살표
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r + 4);
  ctx.lineTo(0, r - 4);
  ctx.stroke();

  // 회전 조절 손잡이 (다이얼 레버)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -r - 7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. 직관적 라벨 표시
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px Pretendard';
  ctx.textAlign = 'center';
  ctx.fillText('포개어진 편광판', 0, -r - 20);

  ctx.fillStyle = (deltaDeg === 90) ? '#f43f5e' : '#38bdf8';
  ctx.font = 'bold 11px JetBrains Mono';
  const statusText = (deltaDeg === 90) ? '90° (완전 차단)' : `${deltaDeg}° (투과 ${(transRatio * 100).toFixed(0)}%)`;
  ctx.fillText(statusText, 0, r + 26);

  ctx.restore();
}

// 광선 및 파동 애니메이션 렌더링
function drawLightRay(x1, y1, x2, y2, intensity, type) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // 기본 빔 글로우
  const beamWidth = Math.max(1.5, 14 * intensity);
  const alpha = Math.max(0.05, Math.min(0.9, intensity * 0.95));

  let strokeStyle = `rgba(251, 191, 36, ${alpha})`;
  if (type === 'polarized-post') {
    strokeStyle = `rgba(56, 189, 248, ${alpha})`;
  }

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = beamWidth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(dist, 0);
  ctx.stroke();

  // 진행하는 광파동 (파티클 효과)
  if (intensity > 0.02) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    const waveAmp = (type === 'unpolarized') ? 8 : (7 * Math.sqrt(intensity));

    ctx.beginPath();
    for (let i = 0; i <= dist; i += 4) {
      const wY = Math.sin((i / 15) - (state.animFrame * 5)) * waveAmp;
      if (i === 0) ctx.moveTo(i, wY);
      else ctx.lineTo(i, wY);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// ==========================================
// 7. SheetJS 엑셀 다운로드 & 실제 실험 비교
// ==========================================

// 1. 현재 시뮬레이션 데이터를 담은 엑셀 다운로드
function exportSimulationExcel() {
  if (typeof XLSX === 'undefined') {
    alert('엑셀 라이브러리를 로드하지 못했습니다.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // 시트 1: 시뮬레이션 조건 요약
  const summaryData = [
    ['인천 부광고등학교 태양광 & 편광 시뮬레이션 데이터'],
    ['생성일시', new Date().toLocaleString()],
    ['위치', `${state.location.name} (위도 ${state.location.lat}°N, 경도 ${state.location.lon}°E)`],
    ['날씨 상태', state.weatherDesc],
    ['기준 일사량(W/m²)', state.baseIrradiance],
    ['외기 온도(°C)', state.temperature],
    ['패널 설치 경사각(도)', state.tilt],
    ['패널 설치 방위각(도)', state.azimuth],
    ['편광 모드', state.polarMode === 'dual' ? '이중 편광판' : state.polarMode === 'single' ? '단일 편광판' : '편광판 없음'],
    ['제1 편광판 각도', `${state.polar1}°`],
    ['제2 편광판 각도', `${state.polar2}°`],
    ['각도차 (Δθ)', `${state.calc.diffAngle}°`],
    ['이론 편광 투과율(%)', `${(state.calc.polarTrans * 100).toFixed(2)}%`],
    ['도달 유효 일사량(W/m²)', state.calc.effectiveIrr.toFixed(2)],
    ['예상 발전 전력(W)', state.calc.power.toFixed(4)],
    ['무편광 대비 발전비(%)', `${state.calc.ratioNoPolar.toFixed(2)}%`]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '조건_요약');

  // 시트 2: 말뤼스의 법칙 각도별 시뮬레이션 전력 표 (0° ~ 90°)
  const sweepData = [
    ['각도차(Δθ, 도)', '말뤼스 이론투과율(%)', '유효 일사량(W/m²)', '이론 발전전력(W)', '예상전압(V)', '예상전류(mA)']
  ];

  for (let diff = 0; diff <= 90; diff += 5) {
    const trans = calculatePolarizerTransmittance(
      'dual',
      0,
      diff,
      state.filmTransmittance,
      state.extinctionRatio
    );
    const eff = (state.calc.effectiveIrr / (state.calc.polarTrans || 1)) * trans;
    const p = Math.max(0, state.panelArea * state.panelEfficiency * eff);
    const v = (p > 0) ? (5.8 + (eff / 1000) * 0.4) : 0;
    const i = (v > 0) ? (p / v * 1000) : 0;
    sweepData.push([diff, Number((trans * 100).toFixed(2)), Number(eff.toFixed(2)), Number(p.toFixed(4)), Number(v.toFixed(2)), Number(i.toFixed(1))]);
  }
  const wsSweep = XLSX.utils.aoa_to_sheet(sweepData);
  XLSX.utils.book_append_sheet(wb, wsSweep, '각도별_말뤼스_시뮬레이션');

  // 파일 다운로드 실행
  const fileName = `부광고_태양광편광_시뮬레이션_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 2. 학생 실험 기록용 빈 엑셀 템플릿 다운로드
function downloadExperimentTemplate() {
  if (typeof XLSX === 'undefined') return;

  const wb = XLSX.utils.book_new();
  const templateData = [
    ['[부광고 과학 탐구] 태양광 패널 및 편광판 각도별 발전 실험 기록표'],
    ['학번/이름:', '', '실험 날짜:', '', '날씨:', ''],
    ['* 안내: 각도차(도)에 따라 멀티미터로 측정한 전압(V)과 전류(mA)를 입력하면 전력이 자동 계산됩니다.'],
    ['실험번호', '제1편광판 각도(θ1, 도)', '제2편광판 각도(θ2, 도)', '사이 각도차(Δθ, 도)', '측정 전압(V)', '측정 전류(mA)', '측정 전력(W)', '비고(오차 원인 등)'],
    [1, 0, 0, 0, 6.10, 145.0, 0.885, '평행 투과 (최대)'],
    [2, 0, 15, 15, 6.05, 134.5, 0.814, ''],
    [3, 0, 30, 30, 5.95, 108.2, 0.644, ''],
    [4, 0, 45, 45, 5.80, 72.8, 0.422, '이론상 50% 수준'],
    [5, 0, 60, 60, 5.50, 36.4, 0.200, ''],
    [6, 0, 75, 75, 4.80, 11.2, 0.054, ''],
    [7, 0, 90, 90, 1.20, 2.5, 0.003, '직교 차단 (미량 누설광)']
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, '실험_측정_기록표');
  XLSX.writeFile(wb, '부광고_태양광_편광실험_학생양식.xlsx');
}

// 3. 학생이 작성한 실제 실험 엑셀 파일 파싱 및 비교
function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    parseExperimentRows(rows);
  };
  reader.readAsArrayBuffer(file);
}

// 4. 부광고 실측값 모달 렌더링 및 지표별 비교 함수
function loadBukwangComparison(datasetKey, metricKey) {
  state.activeDataset = datasetKey || state.activeDataset || 'caseA';
  state.activeMetric = metricKey || state.activeMetric || 'bright';

  const rawList = (state.activeDataset === 'caseB') ? BUKWANG_REAL_DATA.caseB : BUKWANG_REAL_DATA.caseA;
  const datasetName = (state.activeDataset === 'caseB') ? '측정값 시간순 (13:10~13:26)' : '측정값 (1)~(10) 번호순';
  document.getElementById('metric-dataset-name').textContent = datasetName;

  // 테이블 업데이트
  renderRealMeasureTable(rawList);

  // 비교 차트 업데이트
  renderComparisonWithMetric(rawList, state.activeMetric);
}

// 부광고 실측 세부 데이터 테이블 렌더링
function renderRealMeasureTable(dataList) {
  const tbody = document.getElementById('real-measure-tbody');
  if (!tbody) return;

  const baseB = dataList[0].bright;
  let html = '';
  dataList.forEach(d => {
    const ratio = (d.bright / baseB * 100).toFixed(1);
    html += `
      <tr class="hover:bg-slate-800/60">
        <td class="p-2 font-bold text-amber-300">${d.angle}°</td>
        <td class="p-2 text-slate-300">${d.file}</td>
        <td class="p-2 text-right text-indigo-300 font-semibold">${d.count}회</td>
        <td class="p-2 text-right text-emerald-400 font-bold">${d.volt.toFixed(3)} V</td>
        <td class="p-2 text-center text-slate-400 text-[10px]">${d.minV ? `${d.minV.toFixed(2)}~${d.maxV.toFixed(2)}` : '-'}</td>
        <td class="p-2 text-right text-sky-300 font-bold">${d.bright.toFixed(1)}</td>
        <td class="p-2 text-center text-slate-400 text-[10px]">${d.minB ? `${d.minB.toFixed(0)}~${d.maxB.toFixed(0)}` : '-'}</td>
        <td class="p-2 text-right text-slate-300">${d.temp.toFixed(1)} °C</td>
        <td class="p-2 text-right text-purple-300 font-bold">${ratio}%</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 지표별(상대투과율, 전압, 밝기Lux, 환산전력) 비교 렌더링
function renderComparisonWithMetric(dataList, metricType) {
  const metricDescEl = document.getElementById('compare-chart-metric-desc');
  const baseP = (state.calc.baselinePower > 0) ? state.calc.baselinePower : 0.85;
  const baseB = dataList[0].bright;
  const baseV = dataList[0].volt;

  // 연속적인 이론 곡선 (0° ~ 90°)
  const theoryCurve = [];
  for (let a = 0; a <= 90; a += 1) {
    const trans = calculatePolarizerTransmittance('dual', 0, a, state.filmTransmittance, state.extinctionRatio);
    let theoryY = 0;
    if (metricType === 'bright') {
      // 투과율 % (0°에서 100%, 90°에서 0%로 떨어지는 순수 편광 성분)
      theoryY = (trans / 0.43) * 100;
    } else if (metricType === 'volt') {
      // 태양전지 개방전압 Voc 모델: Voc = Voc0 + (kT/q)*ln(I/I0) -> 로그 감쇠 모델
      const relI = Math.max(0.001, trans / 0.43);
      theoryY = baseV + 0.35 * Math.log10(relI);
    } else if (metricType === 'lux') {
      // 원본 밝기 Lux 모델 (배경 840Lux + 편광 투과성분)
      theoryY = 840 + (baseB - 840) * (trans / 0.43);
    } else {
      // 환산 전력 P (W)
      const eff = (state.calc.effectiveIrr / (state.calc.polarTrans || 1)) * trans;
      theoryY = Math.max(0, state.panelArea * state.panelEfficiency * eff);
    }
    theoryCurve.push({ x: a, y: Math.max(0, theoryY) });
  }

  // 실측 데이터 포인트 매핑
  const scatterPoints = [];
  let sumAbsPctErr = 0;
  let count = 0;
  let ssTot = 0;
  let ssRes = 0;

  const actualValues = dataList.map(d => {
    if (metricType === 'bright') {
      // 배경광(830 Lux) 오프셋을 보정한 순수 편광 투과율 %
      const effLux = Math.max(0, d.bright - 830);
      const maxEffLux = Math.max(1, baseB - 830);
      return Math.min(110, (effLux / maxEffLux) * 100);
    } else if (metricType === 'volt') {
      return d.volt;
    } else if (metricType === 'lux') {
      return d.bright;
    } else {
      const effLux = Math.max(0, d.bright - 830);
      const maxEffLux = Math.max(1, baseB - 830);
      return baseP * 0.43 * (effLux / maxEffLux);
    }
  });

  const actualMean = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;

  dataList.forEach((d, idx) => {
    const actY = actualValues[idx];
    scatterPoints.push({
      x: d.angle,
      y: Number(actY.toFixed(3)),
      label: d.file,
      volt: d.volt,
      bright: d.bright
    });

    // 해당 각도의 이론값
    const trans = calculatePolarizerTransmittance('dual', 0, d.angle, state.filmTransmittance, state.extinctionRatio);
    let thY = 0;
    if (metricType === 'bright') {
      thY = (trans / 0.43) * 100;
    } else if (metricType === 'volt') {
      const relI = Math.max(0.001, trans / 0.43);
      thY = baseV + 0.35 * Math.log10(relI);
    } else if (metricType === 'lux') {
      thY = 840 + (baseB - 840) * (trans / 0.43);
    } else {
      const eff = (state.calc.effectiveIrr / (state.calc.polarTrans || 1)) * trans;
      thY = Math.max(0, state.panelArea * state.panelEfficiency * eff);
    }

    if (thY > 0.01) {
      sumAbsPctErr += Math.abs((actY - thY) / thY);
      count++;
    }
    ssTot += Math.pow(actY - actualMean, 2);
    ssRes += Math.pow(actY - thY, 2);
  });

  const mape = (count > 0) ? ((sumAbsPctErr / count) * 100).toFixed(1) : '-';
  const r2 = (ssTot > 0) ? Math.max(0, 1 - (ssRes / ssTot)).toFixed(3) : '0.90+';

  document.getElementById('metric-mape').textContent = `${mape}%`;
  document.getElementById('metric-r2').textContent = r2;
  document.getElementById('metric-sample-count').textContent = `${dataList.length} 개 (0°~90°)`;

  // 지표 설명
  let yAxisLabel = '';
  let theoryLabel = '';
  let scatterLabel = '';
  let beginZero = true;

  if (metricType === 'bright') {
    yAxisLabel = '편광 투과율 (%)';
    theoryLabel = '말뤼스 이론 곡선 (%)';
    scatterLabel = '실측 보정 투과율 (%)';
    metricDescEl.textContent = '지표: 편광 투과율 (말뤼스 cos²θ 매칭)';
    beginZero = true;
  } else if (metricType === 'volt') {
    yAxisLabel = '측정 전압 (V)';
    theoryLabel = '태양전지 Voc 이론 곡선 (V)';
    scatterLabel = '부광고 실측 전압 (V)';
    metricDescEl.textContent = '지표: 실제 센서 측정 전압 (V)';
    beginZero = false;
  } else if (metricType === 'lux') {
    yAxisLabel = '밝기 센서값 (Lux)';
    theoryLabel = '이론 밝기 곡선 (Lux)';
    scatterLabel = '실측 밝기 센서값 (Lux)';
    metricDescEl.textContent = '지표: 원본 센서 밝기 (Lux)';
    beginZero = false;
  } else {
    yAxisLabel = '발전 전력 (W)';
    theoryLabel = '시뮬레이션 이론 전력 (W)';
    scatterLabel = '실측 환산 전력 (W)';
    metricDescEl.textContent = '지표: 환산 발전 전력 (W)';
    beginZero = true;
  }

  // 차트 그리기
  const ctxCompare = document.getElementById('compareChart').getContext('2d');
  if (compareChartInstance) compareChartInstance.destroy();

  compareChartInstance = new Chart(ctxCompare, {
    type: 'line',
    data: {
      datasets: [
        {
          label: theoryLabel,
          data: theoryCurve,
          borderColor: '#818cf8',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 0
        },
        {
          label: scatterLabel,
          data: scatterPoints,
          borderColor: '#10b981',
          backgroundColor: '#34d399',
          pointRadius: 7,
          pointHoverRadius: 9,
          pointStyle: 'rectRot',
          showLine: true,
          borderDash: [3, 3],
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e2e8f0', font: { family: 'Pretendard', size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const r = ctx.raw;
              return `${ctx.dataset.label}: ${r.y?.toFixed(2)} (${r.x}°) [전압: ${r.volt || '-'}V, 밝기: ${r.bright || '-'}Lux]`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: '편광판 각도차 Δθ (도)', color: '#94a3b8' },
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: {
            color: '#94a3b8',
            stepSize: 10,
            callback: (v) => `${v}°`
          },
          min: 0,
          max: 90
        },
        y: {
          title: { display: true, text: yAxisLabel, color: '#94a3b8' },
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: { color: '#94a3b8' },
          beginAtZero: beginZero
        }
      }
    }
  });
}

// 엑셀 파싱 및 시뮬레이션 곡선과 비교 분석 (사용자 업로드 시)
function parseExperimentRows(rows) {
  let angleCol = -1;
  let powerCol = -1;
  let voltCol = -1;
  let currCol = -1;
  let startRow = 0;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').toLowerCase().trim();
      if (cell.includes('각도차') || cell.includes('delta') || cell.includes('θ') || cell.includes('angle')) {
        angleCol = c;
        startRow = r + 1;
      }
      if (cell.includes('측정 전력') || cell.includes('측정전력') || cell.includes('전력(w)') || cell.includes('power')) {
        powerCol = c;
      }
      if (cell.includes('전압')) voltCol = c;
      if (cell.includes('전류')) currCol = c;
    }
    if (angleCol !== -1 && (powerCol !== -1 || (voltCol !== -1 && currCol !== -1))) break;
  }

  if (angleCol === -1) angleCol = 3;
  if (powerCol === -1) powerCol = 6;

  const measuredData = [];
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const angleVal = parseFloat(row[angleCol]);
    let powerVal = parseFloat(row[powerCol]);

    if (isNaN(powerVal) && voltCol !== -1 && currCol !== -1) {
      const v = parseFloat(row[voltCol]);
      const i = parseFloat(row[currCol]);
      if (!isNaN(v) && !isNaN(i)) {
        powerVal = (v * i) / 1000;
      }
    }

    if (!isNaN(angleVal) && !isNaN(powerVal)) {
      measuredData.push({ angle: angleVal, volt: powerVal, bright: powerVal * 1000, file: '업로드 파일' });
    }
  }

  if (measuredData.length === 0) {
    alert('유효한 실험 데이터를 찾지 못했습니다. 템플릿 양식을 확인해주세요.');
    return;
  }

  document.getElementById('metric-dataset-name').textContent = '사용자 업로드 파일';
  renderRealMeasureTable(measuredData);
  renderComparisonWithMetric(measuredData, 'power');
}

// 가상 부광고 실험 샘플 데이터 원클릭 로드 (시연용)
window.loadSampleExperimentData = function() {
  const sample = [
    { angle: 0, measuredPower: 0.865 },
    { angle: 15, measuredPower: 0.802 },
    { angle: 30, measuredPower: 0.638 },
    { angle: 45, measuredPower: 0.428 },
    { angle: 60, measuredPower: 0.215 },
    { angle: 75, measuredPower: 0.059 },
    { angle: 90, measuredPower: 0.005 } // 소광비로 인한 미세 잔류 전력
  ];
  renderComparison(sample);
};

// ==========================================
// 8. 이벤트 리스너 등록 & 초기화
// ==========================================
function setupEventListeners() {
  // 편광판 모드 버튼
  document.querySelectorAll('.polar-mode-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.polar-mode-btn').forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
      btn.classList.add('active', 'bg-indigo-600', 'text-white');
      state.polarMode = btn.dataset.mode;
      updateCalculations();
    });
  });

  // 편광판 메인 각도 슬라이더 (0 ~ 90)
  document.getElementById('slider-main-angle')?.addEventListener('input', (e) => {
    const deg = parseInt(e.target.value);
    state.polar1 = 0;
    state.polar2 = deg;
    updateCalculations();
  });

  // 슬라이더 이벤트
  document.getElementById('slider-polar1')?.addEventListener('input', (e) => {
    state.polar1 = parseInt(e.target.value);
    updateCalculations();
  });
  document.getElementById('slider-polar2')?.addEventListener('input', (e) => {
    state.polar2 = parseInt(e.target.value);
    updateCalculations();
  });
  document.getElementById('slider-tilt').addEventListener('input', (e) => {
    state.tilt = parseInt(e.target.value);
    updateCalculations();
  });
  document.getElementById('slider-azimuth').addEventListener('input', (e) => {
    state.azimuth = parseInt(e.target.value);
    updateCalculations();
  });
  document.getElementById('slider-hour').addEventListener('input', (e) => {
    state.simHour = parseFloat(e.target.value);
    updateCalculations();
  });

  // 세부 설정 인풋
  document.getElementById('input-irradiance').addEventListener('change', (e) => {
    state.baseIrradiance = Math.max(0, parseFloat(e.target.value) || 0);
    updateCalculations();
  });
  document.getElementById('input-temperature').addEventListener('change', (e) => {
    state.temperature = parseFloat(e.target.value) || 20;
    updateCalculations();
  });
  document.getElementById('panel-area').addEventListener('change', (e) => {
    state.panelArea = parseFloat(e.target.value) || 0.05;
    updateCalculations();
  });
  document.getElementById('panel-efficiency').addEventListener('change', (e) => {
    state.panelEfficiency = (parseFloat(e.target.value) || 18.5) / 100;
    updateCalculations();
  });
  document.getElementById('panel-temp-coeff').addEventListener('change', (e) => {
    state.tempCoeff = (parseFloat(e.target.value) || -0.38) / 100;
    updateCalculations();
  });
  document.getElementById('film-transmittance').addEventListener('change', (e) => {
    state.filmTransmittance = (parseFloat(e.target.value) || 86) / 100;
    updateCalculations();
  });
  document.getElementById('extinction-ratio').addEventListener('change', (e) => {
    state.extinctionRatio = (parseFloat(e.target.value) || 0.05) / 100;
    updateCalculations();
  });

  // 날씨 소스 토글
  document.getElementById('source-live').addEventListener('click', () => {
    document.getElementById('source-live').classList.add('active', 'border-sky-500', 'bg-sky-500/20', 'text-sky-200');
    document.getElementById('source-manual').classList.remove('active', 'border-sky-500', 'bg-sky-500/20', 'text-sky-200');
    state.weatherSource = 'live';
    fetchIncheonWeather();
  });
  document.getElementById('source-manual').addEventListener('click', () => {
    document.getElementById('source-manual').classList.add('active', 'border-sky-500', 'bg-sky-500/20', 'text-sky-200');
    document.getElementById('source-live').classList.remove('active', 'border-sky-500', 'bg-sky-500/20', 'text-sky-200');
    state.weatherSource = 'manual';
    document.getElementById('weather-summary').textContent = '가상 커스텀 날씨 모드 작동 중';
  });
  document.getElementById('btn-refresh-weather').addEventListener('click', () => {
    fetchIncheonWeather();
  });

  // 하단 탭 전환
  const tabs = [
    { btn: 'tab-btn-malus', content: 'tab-content-malus', text: '각도차 Δθ (0°~180°) 변화에 따른 상대 투과율과 발전량 예측' },
    { btn: 'tab-btn-diurnal', content: 'tab-content-diurnal', text: '인천 부광고 일조 환경 기준 하루 발전량 곡선' },
    { btn: 'tab-btn-table', content: 'tab-content-table', text: '편광 각도별 상세 데이터 시뮬레이션 표' }
  ];

  tabs.forEach(t => {
    document.getElementById(t.btn).addEventListener('click', () => {
      tabs.forEach(other => {
        document.getElementById(other.btn).classList.remove('active', 'bg-indigo-600', 'text-white');
        document.getElementById(other.btn).classList.add('bg-slate-700', 'text-slate-300');
        document.getElementById(other.content).classList.add('hidden');
      });
      document.getElementById(t.btn).classList.add('active', 'bg-indigo-600', 'text-white');
      document.getElementById(t.btn).classList.remove('bg-slate-700', 'text-slate-300');
      document.getElementById(t.content).classList.remove('hidden');
      document.getElementById('chart-subtext').textContent = t.text;
    });
  });

  // 메인 차트 지표 선택 버튼들 (power, volt, bright)
  document.querySelectorAll('.main-metric-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.main-metric-btn').forEach(b => {
        b.classList.remove('active', 'bg-indigo-600', 'text-white');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'bg-indigo-600', 'text-white');
      btn.classList.remove('text-slate-400');
      state.mainChartMetric = btn.dataset.metric;
      updateCharts();
    });
  });

  // 메인 차트 실측값 오버레이 체크박스
  document.getElementById('chk-overlay-real')?.addEventListener('change', (e) => {
    state.showRealOverlay = e.target.checked;
    updateCharts();
  });

  // 부광고 실측값 모달 내부 데이터셋 전환 버튼
  document.getElementById('btn-dataset-caseA')?.addEventListener('click', () => {
    document.getElementById('btn-dataset-caseA').classList.add('bg-indigo-600', 'text-white');
    document.getElementById('btn-dataset-caseA').classList.remove('bg-slate-800', 'text-slate-300');
    document.getElementById('btn-dataset-caseB').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('btn-dataset-caseB').classList.add('bg-slate-800', 'text-slate-300');
    loadBukwangComparison('caseA', state.activeMetric);
    updateCharts();
  });

  document.getElementById('btn-dataset-caseB')?.addEventListener('click', () => {
    document.getElementById('btn-dataset-caseB').classList.add('bg-indigo-600', 'text-white');
    document.getElementById('btn-dataset-caseB').classList.remove('bg-slate-800', 'text-slate-300');
    document.getElementById('btn-dataset-caseA').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('btn-dataset-caseA').classList.add('bg-slate-800', 'text-slate-300');
    loadBukwangComparison('caseB', state.activeMetric);
    updateCharts();
  });

  // 비교 분석 지표 전환 버튼 (상대투과율, 전압, 밝기Lux, 환산전력)
  const metricBtns = [
    { id: 'btn-metric-bright', key: 'bright' },
    { id: 'btn-metric-volt', key: 'volt' },
    { id: 'btn-metric-lux', key: 'lux' },
    { id: 'btn-metric-power', key: 'power' }
  ];

  metricBtns.forEach(m => {
    document.getElementById(m.id)?.addEventListener('click', () => {
      metricBtns.forEach(other => {
        const btn = document.getElementById(other.id);
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      });
      const activeBtn = document.getElementById(m.id);
      activeBtn.classList.add('bg-emerald-600', 'text-white');
      activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
      state.activeMetric = m.key;
      loadBukwangComparison(state.activeDataset, m.key);
    });
  });

  // 모달 제어
  const compareModal = document.getElementById('compare-modal');
  const guideModal = document.getElementById('guide-modal');
  const apiModal = document.getElementById('api-modal');

  document.getElementById('btn-show-api-info')?.addEventListener('click', () => {
    updateApiModalUI();
    apiModal.classList.remove('hidden');
  });
  document.getElementById('close-api-modal')?.addEventListener('click', () => {
    apiModal.classList.add('hidden');
  });

  document.getElementById('btn-compare-modal').addEventListener('click', () => {
    compareModal.classList.remove('hidden');
    // 실제 부광고 실측값 데이터셋 자동 로드
    loadBukwangComparison('caseA', 'bright');
  });
  document.getElementById('close-compare-modal').addEventListener('click', () => {
    compareModal.classList.add('hidden');
  });

  document.getElementById('btn-open-guide').addEventListener('click', () => {
    guideModal.classList.remove('hidden');
  });
  document.getElementById('close-guide-modal').addEventListener('click', () => {
    guideModal.classList.add('hidden');
  });

  // 모달 바깥 클릭 시 닫기
  [compareModal, guideModal, apiModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
      });
    }
  });

  // 엑셀 관련 버튼
  document.getElementById('btn-export-excel').addEventListener('click', exportSimulationExcel);
  document.getElementById('btn-download-template').addEventListener('click', downloadExperimentTemplate);

  // 드롭존 및 파일 업로드
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('excel-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-400', 'bg-slate-800');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-400', 'bg-slate-800');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-400', 'bg-slate-800');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
}

// 10도 단위 빠른 각도 설정 헬퍼 (측정값 1~10 원클릭 매칭)
window.setFastAngle = function(deg) {
  state.polar1 = 0;
  state.polar2 = deg;
  state.polarMode = 'dual';

  document.querySelectorAll('.polar-mode-btn').forEach(b => {
    if (b.dataset.mode === 'dual') {
      b.classList.add('active', 'bg-indigo-600', 'text-white');
    } else {
      b.classList.remove('active', 'bg-indigo-600', 'text-white');
    }
  });

  const slider = document.getElementById('slider-main-angle');
  if (slider) slider.value = deg;

  updateCalculations();
};

// 간편 각도 설정 글로벌 헬퍼
window.setAngle = function(polarKey, deg) {
  if (polarKey === 'polar1') {
    state.polar1 = deg;
    document.getElementById('slider-polar1').value = deg;
  } else {
    state.polar2 = deg;
    document.getElementById('slider-polar2').value = deg;
  }
  updateCalculations();
};

window.setTilt = function(deg) {
  state.tilt = deg;
  document.getElementById('slider-tilt').value = deg;
  updateCalculations();
};

window.setAzimuth = function(deg) {
  state.azimuth = deg;
  document.getElementById('slider-azimuth').value = deg;
  updateCalculations();
};

// ==========================================
// 9. 앱 시작 진입점
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // Lucide 아이콘 초기화
  if (window.lucide) {
    lucide.createIcons();
  }

  // 캔버스 초기화
  resizeCanvas();

  // 이벤트 핸들러 바인딩
  setupEventListeners();

  // 차트 생성
  initCharts();

  // 부광고 실제 실험 데이터 초기 탑재
  loadBukwangComparison('caseA', 'bright');

  // 초기 날씨 조회 및 시뮬레이션 계산 시작
  fetchIncheonWeather();

  // 캔버스 렌더 루프 가동
  requestAnimationFrame(drawOpticalScene);
});
