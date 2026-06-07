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

const correctA = document.getElementById("correctA");
const correctB = document.getElementById("correctB");

const sceneList = [
  "images/scene1.png",
  "images/scene2.png",
  "images/scene3.png",
  "images/scene4.png",
  "images/scene5.png"
];

/*
  scene1 = start
  solve 2 equations -> move to scene2
  solve 2 equations -> move to scene3
  solve 2 equations -> move to scene4
  solve 2 equations -> move to scene5 / pond
*/
const TOTAL_SETS = sceneList.length - 1;

let currentSet = 0; // how many full sets have been completed
let phase = 1;      // 1 = first equation, 2 = second equation
let selected = null;

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

function showWelcomePopup() {
  overlay.classList.remove("hidden");
  welcomePopup.classList.remove("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
}

function showCorrectPopup(a, b) {
  correctA.textContent = a;
  correctB.textContent = b;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.remove("hidden");
  errorPopup.classList.add("hidden");
}

function showErrorPopup(message) {
  errorMessage.textContent = message;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.remove("hidden");
}

function startSecondEquation() {
  closeOverlay();
  phase = 2;
  selected = null;
  currentAnswers[1] = { a: null, b: null };
  renderCards();
}

function advanceAfterFullSet(secondSolution) {
  allSets.push({
    first: { ...firstSolution },
    second: { ...secondSolution }
  });

  currentSet += 1;

  if (currentSet >= TOTAL_SETS) {
    showEndScreen();
    return;
  }

  resetCurrentSet();
  sceneArt.src = sceneList[currentSet];
  renderCards();
}

function showEndScreen() {
  closeOverlay();
  showOnly(endScreen);

  const summary = document.querySelector(".summary");
  summary.innerHTML = `<b>summary:</b>`;

  allSets.forEach((set, index) => {
    const line = document.createElement("p");
    line.innerHTML = `Set ${index + 1}: ${set.first.a} + ${set.first.b} = 10 &nbsp;&nbsp;and&nbsp;&nbsp; ${set.second.a} + ${set.second.b} = 10`;
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
      <span class="target">10</span>
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
      btn.addEventListener("click", (event) => {
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
  key.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!selected) return;

    const num = Number(key.dataset.num);
    currentAnswers[selected.answerIndex][selected.slot] = num;
    selected.button.textContent = num;

    keypad.classList.add("hidden");
    rerenderBarsOnly();
  });
});

document.addEventListener("click", (event) => {
  if (!keypad.classList.contains("hidden") && !keypad.contains(event.target)) {
    keypad.classList.add("hidden");
  }
});

function rerenderBarsOnly() {
  const cardEls = [...document.querySelectorAll(".math-card")];

  if (phase === 1) {
    const bar = cardEls[0].querySelector(".bar");
    paintBar(bar, currentAnswers[0].a, currentAnswers[0].b);
  } else {
    if (cardEls[0]) {
      const solvedBar = cardEls[0].querySelector(".bar");
      paintBar(solvedBar, firstSolution.a, firstSolution.b);
    }

    if (cardEls[1]) {
      const liveBar = cardEls[1].querySelector(".bar");
      paintBar(liveBar, currentAnswers[1].a, currentAnswers[1].b);
    }
  }
}

function paintBar(bar, a, b) {
  bar.innerHTML = "";
  bar.style.width = "340px";

  const first = Number.isInteger(a) ? a : 0;
  const second = Number.isInteger(b) ? b : 0;

  const firstWithinTen = Math.min(first, 10);
  const remainingAfterFirst = Math.max(10 - firstWithinTen, 0);
  const secondWithinTen = Math.min(second, remainingAfterFirst);
  const emptyCount = Math.max(10 - firstWithinTen - secondWithinTen, 0);
  const overflowCount = Math.max(first + second - 10, 0);

  // first number = green
  for (let i = 0; i < firstWithinTen; i++) {
  const block = document.createElement("div");
  block.className = "block green";
  bar.appendChild(block);
}

  // second number = dark brown
 for (let i = 0; i < secondWithinTen; i++) {
  const block = document.createElement("div");
  block.className = "block brown";
  bar.appendChild(block);
  }

  // remaining empty slots
  for (let i = 0; i < emptyCount; i++) {
    const block = document.createElement("div");
    block.className = "block empty";
    bar.appendChild(block);
  }

  // overflow blocks
  for (let i = 0; i < overflowCount; i++) {
    const block = document.createElement("div");
    block.className = "block red";
    bar.appendChild(block);
  }

  if (overflowCount > 0) {
    bar.style.width = `${340 + overflowCount * 34}px`;
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
    (one.a === two.a && one.b === two.b) ||
    (one.a === two.b && one.b === two.a)
  );
}

submitBtn.addEventListener("click", () => {
  keypad.classList.add("hidden");
  clearErrors();

  const answerIndex = phase === 1 ? 0 : 1;
  const current = currentAnswers[answerIndex];

  if (current.a === null || current.b === null) {
    markCurrentCardError();
    showErrorPopup("You need to complete BOTH solutions to complete the problem.");
    return;
  }

  const sum = current.a + current.b;

  if (sum < 10) {
    markCurrentCardError();
    showErrorPopup("Your solution is UNDER the sum!");
    return;
  }

  if (sum > 10) {
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

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    if (!correctPopup.classList.contains("hidden")) {
      startSecondEquation();
    } else {
      closeOverlay();
    }
  }
});

document.querySelectorAll(".popup").forEach(popup => {
  popup.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

document.querySelectorAll(".x").forEach(button => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!correctPopup.classList.contains("hidden")) {
      startSecondEquation();
    } else {
      closeOverlay();
    }
  });
});

document.getElementById("welcomeStart").addEventListener("click", (event) => {
  event.stopPropagation();
  closeOverlay();
});

document.getElementById("correctStart").addEventListener("click", (event) => {
  event.stopPropagation();
  startSecondEquation();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOverlay();
  }
});
