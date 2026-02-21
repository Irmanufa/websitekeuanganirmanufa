// ============================================
// IRMANUFA v5.0 - Mobile Optimized
// ============================================

// Konfigurasi
const CONFIG = {
  VERSION: "5.0",
  DEFAULT_FEE: 2000,
  STORAGE_KEY: "irmanufa_data",
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
};

// State Aplikasi
const AppState = {
  members: [],
  payments: [],
  expenses: [],
  settings: {
    weeklyFee: 2000,
    orgName: "IRMANUFA",
  },
  currentPage: "dashboard",
  selectedMember: null,
  charts: {},
};

// ========== INISIALISASI ==========
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupEventListeners();
  updateAllViews();
  setupDefaultDates();
});

function loadData() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      AppState.members = data.members || [];
      AppState.payments = data.payments || [];
      AppState.expenses = data.expenses || [];
      AppState.settings = { ...AppState.settings, ...data.settings };
    } else {
      createSampleData();
    }
  } catch (e) {
    console.error("Error loading data:", e);
    createSampleData();
  }
}

function saveData(showToastMsg = true) {
  try {
    const data = {
      members: AppState.members,
      payments: AppState.payments,
      expenses: AppState.expenses,
      settings: AppState.settings,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    updateLastSaveTime();
    if (showToastMsg) showToast("Data tersimpan");
  } catch (e) {
    console.error("Error saving data:", e);
    showToast("Gagal menyimpan", "error");
  }
}

function createSampleData() {
  const sampleNames = ["Ahmad Fauzi", "Budi Santoso", "Citra Dewi"];
  sampleNames.forEach((name, i) => {
    AppState.members.push({
      id: "MEM" + Date.now() + i,
      name,
      division: i === 0 ? "BPH" : "PSDM",
      status: "aktif",
      joinDate: new Date().toISOString().split("T")[0],
    });
  });
  saveData(false);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Menu toggle
  const menuBtn = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const sidebarClose = document.getElementById("sidebarClose");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => toggleSidebar(true));
  }

  if (sidebarClose) {
    sidebarClose.addEventListener("click", () => toggleSidebar(false));
  }

  if (overlay) {
    overlay.addEventListener("click", () => toggleSidebar(false));
  }

  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        navigateTo(page);
        toggleSidebar(false);
      }
    });
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleSidebar(false);
      closeAllModals();
    }
  });

  // Hash change
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.substring(1) || "dashboard";
    navigateTo(hash);
  });
}

// ========== NAVIGASI ==========
function navigateTo(page) {
  if (AppState.currentPage === page) return;

  const currentPage = document.getElementById(AppState.currentPage);
  const targetPage = document.getElementById(page);

  if (currentPage) currentPage.classList.remove("active");
  if (targetPage) {
    targetPage.classList.add("active");
    AppState.currentPage = page;
    window.location.hash = page;

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === page);
    });

    // Load page content
    loadPageContent(page);
  }
}

function loadPageContent(page) {
  switch (page) {
    case "dashboard":
      updateDashboard();
      setTimeout(initCharts, 100);
      break;
    case "bayar":
      updateMembersGrid();
      break;
    case "pengeluaran":
      updateExpenseList();
      break;
    case "anggota":
      updateAnggotaGrid();
      break;
    case "transaksi":
      updateTransactionsList();
      break;
    case "laporan":
      setDefaultReportDates();
      break;
  }
}

function toggleSidebar(show) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (show === true) {
    sidebar?.classList.add("active");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  } else if (show === false) {
    sidebar?.classList.remove("active");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ========== DASHBOARD ==========
function updateDashboard() {
  const totalIncome = AppState.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  document.getElementById("mainSaldo").textContent = formatCurrency(balance);
  document.getElementById("totalIncome").textContent =
    formatCurrency(totalIncome);
  document.getElementById("totalExpense").textContent =
    formatCurrency(totalExpense);
  document.getElementById("totalMembers").textContent = AppState.members.length;
  document.getElementById("dashboardBalance").textContent =
    formatCurrency(balance);

  updateActivityList();
  updateNavBadges();
}

function updateActivityList() {
  const container = document.getElementById("activityList");
  if (!container) return;

  const activities = [
    ...AppState.payments.slice(0, 5).map((p) => ({
      ...p,
      type: "income",
      desc: p.memberName,
      amountClass: "income",
    })),
    ...AppState.expenses.slice(0, 5).map((e) => ({
      ...e,
      type: "expense",
      desc: e.description,
      amountClass: "expense",
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (!activities.length) {
    container.innerHTML = '<div class="empty-state">Belum ada aktivitas</div>';
    return;
  }

  container.innerHTML = activities
    .map(
      (a) => `
        <div class="activity-item">
            <div class="activity-info">
                <strong>${escapeHtml(a.desc)}</strong>
                <small>${formatDate(a.date)}</small>
            </div>
            <div class="activity-amount ${a.amountClass}">
                ${a.type === "income" ? "+" : "-"} ${formatCurrency(a.amount)}
            </div>
        </div>
    `,
    )
    .join("");
}

function updateNavBadges() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const unpaid = AppState.members.filter((m) => {
    if (m.status !== "aktif") return false;
    return !m.lastPayment || new Date(m.lastPayment) < weekAgo;
  }).length;

  const badge = document.getElementById("pendingPaymentBadge");
  if (badge) {
    badge.textContent = unpaid > 9 ? "9+" : unpaid;
    badge.style.display = unpaid > 0 ? "block" : "none";
  }
}

// ========== CHARTS ==========
function initCharts() {
  const ctx = document.getElementById("mainChart");
  if (!ctx) return;

  if (AppState.charts.main) {
    AppState.charts.main.destroy();
  }

  const days = 7;
  const labels = [];
  const income = [];
  const expense = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    labels.push(date.toLocaleDateString("id-ID", { weekday: "short" }));

    const dayIncome = AppState.payments
      .filter((p) => p.date === dateStr)
      .reduce((sum, p) => sum + p.amount, 0);
    const dayExpense = AppState.expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    income.push(dayIncome);
    expense.push(dayExpense);
  }

  AppState.charts.main = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Pemasukan",
          data: income,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: "Pengeluaran",
          data: expense,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => "Rp" + v / 1000 + "k",
          },
        },
      },
    },
  });
}

// ========== BAYAR KAS ==========
function updateMembersGrid() {
  const grid = document.getElementById("membersGrid");
  if (!grid) return;

  const active = AppState.members.filter((m) => m.status === "aktif");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (!active.length) {
    grid.innerHTML = '<div class="empty-state">Belum ada anggota aktif</div>';
    return;
  }

  grid.innerHTML = active
    .map((m) => {
      const last = m.lastPayment ? new Date(m.lastPayment) : null;
      const status = last && last >= weekAgo ? "paid" : "unpaid";
      const statusText = status === "paid" ? "Sudah Bayar" : "Belum Bayar";
      const isSelected = AppState.selectedMember?.id === m.id;

      return `
            <div class="member-card ${isSelected ? "selected" : ""}" 
                 onclick="selectMember('${m.id}')">
                <div class="member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="member-name">${escapeHtml(m.name)}</div>
                <div class="member-division">${escapeHtml(m.division)}</div>
                <div class="member-status ${status}">${statusText}</div>
            </div>
        `;
    })
    .join("");
}

function searchMembers() {
  const term =
    document.getElementById("searchMember")?.value.toLowerCase() || "";

  document.querySelectorAll(".member-card").forEach((card) => {
    const name =
      card.querySelector(".member-name")?.textContent.toLowerCase() || "";
    const div =
      card.querySelector(".member-division")?.textContent.toLowerCase() || "";
    card.style.display =
      term === "" || name.includes(term) || div.includes(term)
        ? "block"
        : "none";
  });
}

function filterMembers(status) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  document.querySelectorAll(".member-card").forEach((card) => {
    const cardStatus = card
      .querySelector(".member-status")
      ?.classList.contains("paid");
    let show = false;

    if (status === "all") show = true;
    else if (status === "paid") show = cardStatus;
    else if (status === "unpaid") show = !cardStatus;

    card.style.display = show ? "block" : "none";
  });
}

function selectMember(id) {
  const member = AppState.members.find((m) => m.id === id);
  if (!member) return;

  AppState.selectedMember = member;

  document
    .querySelectorAll(".member-card")
    .forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector(`.member-card[onclick*="'${id}'"]`);
  if (card) card.classList.add("selected");

  const form = document.getElementById("paymentForm");
  const info = document.getElementById("selectedMemberInfo");

  if (form && info) {
    info.innerHTML = `
            <strong>${escapeHtml(member.name)}</strong><br>
            <small>${escapeHtml(member.division)}</small>
        `;
    form.style.display = "block";
    document.getElementById("paymentDate").value = new Date()
      .toISOString()
      .split("T")[0];
  }
}

function processPayment(e) {
  e.preventDefault();

  if (!AppState.selectedMember) {
    showToast("Pilih anggota dulu", "warning");
    return;
  }

  const amount = parseInt(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value;
  const notes = document.getElementById("paymentNotes").value;

  if (!amount || amount < AppState.settings.weeklyFee) {
    showToast("Jumlah minimal Rp " + AppState.settings.weeklyFee, "warning");
    return;
  }

  const payment = {
    id: "PAY" + Date.now() + Math.random().toString(36).substr(2, 5),
    memberId: AppState.selectedMember.id,
    memberName: AppState.selectedMember.name,
    division: AppState.selectedMember.division,
    amount,
    date,
    notes: notes || "Pembayaran kas",
    type: "income",
  };

  AppState.payments.push(payment);

  const member = AppState.members.find(
    (m) => m.id === AppState.selectedMember.id,
  );
  if (member) {
    member.lastPayment = date;
  }

  if (saveData()) {
    showToast("Pembayaran berhasil");
    closePaymentForm();
    updateAllViews();

    setTimeout(() => navigateTo("transaksi"), 500);
  }
}

function closePaymentForm() {
  AppState.selectedMember = null;
  const form = document.getElementById("paymentForm");
  if (form) form.style.display = "none";

  document
    .querySelectorAll(".member-card")
    .forEach((c) => c.classList.remove("selected"));
}

// ========== PENGELUARAN ==========
function showExpenseForm() {
  document.getElementById("expenseForm").style.display = "block";
  document.getElementById("expenseDate").value = new Date()
    .toISOString()
    .split("T")[0];
}

function hideExpenseForm() {
  document.getElementById("expenseForm").style.display = "none";
}

function addExpense(e) {
  e.preventDefault();

  const category = document.getElementById("expenseCategory").value;
  const amount = parseInt(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const description = document.getElementById("expenseDescription").value;

  if (!category || !amount || !description) {
    showToast("Semua field harus diisi", "warning");
    return;
  }

  const expense = {
    id: "EXP" + Date.now() + Math.random().toString(36).substr(2, 5),
    category,
    amount,
    date,
    description,
    type: "expense",
  };

  AppState.expenses.push(expense);

  if (saveData()) {
    showToast("Pengeluaran dicatat");
    hideExpenseForm();
    e.target.reset();
    updateAllViews();

    setTimeout(() => navigateTo("transaksi"), 500);
  }
}

function updateExpenseList() {
  const container = document.getElementById("expenseList");
  if (!container) return;

  const expenses = [...AppState.expenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  if (!expenses.length) {
    container.innerHTML =
      '<div class="empty-state">Belum ada pengeluaran</div>';
    return;
  }

  container.innerHTML = expenses
    .map(
      (e) => `
        <div class="expense-item">
            <div class="expense-info">
                <h4>${escapeHtml(e.category)}</h4>
                <p>${escapeHtml(e.description)}</p>
                <small>${formatDate(e.date)}</small>
            </div>
            <div class="expense-amount">${formatCurrency(e.amount)}</div>
        </div>
    `,
    )
    .join("");
}

// ========== ANGGOTA ==========
function updateAnggotaGrid() {
  const grid = document.getElementById("anggotaGrid");
  if (!grid) return;

  if (!AppState.members.length) {
    grid.innerHTML = '<div class="empty-state">Belum ada anggota</div>';
    return;
  }

  grid.innerHTML = AppState.members
    .map(
      (m) => `
        <div class="anggota-card">
            <div class="anggota-info">
                <h4>${escapeHtml(m.name)}</h4>
                <p>${escapeHtml(m.division)}</p>
            </div>
            <div class="anggota-actions">
                <button class="btn-edit" onclick="editMember('${m.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-icon" onclick="confirmDelete('member', '${m.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function searchAnggota() {
  const term =
    document.getElementById("searchAnggota")?.value.toLowerCase() || "";

  document.querySelectorAll(".anggota-card").forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = term === "" || text.includes(term) ? "flex" : "none";
  });
}

function showAddMemberModal() {
  document.getElementById("memberId").value = "";
  document.getElementById("memberName").value = "";
  document.getElementById("memberDivision").value = "";
  document.getElementById("memberModal").classList.add("active");
}

function editMember(id) {
  const member = AppState.members.find((m) => m.id === id);
  if (!member) return;

  document.getElementById("memberId").value = member.id;
  document.getElementById("memberName").value = member.name;
  document.getElementById("memberDivision").value = member.division;
  document.getElementById("memberModal").classList.add("active");
}

function saveMember(e) {
  e.preventDefault();

  const id = document.getElementById("memberId").value;
  const name = document.getElementById("memberName").value.trim();
  const division = document.getElementById("memberDivision").value.trim();

  if (!name || !division) {
    showToast("Nama dan divisi harus diisi", "warning");
    return;
  }

  if (id) {
    const member = AppState.members.find((m) => m.id === id);
    if (member) {
      member.name = name;
      member.division = division;
      showToast("Anggota diperbarui");
    }
  } else {
    AppState.members.push({
      id: "MEM" + Date.now() + Math.random().toString(36).substr(2, 5),
      name,
      division,
      status: "aktif",
      joinDate: new Date().toISOString().split("T")[0],
    });
    showToast("Anggota ditambahkan");
  }

  if (saveData()) {
    closeMemberModal();
    updateAllViews();
  }
}

function closeMemberModal() {
  document.getElementById("memberModal").classList.remove("active");
}

// ========== TRANSAKSI ==========
function updateTransactionsList() {
  const container = document.getElementById("transactionsList");
  if (!container) return;

  const type = document.getElementById("transactionType")?.value || "all";

  let transactions = [
    ...AppState.payments.map((p) => ({
      ...p,
      type: "income",
      typeClass: "income",
    })),
    ...AppState.expenses.map((e) => ({
      ...e,
      type: "expense",
      typeClass: "expense",
    })),
  ];

  if (type !== "all") {
    transactions = transactions.filter((t) => t.type === type);
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!transactions.length) {
    container.innerHTML = '<div class="empty-state">Belum ada transaksi</div>';
    return;
  }

  container.innerHTML = transactions
    .map(
      (t) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <strong>${escapeHtml(t.memberName || t.category)}</strong>
                <small>${formatDate(t.date)} • ${escapeHtml(t.notes || t.description || "")}</small>
            </div>
            <div class="transaction-amount ${t.typeClass}">
                ${t.type === "income" ? "+" : "-"} ${formatCurrency(t.amount)}
            </div>
            <button class="btn-delete-icon" onclick="confirmDelete('transaction', '${t.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `,
    )
    .join("");
}

function filterTransactions() {
  updateTransactionsList();
}

// ========== LAPORAN ==========
function setDefaultReportDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById("reportStart").value = firstDay
    .toISOString()
    .split("T")[0];
  document.getElementById("reportEnd").value = today
    .toISOString()
    .split("T")[0];
}

function generateReport() {
  const start = document.getElementById("reportStart").value;
  const end = document.getElementById("reportEnd").value;

  if (!start || !end) {
    showToast("Pilih periode laporan", "warning");
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59);

  const payments = AppState.payments.filter((p) => {
    const d = new Date(p.date);
    return d >= startDate && d <= endDate;
  });

  const expenses = AppState.expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= startDate && d <= endDate;
  });

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  const container = document.getElementById("reportResult");
  container.innerHTML = `
        <h3>Laporan Keuangan</h3>
        <p>${formatDate(start)} - ${formatDate(end)}</p>
        <div style="margin: 20px 0;">
            <div>Total Pemasukan: ${formatCurrency(totalIncome)}</div>
            <div>Total Pengeluaran: ${formatCurrency(totalExpense)}</div>
            <div>Saldo: ${formatCurrency(totalIncome - totalExpense)}</div>
            <div>Jumlah Transaksi: ${payments.length + expenses.length}</div>
        </div>
    `;
  container.style.display = "block";
}

// ========== BACKUP ==========
function showBackupOptions() {
  document.getElementById("backupModal").classList.add("active");
}

function exportData() {
  try {
    const data = {
      version: CONFIG.VERSION,
      exported: new Date().toISOString(),
      members: AppState.members,
      payments: AppState.payments,
      expenses: AppState.expenses,
      settings: AppState.settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast("Backup berhasil diekspor");
    document.getElementById("backupModal").classList.remove("active");
  } catch (e) {
    console.error(e);
    showToast("Gagal export", "error");
  }
}

function importData() {
  document.getElementById("importFile").click();
  document.getElementById("backupModal").classList.remove("active");
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.members) AppState.members = data.members;
      if (data.payments) AppState.payments = data.payments;
      if (data.expenses) AppState.expenses = data.expenses;
      if (data.settings)
        AppState.settings = { ...AppState.settings, ...data.settings };

      if (saveData()) {
        showToast("Data berhasil diimpor");
        updateAllViews();
      }
    } catch (err) {
      showToast("File tidak valid", "error");
    }
  };
  reader.readAsText(file);
}

// ========== DELETE ==========
function confirmDelete(type, id, customCallback) {
  const modal = document.getElementById("confirmModal");
  const message = document.getElementById("confirmMessage");
  const confirmBtn = document.getElementById("confirmActionBtn");

  let msg = "";
  if (type === "member")
    msg = "Hapus anggota ini? Semua transaksinya juga akan dihapus.";
  else if (type === "transaction") msg = "Hapus transaksi ini?";
  else if (type === "reset")
    msg = "⚠️ RESET SEMUA DATA? Tindakan ini tidak bisa dibatalkan!";
  else msg = "Yakin ingin melanjutkan?";

  message.textContent = msg;
  modal.classList.add("active");

  confirmBtn.onclick = function () {
    if (type === "member" && id) deleteMember(id);
    else if (type === "transaction" && id) deleteTransaction(id);
    else if (type === "reset") resetDataConfirm();
    else if (customCallback) customCallback();

    closeConfirmModal();
  };
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.remove("active");
}

function deleteMember(id) {
  AppState.members = AppState.members.filter((m) => m.id !== id);
  AppState.payments = AppState.payments.filter((p) => p.memberId !== id);

  if (saveData()) {
    showToast("Anggota dihapus");
    updateAllViews();
  }
}

function deleteTransaction(id) {
  AppState.payments = AppState.payments.filter((p) => p.id !== id);
  AppState.expenses = AppState.expenses.filter((e) => e.id !== id);

  if (saveData()) {
    showToast("Transaksi dihapus");
    updateAllViews();
  }
}

function resetData() {
  confirmDelete("reset");
}

function resetDataConfirm() {
  AppState.members = [];
  AppState.payments = [];
  AppState.expenses = [];
  AppState.settings = { weeklyFee: 2000, orgName: "IRMANUFA" };

  if (saveData()) {
    showToast("Semua data direset");
    setTimeout(() => location.reload(), 1000);
  }
}

// ========== UTILITIES ==========
function updateAllViews() {
  updateDashboard();
  updateMembersGrid();
  updateExpenseList();
  updateAnggotaGrid();
  updateTransactionsList();
}

function updateLastSaveTime() {
  const el = document.getElementById("lastUpdate");
  if (el) {
    el.textContent = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function setupDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = ["paymentDate", "expenseDate"];
  dateInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${message}</span>
    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, CONFIG.TOAST_DURATION);
}

function closeAllModals() {
  document
    .querySelectorAll(".modal.active")
    .forEach((m) => m.classList.remove("active"));
}

// ========== EXPORT GLOBAL ==========
window.navigateTo = navigateTo;
window.searchMembers = searchMembers;
window.filterMembers = filterMembers;
window.selectMember = selectMember;
window.processPayment = processPayment;
window.closePaymentForm = closePaymentForm;
window.showExpenseForm = showExpenseForm;
window.hideExpenseForm = hideExpenseForm;
window.addExpense = addExpense;
window.searchAnggota = searchAnggota;
window.showAddMemberModal = showAddMemberModal;
window.editMember = editMember;
window.saveMember = saveMember;
window.closeMemberModal = closeMemberModal;
window.filterTransactions = filterTransactions;
window.generateReport = generateReport;
window.showBackupOptions = showBackupOptions;
window.exportData = exportData;
window.importData = importData;
window.handleFileImport = handleFileImport;
window.resetData = resetData;
window.confirmDelete = confirmDelete;
window.closeConfirmModal = closeConfirmModal;
