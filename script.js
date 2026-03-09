// =====================================================
//  ToDo App — Redux-powered global state management
// =====================================================

// ── Action Types ─────────────────────────────────────────
const ADD_TASK = "ADD_TASK";
const TOGGLE_TASK = "TOGGLE_TASK";
const DELETE_TASK = "DELETE_TASK";
const EDIT_TASK = "EDIT_TASK";
const SET_FILTER = "SET_FILTER";

// ── Action Creators ──────────────────────────────────────
function addTaskAction(description) {
  return {
    type: ADD_TASK,
    payload: {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      description: description.trim(),
      isDone: false,
    },
  };
}

function toggleTaskAction(id) {
  return { type: TOGGLE_TASK, payload: { id } };
}

function deleteTaskAction(id) {
  return { type: DELETE_TASK, payload: { id } };
}

function editTaskAction(id, newDescription) {
  return {
    type: EDIT_TASK,
    payload: { id, description: newDescription.trim() },
  };
}

function setFilterAction(filter) {
  return { type: SET_FILTER, payload: { filter } };
}

// ── Initial State ────────────────────────────────────────
const STORAGE_KEY = "redux-todo-app";
const persistedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const initialState = {
  tasks: persistedTasks,
  filter: "all", // "all" | "done" | "not-done"
};

// ── Reducer ──────────────────────────────────────────────
function todoReducer(state, action) {
  if (typeof state === "undefined") {
    return initialState;
  }

  switch (action.type) {
    case ADD_TASK:
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case TOGGLE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(function (task) {
          return task.id === action.payload.id
            ? { ...task, isDone: !task.isDone }
            : task;
        }),
      };

    case DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(function (task) {
          return task.id !== action.payload.id;
        }),
      };

    case EDIT_TASK:
      return {
        ...state,
        tasks: state.tasks.map(function (task) {
          return task.id === action.payload.id
            ? { ...task, description: action.payload.description }
            : task;
        }),
      };

    case SET_FILTER:
      return { ...state, filter: action.payload.filter };

    default:
      return state;
  }
}

// ── Create Redux Store ───────────────────────────────────
var store = Redux.createStore(todoReducer);

// Persist to localStorage on every state change
store.subscribe(function () {
  var state = store.getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
});

// ══════════════════════════════════════════════════════════
//  COMPONENTS
// ══════════════════════════════════════════════════════════

// ── AddTask Component ────────────────────────────────────
// Handles the form submission to add a new task
var AddTask = (function () {
  var form = document.getElementById("task-form");
  var input = document.getElementById("task-input");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text) {
      store.dispatch(addTaskAction(text));
      input.value = "";
      input.focus();
    }
  });
})();

// ── Task Component ───────────────────────────────────────
// Creates a single task DOM element with toggle, edit, delete
function Task(task) {
  var li = document.createElement("li");
  li.className = "task-item" + (task.isDone ? " completed" : "");
  li.dataset.id = task.id;

  // Checkbox
  var checkbox = document.createElement("div");
  checkbox.className = "task-checkbox" + (task.isDone ? " checked" : "");
  checkbox.setAttribute("role", "checkbox");
  checkbox.setAttribute("aria-checked", task.isDone);
  checkbox.addEventListener("click", function () {
    store.dispatch(toggleTaskAction(task.id));
  });

  // Description text
  var text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.description;

  // Edit button
  var editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.innerHTML = "✎";
  editBtn.setAttribute("aria-label", "Edit task");
  editBtn.addEventListener("click", function () {
    enterEditMode(li, task);
  });

  // Delete button
  var deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "✕";
  deleteBtn.setAttribute("aria-label", "Delete task");
  deleteBtn.addEventListener("click", function () {
    store.dispatch(deleteTaskAction(task.id));
  });

  li.append(checkbox, text, editBtn, deleteBtn);
  return li;
}

// Edit-mode helper: replaces text with an input field
function enterEditMode(li, task) {
  var textSpan = li.querySelector(".task-text");
  var editBtn = li.querySelector(".edit-btn");

  // Create input pre-filled with current description
  var input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = task.description;

  // Replace span with input
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  // Change edit button to save button
  editBtn.innerHTML = "✓";
  editBtn.className = "save-btn";

  function saveEdit() {
    var newDesc = input.value.trim();
    if (newDesc && newDesc !== task.description) {
      store.dispatch(editTaskAction(task.id, newDesc));
    } else {
      // Re-render without changes
      ListTask.render();
    }
  }

  editBtn.onclick = saveEdit;
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") ListTask.render();
  });
}

// ── ListTask Component ───────────────────────────────────
// Renders the filtered list of tasks
var ListTask = (function () {
  var taskListEl = document.getElementById("task-list");
  var taskCountEl = document.getElementById("task-count");
  var filterBtns = document.querySelectorAll(".filter-btn");
  var clearBtn = document.getElementById("clear-completed");

  function getFilteredTasks() {
    var state = store.getState();
    var tasks = state.tasks;
    var filter = state.filter;

    if (filter === "done")
      return tasks.filter(function (t) {
        return t.isDone;
      });
    if (filter === "not-done")
      return tasks.filter(function (t) {
        return !t.isDone;
      });
    return tasks;
  }

  function render() {
    var filtered = getFilteredTasks();
    taskListEl.innerHTML = "";

    if (filtered.length === 0) {
      var empty = document.createElement("li");
      empty.className = "empty-state";
      empty.innerHTML = "<span>📋</span>No tasks here yet!";
      taskListEl.appendChild(empty);
    } else {
      filtered.forEach(function (task) {
        taskListEl.appendChild(Task(task));
      });
    }

    updateCount();
  }

  function updateCount() {
    var state = store.getState();
    var active = state.tasks.filter(function (t) {
      return !t.isDone;
    }).length;
    var total = state.tasks.length;
    taskCountEl.textContent = active + " active / " + total + " total";
  }

  // Filter buttons
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      store.dispatch(setFilterAction(btn.dataset.filter));
    });
  });

  // Clear completed
  clearBtn.addEventListener("click", function () {
    var state = store.getState();
    state.tasks
      .filter(function (t) {
        return t.isDone;
      })
      .forEach(function (t) {
        store.dispatch(deleteTaskAction(t.id));
      });
  });

  // Subscribe to store – re-render on every state change
  store.subscribe(render);

  return { render: render };
})();

// ── Theme Toggle ─────────────────────────────────────────
(function () {
  var themeToggle = document.getElementById("theme-toggle");

  function initTheme() {
    var saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.body.classList.add("dark");
      themeToggle.textContent = "☀️";
    }
  }

  themeToggle.addEventListener("click", function () {
    var isDark = document.body.classList.toggle("dark");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  initTheme();
})();

// ── Initial Render ───────────────────────────────────────
ListTask.render();
