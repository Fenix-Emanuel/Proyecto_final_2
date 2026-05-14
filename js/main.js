const form = document.querySelector("#transactionForm");
const descriptionInput = document.querySelector("#description");
const amountInput = document.querySelector("#amount");
const typeInput = document.querySelector("#type");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");

const balanceElement = document.querySelector("#balance");
const heroBalanceElement = document.querySelector("#heroBalance");
const incomeElement = document.querySelector("#totalIncome");
const expenseElement = document.querySelector("#totalExpense");
const tableBody = document.querySelector("#transactionsTable");
const emptyState = document.querySelector("#emptyState");

const searchInput = document.querySelector("#searchInput");
const filterType = document.querySelector("#filterType");
const sortSelect = document.querySelector("#sortSelect");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let categories = [];
let financeChart;

const formatCurrency = (value) => {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
};

const saveTransactions = () => {
  localStorage.setItem("transactions", JSON.stringify(transactions));
};

const loadCategories = async () => {
  try {
    const response = await fetch("./data/categories.json");

    if (!response.ok) {
      throw new Error("No se pudieron cargar las categorías");
    }

    categories = await response.json();
    renderCategories();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar las categorías desde el archivo JSON."
    });
  }
};

const renderCategories = () => {
  categoryInput.innerHTML = categories
    .map((category) => `<option value="${category.name}">${category.name}</option>`)
    .join("");
};

const getFilteredTransactions = () => {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = filterType.value;
  const selectedSort = sortSelect.value;

  const filtered = transactions.filter((transaction) => {
    const matchesDescription = transaction.description.toLowerCase().includes(searchText);
    const matchesType = selectedType === "all" || transaction.type === selectedType;

    return matchesDescription && matchesType;
  });

  return filtered.sort((a, b) => {
    if (selectedSort === "newest") return new Date(b.date) - new Date(a.date);
    if (selectedSort === "oldest") return new Date(a.date) - new Date(b.date);
    if (selectedSort === "highest") return b.amount - a.amount;
    if (selectedSort === "lowest") return a.amount - b.amount;
    return 0;
  });
};

const calculateTotals = () => {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income,
    expense,
    balance: income - expense
  };
};

const renderSummary = () => {
  const totals = calculateTotals();

  balanceElement.textContent = formatCurrency(totals.balance);
  heroBalanceElement.textContent = formatCurrency(totals.balance);
  incomeElement.textContent = formatCurrency(totals.income);
  expenseElement.textContent = formatCurrency(totals.expense);

  balanceElement.style.color = totals.balance < 0 ? "#ef4444" : "#ffffff";
  heroBalanceElement.style.color = totals.balance < 0 ? "#ef4444" : "#ffffff";
};

const renderTransactions = () => {
  const filteredTransactions = getFilteredTransactions();

  emptyState.style.display = filteredTransactions.length === 0 ? "block" : "none";

  tableBody.innerHTML = filteredTransactions
    .map((transaction) => {
      const typeText = transaction.type === "income" ? "Ingreso" : "Gasto";
      const badgeClass = transaction.type === "income" ? "badge-income" : "badge-expense";

      return `
        <tr>
          <td>${transaction.description}</td>
          <td>${transaction.category}</td>
          <td><span class="badge ${badgeClass}">${typeText}</span></td>
          <td>${transaction.date}</td>
          <td>${formatCurrency(transaction.amount)}</td>
          <td>
            <button class="delete-btn" data-id="${transaction.id}">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");
};

const renderChart = () => {
  const totals = calculateTotals();
  const ctx = document.querySelector("#financeChart");

  if (financeChart) {
    financeChart.destroy();
  }

  financeChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [
        {
          label: "Total",
          data: [totals.income, totals.expense],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#e5e7eb"
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        },
        y: {
          ticks: {
            color: "#e5e7eb"
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        }
      }
    }
  });
};

const renderApp = () => {
  renderSummary();
  renderTransactions();
  renderChart();
};

const resetForm = () => {
  form.reset();
  dateInput.valueAsDate = new Date();
};

const addTransaction = (event) => {
  event.preventDefault();

  const newTransaction = {
    id: crypto.randomUUID(),
    description: descriptionInput.value.trim(),
    amount: Number(amountInput.value),
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value
  };

  transactions.push(newTransaction);
  saveTransactions();
  renderApp();
  resetForm();

  Swal.fire({
    icon: "success",
    title: "Transacción guardada",
    text: "La operación fue agregada correctamente.",
    timer: 1600,
    showConfirmButton: false
  });
};

const deleteTransaction = (id) => {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  renderApp();

  Swal.fire({
    icon: "success",
    title: "Eliminada",
    text: "La transacción fue eliminada correctamente.",
    timer: 1400,
    showConfirmButton: false
  });
};

form.addEventListener("submit", addTransaction);

tableBody.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const transactionId = event.target.dataset.id;
    deleteTransaction(transactionId);
  }
});

searchInput.addEventListener("input", renderTransactions);
filterType.addEventListener("change", renderTransactions);
sortSelect.addEventListener("change", renderTransactions);

dateInput.valueAsDate = new Date();
loadCategories();
renderApp();
