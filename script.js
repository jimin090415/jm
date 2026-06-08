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
// 조이스틱 위치: 캔버스 가로(340)의 정중앙인 170으로 선언
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
  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', doDrag);
  canvas.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
  canvas.addEventListener('touchmove', (e) => doDrag(e.touches[0]));
  canvas.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  if (ball.isLaunched) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 조이스틱 작동 클릭 범위를 하단 중앙(X: 120~220, Y: 320 이상)으로 매핑
  if (mx > 120 && mx < 220 && my > 320) {
    spring.isDragging = true;
    spring.dragStartX = mx;
    spring.dragStartY = my;
  }
}

function doDrag(e) {
  if (!spring.isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  let dx = mx - spring.dragStartX;
  let dy = my - spring.dragStartY;

  if (dy < 0) dy = 0; 
  if (dy > 70) dy = 70;
  if (dx < -60) dx = -60; 
  if (dx > 60) dx = 60;

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
    ball.vx = -powerX * 0.45; 
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

// 숫자 가독성을 최대로 끌어올린 하이 콘트라스트 그래픽 처리 함수
function drawNeonHole(h) {
  // 1. 공이 들어갈 어두운 구멍 본체
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1918'; 
  ctx.fill();
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = h.color;
  ctx.stroke();

  // 2. 구멍 위쪽 보드판 배경 (무조건 하얀색 원판 고정)
  let plateY = h.y - 52; 
  let plateRadius = 18;  

  ctx.beginPath();
  ctx.arc(h.x, plateY, plateRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; 
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4a3b32';
  ctx.stroke();

  // 3. 내부 숫자 글씨 쓰기 (크기 키우고 외곽선 두껍게)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px sans-serif'; 

  // 글자 바깥 테두리 선명화
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000'; 
  ctx.strokeText(h.val, h.x, plateY + 1);

  // 글자 알맹이 채우기
  ctx.fillStyle = '#ffffff'; 
  ctx.fillText(h.val, h.x, plateY + 1);
}

function drawCrystalStick() {
  let currentStickX = baseSpringX + spring.offsetX;
  let currentStickY = baseSpringY + spring.offsetY;

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

  // 1. 구멍 및 보기판 렌더링
  holes.forEach(drawNeonHole);
