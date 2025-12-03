let count = 0;
let btn = null;

export const gameConfig = {
  handlesSwipe: false,
  swipeDirections: [],
};

export function start(container) {
  count = 0;

  container.innerHTML = "";
  btn = document.createElement("button");
  btn.style.padding = "20px";
  btn.style.fontSize = "22px";
  btn.style.borderRadius = "12px";
  btn.style.background = "#222";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.width = "100%";

  btn.innerText = "Счёт: 0";

  btn.onclick = () => {
    count++;
    btn.innerText = "Счёт: " + count;
  };

  container.appendChild(btn);
}

export function stop(container) {
  if (btn) {
    btn.onclick = null;
  }
  container.innerHTML = "";
}
