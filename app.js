// Key for localStorage persistence
const STORAGE_KEY = 'controle_gastos_data_v1';

// Application State
let expenses = [];
let currentIndex = 0;

// Web Audio API Sound Effects generator (8-bit style)
const audioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function play8BitSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'click') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'coin') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'delete') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

// Format BRL currency
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

// Format Date YYYY-MM-DD to DD/MM/YYYY
function formatDate(dateString) {
  if (!dateString) return 'Não informada';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

// LocalStorage Persistence
function loadExpensesFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      expenses = JSON.parse(data);
    } else {
      // Default sample data if empty
      expenses = [
        {
          id: Date.now().toString(),
          description: 'Aluguel do Mês',
          category: 'Moradia',
          totalAmount: 1200.00,
          paidAmount: 400.00,
          dueDate: '2026-09-10'
        },
        {
          id: (Date.now() + 1).toString(),
          description: 'Supermercado',
          category: 'Alimentação',
          totalAmount: 450.00,
          paidAmount: 450.00,
          dueDate: '2026-09-05'
        }
      ];
      saveExpensesToStorage();
    }
  } catch (err) {
    console.error('Erro ao carregar dados do localStorage:', err);
    expenses = [];
  }
}

function saveExpensesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Erro ao salvar dados no localStorage:', err);
  }
}

// Data Manipulations
function addExpense(description, category, totalAmount, paidAmount, dueDate) {
  const newExpense = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
    description: description.trim(),
    category: category || 'Outros',
    totalAmount: parseFloat(totalAmount) || 0,
    paidAmount: parseFloat(paidAmount) || 0,
    dueDate: dueDate || ''
  };

  expenses.push(newExpense);
  currentIndex = expenses.length - 1; // Focus new item
  saveExpensesToStorage();
  play8BitSound('coin');
  renderApp();
}

function removeCurrentExpense() {
  if (expenses.length === 0) return;

  expenses.splice(currentIndex, 1);
  if (currentIndex >= expenses.length) {
    currentIndex = Math.max(0, expenses.length - 1);
  }
  saveExpensesToStorage();
  play8BitSound('delete');
  renderApp();
}

function payAmountOnCurrentExpense(amount) {
  if (expenses.length === 0 || isNaN(amount) || amount <= 0) return;

  const current = expenses[currentIndex];
  current.paidAmount = Math.min(current.totalAmount, (current.paidAmount || 0) + amount);
  saveExpensesToStorage();
  play8BitSound('coin');
  renderApp();
}

// Import & Export Logic
function exportExpensesToJSON() {
  play8BitSound('click');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `controle_de_gastos_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importExpensesFromJSON(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        expenses = importedData;
        currentIndex = 0;
        saveExpensesToStorage();
        play8BitSound('coin');
        renderApp();
        alert('Gastos importados com sucesso!');
      } else {
        alert('Formato de arquivo inválido. Esperado uma lista de gastos.');
      }
    } catch (err) {
      alert('Erro ao ler o arquivo JSON.');
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// Navigation Carousel Logic
function goToPreviousExpense() {
  if (currentIndex > 0) {
    currentIndex--;
    play8BitSound('click');
    renderApp();
  }
}

function goToNextExpense() {
  if (currentIndex < expenses.length - 1) {
    currentIndex++;
    play8BitSound('click');
    renderApp();
  }
}

// DOM Elements
const noExpensesView = document.getElementById('no-expenses-view');
const expenseCard = document.getElementById('expense-card');

const cardTitle = document.getElementById('card-title');
const expenseDescription = document.getElementById('expense-description');
const expenseCategory = document.getElementById('expense-category');
const expenseDueDate = document.getElementById('expense-due-date');
const expenseTotal = document.getElementById('expense-total');
const expensePaid = document.getElementById('expense-paid');
const expenseRemaining = document.getElementById('expense-remaining');
const expenseProgress = document.getElementById('expense-progress');
const progressPercentage = document.getElementById('progress-percentage');
const expenseCounter = document.getElementById('expense-counter');

const btnPrev = document.getElementById('btn-prev-expense');
const btnNext = document.getElementById('btn-next-expense');
const btnRemove = document.getElementById('btn-remove-expense');
const btnPayAmount = document.getElementById('btn-pay-amount');
const payAmountInput = document.getElementById('pay-amount-input');

const btnOpenAddModal = document.getElementById('btn-open-add-modal');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const addModal = document.getElementById('add-modal');
const addExpenseForm = document.getElementById('add-expense-form');

const btnExport = document.getElementById('btn-export');
const importFileInput = document.getElementById('import-file');

// UI Render Logic
function renderApp() {
  if (expenses.length === 0) {
    noExpensesView.classList.remove('hidden');
    expenseCard.classList.add('hidden');
    return;
  }

  noExpensesView.classList.add('hidden');
  expenseCard.classList.remove('hidden');

  const current = expenses[currentIndex];
  const total = current.totalAmount || 0;
  const paid = current.paidAmount || 0;
  const remaining = Math.max(0, total - paid);
  const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  cardTitle.textContent = `Gasto #${currentIndex + 1}`;
  expenseDescription.textContent = current.description;
  expenseCategory.textContent = current.category || 'Outros';
  expenseDueDate.textContent = formatDate(current.dueDate);

  expenseTotal.textContent = formatCurrency(total);
  expensePaid.textContent = formatCurrency(paid);
  expenseRemaining.textContent = formatCurrency(remaining);

  // Progress bar logic: showing payment progress
  expenseProgress.value = percentage;
  progressPercentage.textContent = `${percentage}% (Falta ${formatCurrency(remaining)})`;

  // Update progress bar color style based on status
  expenseProgress.className = 'nes-progress ';
  if (percentage >= 100) {
    expenseProgress.classList.add('is-success');
  } else if (percentage >= 50) {
    expenseProgress.classList.add('is-warning');
  } else {
    expenseProgress.classList.add('is-error');
  }

  expenseCounter.textContent = `${currentIndex + 1} / ${expenses.length}`;

  // Button disabled states
  btnPrev.disabled = currentIndex === 0;
  btnNext.disabled = currentIndex === expenses.length - 1;
}

// Event Listeners setup
function setupEventListeners() {
  // Navigation
  btnPrev.addEventListener('click', goToPreviousExpense);
  btnNext.addEventListener('click', goToNextExpense);

  // Pay amount
  btnPayAmount.addEventListener('click', () => {
    const val = parseFloat(payAmountInput.value);
    if (!isNaN(val) && val > 0) {
      payAmountOnCurrentExpense(val);
      payAmountInput.value = '';
    }
  });

  // Remove expense
  btnRemove.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja remover este gasto?')) {
      removeCurrentExpense();
    }
  });

  // Add Modal controls
  btnOpenAddModal.addEventListener('click', () => {
    play8BitSound('click');
    addExpenseForm.reset();
    if (typeof addModal.showModal === 'function') {
      addModal.showModal();
    } else {
      addModal.setAttribute('open', 'true');
    }
  });

  btnCancelAdd.addEventListener('click', () => {
    play8BitSound('click');
    if (typeof addModal.close === 'function') {
      addModal.close();
    } else {
      addModal.removeAttribute('open');
    }
  });

  addExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('input-description').value;
    const cat = document.getElementById('input-category').value;
    const total = document.getElementById('input-total').value;
    const paid = document.getElementById('input-paid').value;
    const due = document.getElementById('input-due-date').value;

    addExpense(desc, cat, total, paid, due);

    if (typeof addModal.close === 'function') {
      addModal.close();
    } else {
      addModal.removeAttribute('open');
    }
  });

  // Export / Import
  btnExport.addEventListener('click', exportExpensesToJSON);
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importExpensesFromJSON(file);
      importFileInput.value = '';
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadExpensesFromStorage();
  setupEventListeners();
  renderApp();
});
