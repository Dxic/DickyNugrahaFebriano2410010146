const quotes = [
  "“Tidak semua hari harus penuh. Yang penting ada satu langkah yang benar-benar selesai.”",
  "“Mulai dari bagian yang paling kecil. Kadang momentum datang setelah lima menit pertama.”",
  "“Berhenti sebentar bukan berarti mundur. Bisa jadi itu cara terbaik untuk menjaga arah.”",
  "“Satu tugas yang selesai lebih menenangkan daripada sepuluh rencana yang hanya dipikirkan.”",
  "“Tidak perlu terburu-buru. Cukup hadir penuh pada hal yang sedang dikerjakan.”"
];

const defaultTasks = [
  { id: crypto.randomUUID(), text: "Tentukan satu prioritas utama", done: false },
  { id: crypto.randomUUID(), text: "Rapikan satu hal yang tertunda", done: false }
];

const state = {
  selectedMinutes: 25,
  secondsLeft: 25 * 60,
  timerId: null,
  isRunning: false,
  tasks: JSON.parse(localStorage.getItem("ruangSelaTasks")) || defaultTasks
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function updateDateAndClock() {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  $("#todayLabel").textContent = dateFormatter.format(now);
  $("#clock").textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const hour = now.getHours();
  $("#greeting").textContent =
    hour < 11 ? "Selamat pagi" :
    hour < 15 ? "Selamat siang" :
    hour < 18 ? "Selamat sore" :
    "Selamat malam";

  const secondsToday = hour * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const percentage = Math.round((secondsToday / 86400) * 100);
  $("#dayProgressText").textContent = `${percentage}%`;
  $("#dayProgressBar").style.width = `${percentage}%`;
}

function formatTimer(seconds) {
  const minutePart = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secondPart = (seconds % 60).toString().padStart(2, "0");
  return `${minutePart}:${secondPart}`;
}

function renderTimer() {
  $("#timerDisplay").textContent = formatTimer(state.secondsLeft);
  $("#startTimer").textContent = state.isRunning ? "jeda sesi" : "mulai sesi";
}

function toggleTimer() {
  if (state.isRunning) {
    clearInterval(state.timerId);
    state.timerId = null;
    state.isRunning = false;
    renderTimer();
    return;
  }

  state.isRunning = true;
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;

    if (state.secondsLeft <= 0) {
      clearInterval(state.timerId);
      state.timerId = null;
      state.isRunning = false;
      state.secondsLeft = 0;
      alert("Sesi selesai. Ambil jeda kecil sebelum lanjut.");
    }

    renderTimer();
  }, 1000);

  renderTimer();
}

function resetTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
  state.secondsLeft = state.selectedMinutes * 60;
  renderTimer();
}

function setPreset(minutes, button) {
  state.selectedMinutes = Number(minutes);
  state.secondsLeft = state.selectedMinutes * 60;
  state.isRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;

  $$(".preset").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  renderTimer();
}

function saveTasks() {
  localStorage.setItem("ruangSelaTasks", JSON.stringify(state.tasks));
}

function renderTasks() {
  const list = $("#taskList");
  list.innerHTML = "";

  if (!state.tasks.length) {
    list.innerHTML = `<li class="empty-task">Belum ada daftar. Tambahkan satu hal kecil yang ingin kamu selesaikan.</li>`;
  } else {
    state.tasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item ${task.done ? "done" : ""}`;
      item.innerHTML = `
        <button class="task-toggle" type="button" aria-label="Tandai selesai">${task.done ? "✓" : ""}</button>
        <span></span>
        <button class="task-delete" type="button" aria-label="Hapus tugas">×</button>
      `;
      item.querySelector("span").textContent = task.text;
      item.querySelector(".task-toggle").addEventListener("click", () => toggleTask(task.id));
      item.querySelector(".task-delete").addEventListener("click", () => deleteTask(task.id));
      list.appendChild(item);
    });
  }

  const completed = state.tasks.filter((task) => task.done).length;
  $("#taskCount").textContent = `${completed} selesai`;
}

function addTask(text) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    text,
    done: false
  });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function setupNote() {
  const note = $("#quickNote");
  const savedNote = localStorage.getItem("ruangSelaNote") || "";
  note.value = savedNote;
  updateNoteCounter();

  let saveTimeout;
  note.addEventListener("input", () => {
    $("#saveState").textContent = "menyimpan...";
    updateNoteCounter();
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
      localStorage.setItem("ruangSelaNote", note.value);
      $("#saveState").textContent = "tersimpan lokal";
    }, 350);
  });

  $("#clearNote").addEventListener("click", () => {
    note.value = "";
    localStorage.removeItem("ruangSelaNote");
    $("#saveState").textContent = "catatan kosong";
    updateNoteCounter();
  });
}

function updateNoteCounter() {
  $("#noteCounter").textContent = `${$("#quickNote").value.length} / 500`;
}

$("#startTimer").addEventListener("click", toggleTimer);
$("#resetTimer").addEventListener("click", resetTimer);

$$(".preset").forEach((button) => {
  button.addEventListener("click", () => setPreset(button.dataset.minutes, button));
});

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = "";
});

$("#shuffleQuote").addEventListener("click", () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  $("#quoteText").textContent = quote;
});

$$(".mood-button").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".mood-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    $("#moodTitle").textContent = button.dataset.mood;
    localStorage.setItem("ruangSelaMood", button.dataset.mood);
  });
});

$("#soundButton").addEventListener("click", () => {
  document.body.classList.toggle("ambient-on");
  const enabled = document.body.classList.contains("ambient-on");
  $("#soundButton").classList.toggle("active", enabled);
  $("#soundLabel").textContent = enabled ? "ambient on" : "ambient off";
});

const storedMood = localStorage.getItem("ruangSelaMood");
if (storedMood) {
  const moodButton = $(`.mood-button[data-mood="${storedMood}"]`);
  if (moodButton) moodButton.click();
}

setupNote();
renderTasks();
renderTimer();
updateDateAndClock();
setInterval(updateDateAndClock, 1000);
