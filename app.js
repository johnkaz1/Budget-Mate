let userId = null;
const API_URL = 'http://localhost:3000';
let chart;

/* =======================
   TOAST NOTIFICATIONS
======================= */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    });
}


/* =======================
   AUTH
======================= */
function signup() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showToast('Enter username and password', 'warning');
        return;
    }

    fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showToast(data.message, 'error');
            return;
        }

        showToast('Signup successful! Logging in...', 'success');
        login();
    })
    .catch(() => showToast('Server error during signup', 'error'));
}

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showToast('Enter username and password', 'warning');
        return;
    }

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => {
        if (res.status !== 200) {
            return res.json().then(d => { throw new Error(d.message); });
        }
        return res.json();
    })
    .then(data => {
        userId = data.id;
        showToast('Logged in successfully', 'success');

        const authDiv = document.getElementById('authDiv');
        const mainDiv = document.getElementById('mainDiv');

        authDiv.classList.add('fade-out');

        setTimeout(() => {
            authDiv.style.display = 'none';
            mainDiv.style.display = 'flex';
            mainDiv.classList.add('fade-in');
            fetchTransactions();
        }, 500);
    })
    .catch(err => showToast(err.message, 'error'));
}

/* =======================
   TRANSACTIONS
======================= */
function fetchTransactions() {
    fetch(`${API_URL}/transactions/${userId}`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#transactionsTable tbody');
            tbody.innerHTML = '';

            let income = 0;
            let expense = 0;

            data.forEach(tx => {
                const row = document.createElement('tr');
                row.classList.add('adding');

                row.innerHTML = `
                    <td>${tx.id}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.category}</td>
                    <td>${tx.type}</td>
                    <td>${tx.date}</td>
                    <td>${tx.description || ''}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteTransaction(${tx.id}, this)">
                            Delete
                        </button>
                    </td>
                `;

                tbody.appendChild(row);

                if (tx.type === 'income') income += parseFloat(tx.amount);
                else expense += parseFloat(tx.amount);
            });

            updateChart(income, expense);
        })
        .catch(() => showToast('Failed to load transactions', 'error'));
}

function addTransaction() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    if (!amount || !category || !date) {
        showToast('Please fill required fields', 'warning');
        return;
    }

    fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount,
            category,
            type,
            date,
            description,
            user_id: userId
        })
    })
    .then(res => res.json())
    .then(() => {
        showToast('Transaction added', 'success');
        fetchTransactions();
    })
    .catch(() => showToast('Failed to add transaction', 'error'));
}

function deleteTransaction(id, btn) {
    const tr = btn.closest('tr');
    tr.classList.add('deleting');

    setTimeout(() => {
        fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' })
            .then(() => {
                showToast('Transaction deleted', 'info');
                fetchTransactions();
            })
            .catch(() => showToast('Failed to delete transaction', 'error'));
    }, 500);
}

/* =======================
   DARK MODE
======================= */
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    showToast(`Dark mode ${isDark ? 'enabled' : 'disabled'}`, 'info');
}

window.onload = () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
};

/* =======================
   CHART
======================= */
function updateChart(income, expense) {
    const ctx = document.getElementById('summaryChart').getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#4caf50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
