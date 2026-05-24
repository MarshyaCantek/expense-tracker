/**
 * =========================================================
 * EXPENSE TRACKER
 * =========================================================
 */

let transactions = [];
let editModeId = null;
let lastDeleted = null;

const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");

const form = document.getElementById("transactionForm");
const titleInput = document.getElementById("transactionFormTitleInput");
const amountInput = document.getElementById("transactionFormAmountInput");
const dateInput = document.getElementById("transactionFormDateInput");
const typeSelect = document.getElementById("transactionFormTypeSelect");

const searchInput = document.getElementById("searchTransactionFormTitleInput");

const balanceEl = document.querySelector(".tracker-summary__balance-amount");
const incomeEl = document.querySelector(
  ".tracker-summary__stat-amount--income",
);
const expenseEl = document.querySelector(
  ".tracker-summary__stat-amount--expense",
);

document.addEventListener("DOMContentLoaded", () => {
  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;

  loadFromStorage();
  emitUpdate();
});

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function formatCurrency(amount) {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function showToast(message, type = "default") {
  const existing = document.querySelector(".tracker-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "tracker-toast";
  toast.textContent = message;

  const colors = {
    income: { bg: "#10b981", border: "#059669" },
    expense: { bg: "#f59e0b", border: "#d97706" },
    delete: { bg: "#ef4444", border: "#dc2626" },
    edit: { bg: "#e8488a", border: "#c93577" },
    default: { bg: "#1a1a2e", border: "#4a4a6a" },
  };
  const c = colors[type] || colors.default;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%) translateY(10px)",
    background: c.bg,
    borderLeft: `4px solid ${c.border}`,
    color: "white",
    padding: "12px 22px",
    borderRadius: "12px",
    zIndex: "9999",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: "600",
    fontSize: ".88rem",
    boxShadow: "0 8px 24px rgba(0,0,0,.18)",
    opacity: "0",
    transition: "opacity .25s, transform .25s",
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(6px)";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function saveToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
function loadFromStorage() {
  const data = localStorage.getItem("transactions");
  transactions = data ? JSON.parse(data) : [];
}

function addTransaction(data) {
  transactions.push(data);
  saveToStorage();
}
function deleteTransaction(id) {
  lastDeleted = transactions.find((t) => t.id === id);
  transactions = transactions.filter((t) => t.id !== id);
  saveToStorage();
  showToast("Transaksi berhasil dihapus 🗑️", "delete");
}
function updateTransaction(id, payload) {
  transactions = transactions.map((t) =>
    t.id === id ? { ...t, ...payload } : t,
  );
  saveToStorage();
}
function toggleType(id) {
  transactions = transactions.map((t) =>
    t.id === id
      ? { ...t, type: t.type === "income" ? "expense" : "income" }
      : t,
  );
  saveToStorage();
}

const getIncome = () =>
  transactions
    .filter((t) => t.type === "income")
    .reduce((a, c) => a + Number(c.amount), 0);
const getExpense = () =>
  transactions
    .filter((t) => t.type === "expense")
    .reduce((a, c) => a + Number(c.amount), 0);
const getBalance = () => getIncome() - getExpense();

function createTransactionItem(t) {
  const item = document.createElement("div");
  item.className = "tracker-transaction-item";
  item.setAttribute("data-testid", "transactionItem"); // ← wajib untuk sistem penilaian Dicoding
  item.innerHTML = `
    <div class="tracker-transaction-item__icon tracker-transaction-item__icon--${t.type}">
      ${t.type === "income" ? "+" : "−"}
    </div>
    <div class="tracker-transaction-item__detail">
      <div class="tracker-transaction-item__title">${t.title}</div>
      <div class="tracker-transaction-item__date">${t.date}</div>
    </div>
    <div class="tracker-transaction-item__right">
      <div class="tracker-transaction-item__amount tracker-transaction-item__amount--${t.type}">
        ${formatCurrency(t.amount)}
      </div>
      <div class="tracker-transaction-item__actions">
        <button onclick="onEdit(${t.id})">✏️ Edit</button>
        <button onclick="onDelete(${t.id})">🗑️ Hapus</button>
        <button onclick="onToggle(${t.id})">🔄 Ubah</button>
      </div>
    </div>
  `;
  return item;
}

function render(data = transactions) {
  incomeList.innerHTML = "";
  expenseList.innerHTML = "";

  const incomeData = data.filter((t) => t.type === "income");
  const expenseData = data.filter((t) => t.type === "expense");

  if (incomeData.length === 0) {
    incomeList.innerHTML = `<p>📭 Belum ada pemasukan</p>`;
  } else {
    incomeData.forEach((t) => incomeList.appendChild(createTransactionItem(t)));
  }

  if (expenseData.length === 0) {
    expenseList.innerHTML = `<p>📭 Belum ada pengeluaran</p>`;
  } else {
    expenseData.forEach((t) =>
      expenseList.appendChild(createTransactionItem(t)),
    );
  }
}

function updateDashboard() {
  incomeEl.textContent = formatCurrency(getIncome());
  expenseEl.textContent = formatCurrency(getExpense());
  balanceEl.textContent = formatCurrency(getBalance());
}

function emitUpdate() {
  document.dispatchEvent(new Event("transaction:updated"));
}
document.addEventListener("transaction:updated", () => {
  render();
  updateDashboard();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const type = typeSelect.value;

  if (!title) return showToast("⚠️ Judul wajib diisi", "delete");
  if (amount < 1) return showToast("⚠️ Nominal tidak valid", "delete");
  if (!date) return showToast("⚠️ Tanggal wajib diisi", "delete");

  if (editModeId) {
    updateTransaction(editModeId, { title, amount, date, type });
    editModeId = null;
    document.querySelector(".tracker-form__submit").textContent = "Simpan";
    showToast("✅ Transaksi berhasil diperbarui", "edit");
  } else {
    addTransaction({ id: generateId(), title, amount, date, type });
    showToast(
      type === "income"
        ? "✅ Pemasukan ditambahkan!"
        : "✅ Pengeluaran ditambahkan!",
      type,
    );
  }

  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  emitUpdate();
});

searchInput.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = transactions.filter((t) =>
    t.title.toLowerCase().includes(keyword),
  );
  render(filtered);
});

function onDelete(id) {
  deleteTransaction(id);
  emitUpdate();
}
function onEdit(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  titleInput.value = t.title;
  amountInput.value = t.amount;
  dateInput.value = t.date;
  typeSelect.value = t.type;
  editModeId = id;
  document.querySelector(".tracker-form__submit").textContent = "💾 Perbarui";
  showToast("✏️ Mode edit aktif", "edit");
  document
    .querySelector(".tracker-form-section__card")
    .scrollIntoView({ behavior: "smooth" });
}
function onToggle(id) {
  toggleType(id);
  emitUpdate();
}
