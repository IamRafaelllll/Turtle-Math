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

let level = 1;
let selected = null;

let answers = [
  { a: null, b: null },
  { a: null, b: null }
];

let solved = [];

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

document.getElementById("startGame").addEventListener("click", () => {
  restart(false);
  showOnly(playScreen);
  showWelcome();
});

function goTitle() {
  closeOverlay();
  showOnly(titleScreen);
}

function restart(showWelcomePopup = true) {
  level = 1;
  selected = null;

  answers = [
    { a: null, b: null },
    { a: null, b: null }
  ];

  solved = [];

  sceneArt.src = "images/scene1.png";
  renderCards();
  showOnly(playScreen);

  if (showWelcomePopup) {
    showWelcome();
  }
}

function renderCards() {
  cards.innerHTML = "";
  cards.className = level === 1 ? "cards one-card" : "cards two-cards";

  if (level === 2) {
    cards.appendChild(makeCard(0, true));
  }

  cards.appendChild(makeCard(level - 1, false));
  updateBars();
}

function makeCard(index, isSolved) {
  const card = document.createElement("div");
  card.className = "math-card";
  card.dataset.index = index;

  if (isSolved) {
    card.classList.add("solved");
  }

  const aValue = isSolved ? solved[0].a : answers[index].a;
  const bValue = isSolved ? solved[0].b : answers[index].b;

  card.innerHTML = `
    <div class="eq">
      <button class="num-box input" data-card="${index}" data-slot="a">${aValue ?? "#"}</button>
      <span>+</span>
      <button class="num-box input" data-card="${index}" data-slot="b">${bValue ?? "#"}</button>
      <span>=</span>
      <span class="target">10</span>
    </div>
    <div class="bar"></div>
  `;

  if (isSolved) {
    card.querySelectorAll(".input").forEach(button => {
      button.disabled = true;
    });
  } else {
    card.querySelectorAll(".input").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();

        selected = {
          card: Number(button.dataset.card),
          slot: button.dataset.slot,
          button
        };

        positionKeypad(button);
        keypad.classList.remove("hidden");
      });
    });
  }

  return card;
}

function positionKeypad(button) {
  const gameRect = game.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const scale = Number(getComputedStyle(game).getPropertyValue("--scale")) || 1;

  let x = (buttonRect.left - gameRect.left) / scale - 105;
  let y = (buttonRect.top - gameRect.top) / scale + 35;

  x = Math.max(20, Math.min(860, x));
  y = Math.max(95, Math.min(480, y));

  keypad.style.left = `${x}px`;
  keypad.style.top = `${y}px`;
}

document.querySelectorAll(".key-hit").forEach(key => {
  key.addEventListener("click", event => {
    event.stopPropagation();

    if (!selected) return;

    const number = Number(key.dataset.num);

    answers[selected.card][selected.slot] = number;
    selected.button.textContent = number;

    keypad.classList.add("hidden");
    updateBars();
  });
});

document.addEventListener("click", event => {
  if (!keypad.classList.contains("hidden") && !keypad.contains(event.target)) {
    keypad.classList.add("hidden");
  }
});

function updateBars() {
  document.querySelectorAll(".math-card").forEach(card => {
    const index = Number(card.dataset.index);
    const bar = card.querySelector(".bar");

    let a;
    let b;

    if (card.classList.contains("solved")) {
      a = solved[0].a;
      b = solved[0].b;
    } else {
      a = answers[index].a ?? 0;
      b = answers[index].b ?? 0;
    }

    const total = a + b;
    bar.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
      const block = document.createElement("div");
      block.classList.add("block");

      if (i <= a) {
        block.classList.add("green");
      } else if (i <= total) {
        block.classList.add("brown");
      } else {
        block.classList.add("brown");
      }

      bar.appendChild(block);
    }

    if (total > 10) {
      const extra = Math.min(total - 10, 5);

      for (let i = 0; i < extra; i++) {
        const block = document.createElement("div");
        block.classList.add("block", "red");
        bar.appendChild(block);
      }

      bar.style.width = `${340 + extra * 34}px`;
    } else {
      bar.style.width = "340px";
    }
  });
}

submitBtn.addEventListener("click", () => {
  keypad.classList.add("hidden");
  clearCardState();

  const current = answers[level - 1];

  if (current.a === null || current.b === null) {
    markError();
    showError("You need to complete BOTH solutions to complete the problem.");
    return;
  }

  const sum = current.a + current.b;

  if (sum > 10) {
    markError();
    showError("Your solution goes OVER the sum!");
    return;
  }

  if (sum < 10) {
    markError();
    showError("Your solution is UNDER the sum!");
    return;
  }

  if (level === 2 && isSameEquation(current, solved[0])) {
    markError();
    showError("Try a DIFFERENT way to make 10!");
    return;
  }

  solved.push({ a: current.a, b: current.b });

  if (level === 1) {
    sceneArt.src = "images/scene2.png";
    showCorrect(current.a, current.b);
  } else {
    sceneArt.src = "images/scene5.png";
    showEnd();
  }
});

function isSameEquation(one, two) {
  return (
    (one.a === two.a && one.b === two.b) ||
    (one.a === two.b && one.b === two.a)
  );
}

function clearCardState() {
  document.querySelectorAll(".math-card").forEach(card => {
    card.classList.remove("error");
  });
}

function markError() {
  const currentCard = [...document.querySelectorAll(".math-card")].at(-1);
  currentCard.classList.add("error");
}

function showWelcome() {
  overlay.classList.remove("hidden");
  welcomePopup.classList.remove("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
}

function showCorrect(a, b) {
  document.getElementById("correctA").textContent = a;
  document.getElementById("correctB").textContent = b;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.remove("hidden");
  errorPopup.classList.add("hidden");
}

function showError(message) {
  errorMessage.textContent = message;

  overlay.classList.remove("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.remove("hidden");
}

function closeOverlay() {
  overlay.classList.add("hidden");
  welcomePopup.classList.add("hidden");
  correctPopup.classList.add("hidden");
  errorPopup.classList.add("hidden");
}

function nextAfterCorrect() {
  closeOverlay();

  if (level !== 1) return;

  level = 2;
  answers[1] = { a: null, b: null };

  sceneArt.src = "images/scene3.png";
  renderCards();
}

function showEnd() {
  document.getElementById("sum1").textContent = `${solved[0].a} + ${solved[0].b}`;
  document.getElementById("sum2").textContent = `${solved[1].a} + ${solved[1].b}`;

  closeOverlay();
  showOnly(endScreen);
}

overlay.addEventListener("click", event => {
  if (event.target === overlay) {
    closeOverlay();
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
      nextAfterCorrect();
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
  nextAfterCorrect();
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeOverlay();
  }
});
