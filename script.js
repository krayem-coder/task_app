// ── State ──────────────────────────────────────────────────
const STORAGE_KEY = "ai-task-tracker";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";

// ── DOM Elements ──────────────────────────────────────────
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const themeToggle = document.getElementById("theme-toggle");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

// ── Persistence ───────────────────────────────────────────
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Rendering ─────────────────────────────────────────────
function renderTasks() {
  taskList.innerHTML = "";

  const filtered = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.innerHTML = "<span>📋</span>No tasks here yet!";
    taskList.appendChild(empty);
  } else {
    filtered.forEach((task) => taskList.appendChild(createTaskElement(task)));
  }

  updateCount();
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " completed" : "");
  li.dataset.id = task.id;

  const checkbox = document.createElement("div");
  checkbox.className = "task-checkbox" + (task.completed ? " checked" : "");
  checkbox.setAttribute("role", "checkbox");
  checkbox.setAttribute("aria-checked", task.completed);
  checkbox.addEventListener("click", () => toggleTask(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "✕";
  deleteBtn.setAttribute("aria-label", "Delete task");
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  li.append(checkbox, text, deleteBtn);
  return li;
}

function updateCount() {
  const active = tasks.filter((t) => !t.completed).length;
  const total = tasks.length;
  taskCount.textContent = `${active} active / ${total} total`;
}

// ── Actions ───────────────────────────────────────────────
function addTask(text) {
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: text.trim(),
    completed: false,
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
}

// ── Theme ─────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ── Event Listeners ───────────────────────────────────────
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text) {
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  }
});

themeToggle.addEventListener("click", toggleTheme);
clearBtn.addEventListener("click", clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ── Init ──────────────────────────────────────────────────
initTheme();
renderTasks();
