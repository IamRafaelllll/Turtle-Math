const titleScreen = document.getElementById('titleScreen');
const playScreen = document.getElementById('playScreen');
const endScreen = document.getElementById('endScreen');
const overlay = document.getElementById('overlay');
const welcomePopup = document.getElementById('welcomePopup');
const correctPopup = document.getElementById('correctPopup');
const imagePopup = document.getElementById('imagePopup');
const popupClose = document.getElementById('popupClose');
const cards = document.getElementById('cards');
const keypad = document.getElementById('keypad');
const sceneArt = document.getElementById('sceneArt');
const game = document.getElementById('game');

let level = 1;
let selected = null;
let answers = [{a:null,b:null}, {a:null,b:null}];
let solved = [];
let currentPopup = null;

function fitGame(){
  const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 650, 1);
  game.style.setProperty('--scale', scale);
}
window.addEventListener('resize', fitGame);
fitGame();

function showOnly(screen){
  [titleScreen, playScreen, endScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

document.getElementById('startGame').onclick = () => {
  restart(false);
  showOnly(playScreen);
  showWelcome();
};

function goTitle(){ closeOverlay(); showOnly(titleScreen); }

function restart(showWelcomePopup=true){
  level = 1;
  selected = null;
  answers = [{a:null,b:null}, {a:null,b:null}];
  solved = [];
  sceneArt.src = 'images/scene1.png';
  renderCards();
  showOnly(playScreen);
  if(showWelcomePopup) showWelcome();
}

function renderCards(){
  cards.innerHTML = '';
  cards.className = level === 1 ? 'cards one-card' : 'cards two-cards';
  if(level === 2){
    cards.appendChild(makeCard(0, true));
  }
  cards.appendChild(makeCard(level-1, false));
  updateBars();
}

function makeCard(index, isSolved){
  const card = document.createElement('div');
  card.className = 'math-card' + (isSolved ? ' solved' : '');
  card.dataset.index = index;
  const aText = isSolved ? solved[0].a : (answers[index].a ?? '#');
  const bText = isSolved ? solved[0].b : (answers[index].b ?? '#');
  card.innerHTML = `
    <div class="eq">
      <button class="num-box input" data-card="${index}" data-slot="a">${aText}</button>
      <span>+</span>
      <button class="num-box input" data-card="${index}" data-slot="b">${bText}</button>
      <span>=</span>
      <span class="target">10</span>
    </div>
    <div class="bar"></div>
  `;
  if(isSolved){
    card.querySelectorAll('button').forEach(b=>b.disabled=true);
  } else {
    card.querySelectorAll('.input').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      selected = {card: Number(btn.dataset.card), slot: btn.dataset.slot, button: btn};
      positionKeypadNear(btn);
      keypad.classList.remove('hidden');
    }));
  }
  return card;
}

function positionKeypadNear(btn){
  const gameRect = game.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const scale = Number(getComputedStyle(game).getPropertyValue('--scale')) || 1;
  const x = (btnRect.left - gameRect.left) / scale - 115;
  const y = (btnRect.top - gameRect.top) / scale + 28;
  keypad.style.left = Math.max(18, Math.min(850, x)) + 'px';
  keypad.style.top = Math.max(100, Math.min(480, y)) + 'px';
}

function updateBars(){
  document.querySelectorAll('.math-card').forEach(card => {
    const idx = Number(card.dataset.index);
    let a, b;
    if(card.classList.contains('solved')) { a = solved[0].a; b = solved[0].b; }
    else { a = answers[idx].a ?? 0; b = answers[idx].b ?? 0; }
    const raw = (a || 0) + (b || 0);
    const sum = Math.max(0, Math.min(10, raw));
    const bar = card.querySelector('.bar');
    if(bar) {
      bar.style.setProperty('--fillWidth', `${sum * 30}px`);
      bar.classList.toggle('too-much', raw > 10);
    }
  });
}

document.querySelectorAll('.key-hit').forEach(key => {
  key.addEventListener('click', (e) => {
    e.stopPropagation();
    if(!selected) return;
    const n = Number(key.dataset.num);
    answers[selected.card][selected.slot] = n;
    selected.button.textContent = n;
    selected.button.classList.add('filled');
    keypad.classList.add('hidden');
    updateBars();
  });
});

document.addEventListener('click', (e) => {
  if(!keypad.classList.contains('hidden') && !keypad.contains(e.target) && !e.target.classList.contains('input')) {
    keypad.classList.add('hidden');
  }
});

overlay.addEventListener('click', (e) => {
  if(e.target !== overlay) return;
  if(currentPopup === 'correct') nextAfterCorrect();
  else closeOverlay();
});
welcomePopup.addEventListener('click', e => e.stopPropagation());
correctPopup.addEventListener('click', e => e.stopPropagation());
imagePopup.addEventListener('click', e => e.stopPropagation());
popupClose.addEventListener('click', e => { e.stopPropagation(); closeOverlay(); });
window.addEventListener('keydown', e => { if(e.key === 'Escape') closeOverlay(); });

document.getElementById('submitBtn').onclick = () => {
  const current = answers[level-1];
  clearCardState();
  keypad.classList.add('hidden');
  if(current.a === null || current.b === null){
    markError('missing');
    showImagePopup('images/popup-missing.png');
    return;
  }
  const sum = current.a + current.b;
  if(sum === 10){
    solved.push({a:current.a, b:current.b});
    if(level === 1){
      sceneArt.src = 'images/scene2.png';
      showCorrectPopup(current.a, current.b);
    } else {
      sceneArt.src = 'images/scene5.png';
      showEnd();
    }
  } else if(sum > 10){
    markError('over');
    showImagePopup('images/popup-over.png');
  } else {
    markError('under');
    showImagePopup('images/popup-under.png');
  }
};

function clearCardState(){
  document.querySelectorAll('.math-card').forEach(c => c.classList.remove('error','over','under'));
}
function markError(type){
  const card = [...document.querySelectorAll('.math-card')].at(-1);
  card.classList.add('error');
  if(type === 'over') card.classList.add('over');
  if(type === 'under') card.classList.add('under');
}

function showWelcome(){
  currentPopup = 'welcome';
  overlay.classList.remove('hidden');
  welcomePopup.classList.remove('hidden');
  correctPopup.classList.add('hidden');
  imagePopup.classList.add('hidden');
  popupClose.classList.add('hidden');
}
function closeOverlay(){
  currentPopup = null;
  overlay.classList.add('hidden');
  welcomePopup.classList.add('hidden');
  correctPopup.classList.add('hidden');
  imagePopup.classList.add('hidden');
  popupClose.classList.add('hidden');
}
function showCorrectPopup(a,b){
  currentPopup = 'correct';
  document.getElementById('correctA').textContent = a;
  document.getElementById('correctB').textContent = b;
  overlay.classList.remove('hidden');
  welcomePopup.classList.add('hidden');
  imagePopup.classList.add('hidden');
  popupClose.classList.add('hidden');
  correctPopup.classList.remove('hidden');
}
function showImagePopup(src){
  currentPopup = 'error';
  overlay.classList.remove('hidden');
  welcomePopup.classList.add('hidden');
  correctPopup.classList.add('hidden');
  imagePopup.src = src;
  imagePopup.classList.remove('hidden');
  imagePopup.style.width = '285px'; imagePopup.style.left = '635px'; imagePopup.style.top = '315px';
  popupClose.classList.remove('hidden');
  popupClose.style.left='895px'; popupClose.style.top='332px'; popupClose.style.width='25px'; popupClose.style.height='25px';
}
function nextAfterCorrect(){
  closeOverlay();
  if(level !== 1) return;
  level = 2;
  answers[1] = {a:null,b:null};
  sceneArt.src = 'images/scene3.png';
  renderCards();
}
function showEnd(){
  document.getElementById('sum1').textContent = `${solved[0].a} + ${solved[0].b}`;
  document.getElementById('sum2').textContent = `${solved[1].a} + ${solved[1].b}`;
  document.getElementById('sum3').textContent = `${solved[0].a} + ${solved[0].b}`;
  document.getElementById('sum4').textContent = `${solved[1].a} + ${solved[1].b}`;
  closeOverlay();
  showOnly(endScreen);
}

const welcomeX = document.getElementById('welcomeX');
const welcomeStart = document.getElementById('welcomeStart');
const correctX = document.getElementById('correctX');
const correctStart = document.getElementById('correctStart');
if (welcomeX) welcomeX.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay(); });
if (welcomeStart) welcomeStart.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay(); });
if (correctX) correctX.addEventListener('click', (e) => { e.stopPropagation(); nextAfterCorrect(); });
if (correctStart) correctStart.addEventListener('click', (e) => { e.stopPropagation(); nextAfterCorrect(); });
