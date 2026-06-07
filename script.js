const game = document.getElementById("game");
const titleScreen = document.getElementById("titleScreen");
const playScreen = document.getElementById("playScreen");
const endScreen = document.getElementById("endScreen");

const sceneArt = document.getElementById("sceneArt");
const cards = document.getElementById("cards");
const keypad = document.getElementById("keypad");
const submitBtn = document.getElementById("submitBtn");

const overlay = document.getElementById("overlay");
const welcomePopup = document.getElementById("welcomePopup");
const correctPopup = document.getElementById("correctPopup");
const errorPopup = document.getElementById("errorPopup");
const errorMessage = document.getElementById("errorMessage");

const setCompletePopup = document.getElementById("setCompletePopup");
const pondProgress = document.getElementById("pondProgress");
const setLine1 = document.getElementById("setLine1");
const setLine2 = document.getElementById("setLine2");

const correctA = document.getElementById("correctA");
const correctB = document.getElementById("correctB");
const correctTarget = document.getElementById("correctTarget");

const sceneList = [
  "images/scene1.png",
  "images/scene2.png",
  "images/scene3.png",
  "images/scene5.png"
];

const TOTAL_SETS = 3;

let currentSet = 0;
let phase = 1;
let selected = null;
let targetNumber = 10;

let currentAnswers = [
  { a: null, b: null },
  { a: null, b: null }
];

let firstSolution = null;
let allSets = [];

function fitGame() {
  const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 650, 1);
  game.style.setProperty("--scale", scale);
}

window.addEventListener("resize", fitGame);
fitGame();

function randomTarget() {
  return Math.floor(Math.random() * 8) + 5;
}

function showOnly(screen) {
  titleScreen.classList.remove("active");
  playScreen.classList.remove("active");
  endScreen.classList.remove("active");
  screen.classList.add("active");
}

function closeOverlay() {
  overlay.classList.add("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
  setCompletePopup.classList.add("hidden");
}

function goTitle() {
  closeOverlay();
  keypad.classList.add("hidden");
  showOnly(titleScreen);
}

function resetCurrentSet() {
  phase = 1;
  selected = null;
  firstSolution = null;
  targetNumber = randomTarget();

  currentAnswers = [
    { a: null, b: null },
    { a: null, b: null }
  ];
}

function restart(showWelcome = true) {
  currentSet = 0;
  allSets = [];
  resetCurrentSet();

  sceneArt.src = sceneList[0];
  renderCards();
  updatePondProgress();
  closeOverlay();
  keypad.classList.add("hidden");
  showOnly(playScreen);

  if (showWelcome) {
    showWelcomePopup();
  }
}

document.getElementById("startGame").addEventListener("click", () => {
  restart(true);
});

function updatePondProgress() {
  const left = TOTAL_SETS - currentSet;

  if (left === 1) {
    pondProgress.textContent = "1 set left to get to the pond!";
  } else {
    pondProgress.textContent = `${left} sets left to get to the pond!`;
  }
}

function showWelcomePopup() {
  overlay.classList.remove("hidden");
  welcomePopup.classList.remove("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
  setCompletePopup.classList.add("hidden");
}

function showCorrectPopup(a, b) {
  correctA.textContent = a;
  correctB.textContent = b;
  correctTarget.textContent = targetNumber;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.remove("hidden");
  errorPopup.classList.add("hidden");
  setCompletePopup.classList.add("hidden");
}

function showErrorPopup(message) {
  errorMessage.textContent = message;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.remove("hidden");
  setCompletePopup.classList.add("hidden");
}

function showSetCompletePopup(first, second) {
  setLine1.textContent = `${first.a} + ${first.b} = ${targetNumber}`;
  setLine2.textContent = `${second.a} + ${second.b} = ${targetNumber}`;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
  setCompletePopup.classList.remove("hidden");
}

function startSecondEquation() {
  closeOverlay();
  phase = 2;
  selected = null;
  currentAnswers[1] = { a: null, b: null };
  renderCards();
}

function advanceAfterFullSet(secondSolution) {
  const completedSet = {
    target: targetNumber,
    first: { ...firstSolution },
    second: { ...secondSolution }
  };

  allSets.push(completedSet);
  currentSet += 1;

  if (currentSet >= TOTAL_SETS) {
    showEndScreen();
    return;
  }

  showSetCompletePopup(completedSet.first, completedSet.second);
}

function continueToNextSet() {
  closeOverlay();
  resetCurrentSet();

  sceneArt.src = sceneList[currentSet];
  renderCards();
  updatePondProgress();
}

function showEndScreen() {
  closeOverlay();
  showOnly(endScreen);

  const summary = document.querySelector(".summary");
  summary.innerHTML = `<b>summary:</b>`;

  allSets.forEach((set, index) => {
    const line = document.createElement("p");
    line.innerHTML = `
      Set ${index + 1}: 
      ${set.first.a} + ${set.first.b} = ${set.target}
      <br>
      ${set.second.a} + ${set.second.b} = ${set.target}
    `;
    summary.appendChild(line);
  });
}

function renderCards() {
  cards.innerHTML = "";
  cards.className = phase === 1 ? "cards one-card" : "cards two-cards";

  if (phase === 2 && firstSolution) {
    cards.appendChild(makeCard(firstSolution, true, -1));
  }

  const liveIndex = phase === 1 ? 0 : 1;
  cards.appendChild(makeCard(currentAnswers[liveIndex], false, liveIndex));
}

function makeCard(values, locked, answerIndex) {
  const card = document.createElement("div");
  card.className = "math-card";

  if (locked) {
    card.classList.add("solved");
  }

  card.innerHTML = `
    <div class="eq">
      <button class="num-box input" data-answer="${answerIndex}" data-slot="a">${values.a ?? "#"}</button>
      <span>+</span>
      <button class="num-box input" data-answer="${answerIndex}" data-slot="b">${values.b ?? "#"}</button>
      <span>=</span>
      <span class="target">${targetNumber}</span>
    </div>
    <div class="bar"></div>
  `;

  const bar = card.querySelector(".bar");
  paintBar(bar, values.a, values.b);

  if (locked) {
    card.querySelectorAll(".input").forEach(btn => {
      btn.disabled = true;
    });
  } else {
    card.querySelectorAll(".input").forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();

        selected = {
          answerIndex: Number(btn.dataset.answer),
          slot: btn.dataset.slot,
          button: btn
        };

        positionKeypad(btn);
        keypad.classList.remove("hidden");
      });
    });
  }

  return card;
}

function positionKeypad(button) {
  const gameRect = game.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  const scale = Number(getComputedStyle(game).getPropertyValue("--scale")) || 1;

  let x = (btnRect.left - gameRect.left) / scale - 110;
  let y = (btnRect.top - gameRect.top) / scale + 35;

  x = Math.max(20, Math.min(860, x));
  y = Math.max(100, Math.min(470, y));

  keypad.style.left = `${x}px`;
  keypad.style.top = `${y}px`;
}

document.querySelectorAll(".key-hit").forEach(key => {
  key.addEventListener("click", event => {
    event.stopPropagation();

    if (!selected) return;

    const num = Number(key.dataset.num);
    currentAnswers[selected.answerIndex][selected.slot] = num;
    selected.button.textContent = num;

    keypad.classList.add("hidden");
    rerenderBarsOnly();
  });
});

document.addEventListener("click", event => {
  if (!keypad.classList.contains("hidden") && !keypad.contains(event.target)) {
    keypad.classList.add("hidden");
  }
});

function rerenderBarsOnly() {
  const cardEls = [...document.querySelectorAll(".math-card")];

  if (phase === 1) {
    paintBar(cardEls[0].querySelector(".bar"), currentAnswers[0].a, currentAnswers[0].b);
  } else {
    paintBar(cardEls[0].querySelector(".bar"), firstSolution.a, firstSolution.b);
    paintBar(cardEls[1].querySelector(".bar"), currentAnswers[1].a, currentAnswers[1].b);
  }
}

function paintBar(bar, a, b) {
  bar.innerHTML = "";
  bar.style.width = "340px";

  const first = Number.isInteger(a) ? a : 0;
  const second = Number.isInteger(b) ? b : 0;
  const total = first + second;

  const maxBlocks = targetNumber;
  const firstBlocks = Math.min(first, maxBlocks);
  const secondBlocks = Math.min(second, Math.max(maxBlocks - firstBlocks, 0));
  const emptyBlocks = Math.max(maxBlocks - firstBlocks - secondBlocks, 0);
  const overflowBlocks = Math.max(total - maxBlocks, 0);

  const blockWidth = 340 / maxBlocks;

  function addBlock(colorClass) {
    const block = document.createElement("div");
    block.className = `block ${colorClass}`;
    block.style.width = `${blockWidth}px`;
    bar.appendChild(block);
  }

  for (let i = 0; i < firstBlocks; i++) addBlock("green");
  for (let i = 0; i < secondBlocks; i++) addBlock("brown");
  for (let i = 0; i < emptyBlocks; i++) addBlock("empty");
  for (let i = 0; i < overflowBlocks; i++) addBlock("red");

  if (overflowBlocks > 0) {
    bar.style.width = `${340 + overflowBlocks * blockWidth}px`;
  }
}

function clearErrors() {
  document.querySelectorAll(".math-card").forEach(card => {
    card.classList.remove("error");
  });
}

function markCurrentCardError() {
  const cardEls = [...document.querySelectorAll(".math-card")];
  const currentCard = cardEls[cardEls.length - 1];

  if (currentCard) {
    currentCard.classList.add("error");
  }
}

function isSameEquation(one, two) {
  return (
    one.a === two.a && one.b === two.b
  );
}

submitBtn.addEventListener("click", () => {
  keypad.classList.add("hidden");
  clearErrors();

  const answerIndex = phase === 1 ? 0 : 1;
  const current = currentAnswers[answerIndex];

  if (current.a === null || current.b === null) {
    markCurrentCardError();
    showErrorPopup("You need to complete BOTH numbers to complete the problem.");
    return;
  }

  const sum = current.a + current.b;

  if (sum < targetNumber) {
    markCurrentCardError();
    showErrorPopup("Your solution is UNDER the sum!");
    return;
  }

  if (sum > targetNumber) {
    markCurrentCardError();
    showErrorPopup("Your solution goes OVER the sum!");
    return;
  }

  if (phase === 1) {
    firstSolution = { ...current };
    showCorrectPopup(current.a, current.b);
    return;
  }

  if (isSameEquation(current, firstSolution)) {
    markCurrentCardError();
    showErrorPopup("Your second equation must be DIFFERENT from the first one.");
    return;
  }

  advanceAfterFullSet(current);
});

overlay.addEventListener("click", event => {
  if (event.target === overlay) {
    if (!correctPopup.classList.contains("hidden")) {
      startSecondEquation();
    } else if (!setCompletePopup.classList.contains("hidden")) {
      continueToNextSet();
    } else {
      closeOverlay();
    }
  }
});

document.querySelectorAll(".popup").forEach(popup => {
  popup.addEventListener("click", event => {
    event.stopPropagation();
  });
});

document.querySelectorAll(".x").forEach(button => {
  button.addEventListener("click", event => {
    event.stopPropagation();

    if (!correctPopup.classList.contains("hidden")) {
      startSecondEquation();
    } else if (!setCompletePopup.classList.contains("hidden")) {
      continueToNextSet();
    } else {
      closeOverlay();
    }
  });
});

document.getElementById("welcomeStart").addEventListener("click", event => {
  event.stopPropagation();
  closeOverlay();
});

document.getElementById("correctStart").addEventListener("click", event => {
  event.stopPropagation();
  startSecondEquation();
});

document.getElementById("continueSet").addEventListener("click", event => {
  event.stopPropagation();
  continueToNextSet();
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeOverlay();
  }
});
