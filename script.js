const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cabinet = document.getElementById('gameCabinet');

let score = 0;
let time = 60;
let timer;
let selectedDifficulty = 'normal';

let totalShots = 0;
let successfulShots = 0; 

// 물리 환경 설정
const gravity = 0.22;

// [확인] 시스템 기준점을 가로 340의 정중앙인 170으로 선언
const baseSpringX = 170; 
const baseSpringY = 390;

let ball = { x: baseSpringX, y: baseSpringY, vx: 0, vy: 0, radius: 11, isLaunched: false, color: '#ff4757' };
let spring = { x: baseSpringX, y: baseSpringY, dragStartX: 0, dragStartY: 0, offsetX: 0, offsetY: 0, isDragging: false };

// 일렬로 선 채점 구멍 배치 (Y축 115)
let holes = [
  { x: 45,  y: 115, r: 24, val: 0, color: '#ff4757' },
  { x: 115, y: 115, r: 24, val: 0, color: '#2ed573' },
  { x: 185, y: 115, r: 24, val: 0, color: '#1e90ff' },
  { x: 255, y: 115, r: 24, val: 0, color: '#ffa502' }
];

let currentAnswer = 0; 

function startGame(difficulty) {
  selectedDifficulty = difficulty;
  score = 0;
  time = 60;
  totalShots = 0;
  successfulShots = 0;

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('playScreen').classList.remove('hidden');
  document.getElementById('score').textContent = score;
  
  resetBall();
  makeNewQuestion();
  initEventListeners();
  
  timer = setInterval(() => {
    time--;
    document.getElementById('time').textContent = time;
    
    const percent = (time / 60) * 100;
    document.getElementById('timeBar').style.width = percent + '%';

    if (time <= 0) endGame();
  }, 1000);

  requestAnimationFrame(update);
}

function makeNewQuestion() {
  let num1, num2, symbol;
  
  if (selectedDifficulty === 'easy') {
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 20) + 1;
    symbol = '+';
    currentAnswer = num1 + num2;
  } else if (selectedDifficulty === 'normal') {
    if (Math.random() > 0.5) {
      num1 = Math.floor(Math.random() * 30) + 10;
      num2 = Math.floor(Math.random() * 20) + 5;
      symbol = '+';
      currentAnswer = num1 + num2;
    } else {
      num1 = Math.floor(Math.random() * 40) + 15;
      num2 = Math.floor(Math.random() * 14) + 1;
      symbol = '-';
      currentAnswer = num1 - num2;
    }
  } else { 
    num1 = Math.floor(Math.random() * 8) + 2; 
    num2 = Math.floor(Math.random() * 9) + 1; 
    symbol = '×';
    currentAnswer = num1 * num2;
  }

  document.getElementById('questionBox').textContent = `${num1} ${symbol} ${num2} = ?`;

  let correctHoleIndex = Math.floor(Math.random() * 4);
  let usedValues = [currentAnswer];

  for (let i = 0; i < 4; i++) {
    if (i === correctHoleIndex) {
      holes[i].val = currentAnswer;
    } else {
      let wrongVal;
      do {
        let diff = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
        wrongVal = currentAnswer + diff;
      } while (wrongVal < 0 || usedValues.includes(wrongVal));
      
      holes[i].val = wrongVal;
      usedValues.push(wrongVal);
    }
  }
}

function resetBall() {
  ball.x = baseSpringX;
  ball.y = baseSpringY;
  ball.vx = 0;
  ball.vy = 0;
  ball.isLaunched = false;
  const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b5de5', '#ff33aa'];
  ball.color = colors[Math.floor(Math.random() * colors.length)];
}

function initEventListeners() {
  // 중복 등록 방지를 위해 초기화 후 재등록
  canvas.removeEventListener('mousedown', startDrag);
  canvas.removeEventListener('mousemove', doDrag);
  canvas.removeEventListener('mouseup', endDrag);

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', doDrag);
  canvas.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e.touches[0]); }, {pasive: false});
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); doDrag(e.touches[0]); }, {passive: false});
  canvas.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  if (ball.isLaunched) return;
  const rect = canvas.getBoundingClientRect();
  
  // 패딩과 무관하게 실제 캔버스 내부 픽셀 좌표 계산
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  // 하단 중앙 터치/클릭 판정 가동 범위 (가로 110 ~ 230 내부로 확실하게 축소 타겟팅)
  if (mx > 110 && mx < 230 && my > 320) {
    spring.isDragging = true;
    spring.dragStartX = mx;
    spring.dragStartY = my;
  }
}

function doDrag(e) {
  if (!spring.isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  let dx = mx - spring.dragStartX;
  let dy = my - spring.dragStartY;

  if (dy < 0) dy = 0; 
  if (dy > 70) dy = 70;
  if (dx < -65) dx = -65; 
  if (dx > 65) dx = 65;

  spring.offsetX = dx;
  spring.offsetY = dy;

  ball.x = baseSpringX + dx;
  ball.y = baseSpringY + dy;
}

function endDrag() {
  if (!spring.isDragging) return;
  spring.isDragging = false;

  const powerY = spring.offsetY;
  const powerX = spring.offsetX;

  if (powerY > 5 || Math.abs(powerX) > 5) {
    ball.vy = -powerY * 0.65; 
    ball.vx = -powerX * 0.48; 
    ball.isLaunched = true;
    totalShots++;
  }

  spring.offsetX = 0;
  spring.offsetY = 0;
  if(!ball.isLaunched) resetBall();
}

function triggerFlash(type) {
  const className = type === 'success' ? 'flash-correct' : 'flash-wrong';
  cabinet.classList.add(className);
  setTimeout(() => cabinet.classList.remove(className), 200);
}

function drawNeonHole(h) {
  // 1. 구멍 본체
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1918'; 
  ctx.fill();
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = h.color;
  ctx.stroke();

  // 2. 구멍 위쪽 흰색 원판 팻말
  let plateY = h.y - 52; 
  let plateRadius = 18;  

  ctx.beginPath();
  ctx.arc(h.x, plateY, plateRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; 
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4a3b32';
  ctx.stroke();

  // 3. 숫자 텍스트 스트로크 매핑
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px sans-serif'; 

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000'; 
  ctx.strokeText(h.val, h.x, plateY + 1);

  ctx.fillStyle = '#ffffff'; 
  ctx.fillText(h.val, h.x, plateY + 1);
}

function drawCrystalStick() {
  let currentStickX = baseSpringX + spring.offsetX;
  let currentStickY = baseSpringY + spring.offsetY;

  // 고정되는 막대 밑바닥 시작점도 정중앙(baseSpringX)에서 시작하도록 연동
  ctx.beginPath();
  ctx.moveTo(baseSpringX, 420);
  ctx.lineTo(currentStickX, currentStickY);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#b3d9ff';
  ctx.stroke();
  
  ctx.beginPath();
  let r = 14; 
  ctx.moveTo(currentStickX, currentStickY - r);
  for (let i = 1; i <= 6; i++) {
    let angle = i * (Math.PI / 3);
    ctx.lineTo(currentStickX + r * Math.sin(angle), currentStickY - r * Math.cos(angle));
  }
  ctx.closePath();
  ctx.fillStyle = '#ff4757';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 구멍 렌더링
  holes.forEach(drawNeonHole);

  // 가이드라인 외곽 곡선 대칭 마감
  ctx.beginPath();
  ctx.moveTo(335, 420);
  ctx.lineTo(335, 120);
  ctx.arc(170, 120, 165, 0, Math.PI, true);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#ffcc00';
  ctx.stroke();

  // 2. 조준 점선 가이드라인 (시작점을 baseSpringX로 연동)
  if (spring.isDragging && (spring.offsetY > 5 || Math.abs(spring.offsetX) > 5)) {
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.moveTo(baseSpringX, baseSpringY - 20);
    let targetX = baseSpringX - spring.offsetX * 4.2;
    let targetY = baseSpringY - spring.offsetY * 4.2;
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. 레버 스틱 드로우
  drawCrystalStick();

  // 4. 탱탱볼 물리 엔진 및 판정
  if (ball.isLaunched) {
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius < 5) { ball.x = 5 + ball.radius; ball.vx = -ball.vx * 0.76; }
    if (ball.x + ball.radius > 335) { ball.x = 335 - ball.radius; ball.vx = -ball.vx * 0.76; }
    if (ball.y - ball.radius < 5) { ball.y = 5 + ball.radius; ball.vy = -ball.vy * 0.76; }

    holes.forEach(h => {
      let dist = Math.sqrt((ball.x - h.x)**2 + (ball.y - h.y)**2);
      if (dist < h.r - 1) {
        if (h.val === currentAnswer) {
          score += 100; 
          successfulShots++;
          document.getElementById('feedback').textContent = `🎯 정답! 정답은 ${currentAnswer} 입니다! (+100점)`;
          triggerFlash('success');
        } else {
          score = Math.max(0, score - 30); 
          document.getElementById('feedback').textContent = `❌ 오답! 앗, 정답은 ${currentAnswer}였어요! (-30점)`;
          triggerFlash('fail');
        }
        
        document.getElementById('score').textContent = score;
        makeNewQuestion(); 
        resetBall();
      }
    });

    if (ball.y > canvas.height + 20) {
      document.getElementById('feedback').textContent = '구멍에 넣지 못했어요! 다시 조준해 보세요 😢';
      triggerFlash('fail');
      resetBall();
    }
  }

  // 5. 주인공 탱탱볼 드로잉
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  if (time > 0) requestAnimationFrame(update);
}

function endGame() {
  clearInterval(timer);
  document.getElementById('playScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.remove('hidden');
  
  let accuracyPercent = totalShots > 0 ? Math.round((successfulShots / totalShots) * 100) : 0;
  
  let diffText = '🌸 더하기 모드';
  if(selectedDifficulty === 'normal') diffText = '🍊 덧뺄셈 혼합 모드';
  if(selectedDifficulty === 'hard') diffText = '🍇 구구단 곱셈 모드';

  document.getElementById('finalDifficulty').textContent = diffText;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('totalCount').textContent = successfulShots;
  document.getElementById('accuracy').textContent = accuracyPercent + '%';
}
