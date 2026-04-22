const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const budgetInput = document.getElementById("budget");
const budgetStatus = document.getElementById("budget-status");

let alertShown = false;
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let monthlyBudget = Number(localStorage.getItem("budget")) || 0;
budgetInput.value = monthlyBudget;

budgetInput.addEventListener("change", () => {
    monthlyBudget = Number(budgetInput.value);
    localStorage.setItem("budget", monthlyBudget);
    updateBudgetStatus();
});

function addTransaction(e) {
    e.preventDefault();

    let amt = Number(amount.value);
    if (type.value === "debit") amt = -amt;

    const transaction = {
        id: Date.now(),
        text: text.value,
        amount: amt,
		category: category.value,
        time: new Date().toLocaleString()
    };

    transactions.push(transaction);
    updateLocalStorage();
    init();

    text.value = "";
    amount.value = "";
    type.value = "";
	category.value="";
}

function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? "-" : "+";

    const item = document.createElement("li");
    item.classList.add("transaction-item");

    item.innerHTML = `
    <div>
        <strong>${transaction.text}</strong><br>
        <small>${transaction.category} | ${transaction.time}</small>
    </div>
    <div>
        <span>${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    </div>
`	;

    list.appendChild(item);
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);

    const total = amounts.reduce((acc, item) => acc + item, 0);
    const inc = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
    const exp = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0);

    balance.innerText = `₹${total}`;
    income.innerText = `₹${inc}`;
    expense.innerText = `₹${Math.abs(exp)}`;
	
	if (total < 0 && !alertShown) {
		alert("Warning: Your balance is below zero!");
		alertShown = true;
	}

	if (total >= 0) {
		alertShown = false;
	}
}

function getTotalExpenses() {
    return transactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

function updateBudgetStatus() {
    if (!monthlyBudget) {
        budgetStatus.innerText = "Set a budget to track spending";
        budgetStatus.className = "";
        return;
    }

    const totalExpenses = getTotalExpenses();
    const ratio = totalExpenses / monthlyBudget;
	const fill = document.getElementById("budget-fill");
	const percent = Math.min(ratio * 100, 100);
	fill.style.width = percent + "%";

	if (ratio < 0.75) fill.style.background = "green";
	else if (ratio < 1) fill.style.background = "orange";
	else fill.style.background = "red";

    if (ratio < 0.75) {
        budgetStatus.innerText = `Under budget (₹${totalExpenses} / ₹${monthlyBudget})`;
        budgetStatus.className = "budget-ok";
    } 
    else if (ratio < 1) {
        budgetStatus.innerText = `Close to budget (₹${totalExpenses} / ₹${monthlyBudget})`;
        budgetStatus.className = "budget-warning";
    } 
    else {
        budgetStatus.innerText = `Budget exceeded! (₹${totalExpenses} / ₹${monthlyBudget})`;
        budgetStatus.className = "budget-exceeded";
    }
}

//PIE CHART ANALYSIS
const modal = document.getElementById("chartModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

openBtn.onclick = () => {
    modal.style.display = "block";

    setTimeout(() => {
        renderChart();
    }, 100);
};

closeBtn.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

function getCategoryTotals() {
    const totals = {};

    transactions.forEach(t => {
         if (t.amount < 0) {
            const cat = t.category || "other";
            const amount = Math.abs(t.amount);

            if (!totals[cat]) totals[cat] = 0;
            totals[cat] += amount;
        }
    });

    return totals;
}

let chartInstance = null;

function renderChart() {
    const data = getCategoryTotals();

    const labels = Object.keys(data);
    const values = Object.values(data);

    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4CAF50",
                    "#9C27B0",
                    "#FF9800"
                ]
            }]
        },

        //options block
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                },
                datalabels: {
                    color: "#fff",
                    font: {
                        weight: "bold",
                        size: 14
                    },
                    formatter: (value, context) => {
                        const data = context.chart.data.datasets[0].data;
                        const total = data.reduce((a, b) => a + b, 0);
                        const percentage = (value / total * 100).toFixed(1);
                        return percentage + "%";
                    }
                }
            }
        },

        // plugin
        plugins: [ChartDataLabels]
    });
}

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    init();
}

function updateLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}


function init() {
    list.innerHTML = "";
    transactions.forEach(addTransactionDOM);
    updateValues();
	updateBudgetStatus();
}
function resetApp() {
    if (confirm("Are you sure you want to delete all transactions?")) {
        localStorage.removeItem("transactions");
        transactions = [];
        init();
    }
}

function togglePassword() {
    const pass = document.getElementById("password");
    pass.type = pass.type === "password" ? "text" : "password";
}

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const error = document.getElementById("login-error");

    if (user === "admin" && pass === "1234") {
        localStorage.setItem("loggedIn", "true");
		localStorage.setItem("user", user);
        showApp();
    } else {
        error.innerText = "Invalid username or password";
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("user");
    location.reload();
}

function showApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
	const user = localStorage.getItem("user");

    document.getElementById("welcome").innerText =
        "Welcome, " + user + " 👋";

}

if (localStorage.getItem("loggedIn") === "true") {
    showApp();
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        login();
    }
});

form.addEventListener("submit", addTransaction);
init();
