let userId = null;
const API_URL = 'http://localhost:3000';
let chart;

// ----------------- Auth -----------------
function signup() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('authMessage');

    if(!username || !password) { msg.textContent='Enter username and password'; return; }

    fetch(`${API_URL}/signup`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    }).then(res=>res.json())
      .then(data=>{
          if(data.message) { msg.textContent=data.message; return; }
          msg.style.color='green';
          msg.textContent='Signup successful! Logging in...';
          login(); // auto-login after signup
      });
}

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('authMessage');

    if(!username || !password) { msg.textContent='Enter username and password'; return; }

    fetch(`${API_URL}/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    }).then(res=>{
        if(res.status!==200) return res.json().then(d=>{ throw new Error(d.message); });
        return res.json();
    }).then(data=>{
        userId = data.id;

        // Animate login card out
        const authDiv = document.getElementById('authDiv');
        const mainDiv = document.getElementById('mainDiv');

        authDiv.classList.add('fade-out');

        setTimeout(() => {
            authDiv.style.display = 'none';
            mainDiv.style.display = 'flex';
            mainDiv.classList.add('fade-in');

            fetchTransactions(); // fetch and display transactions + chart
        }, 500);
    }).catch(err=>{
        msg.textContent = err.message;
    });
}

// ----------------- Transactions -----------------
function fetchTransactions() {
    fetch(`${API_URL}/transactions/${userId}`)
    .then(res=>res.json())
    .then(data=>{
        const tbody = document.querySelector('#transactionsTable tbody');
        tbody.innerHTML='';
        let income=0, expense=0;

        data.forEach(tx=>{
            const row = document.createElement('tr');
            row.classList.add('adding'); // animation
            row.innerHTML = `
                <td>${tx.id}</td>
                <td>${tx.amount}</td>
                <td>${tx.category}</td>
                <td>${tx.type}</td>
                <td>${tx.date}</td>
                <td>${tx.description||''}</td>
                <td>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id}, this)">Delete</button>
                </td>
            `;
            tbody.appendChild(row);

            if(tx.type==='income') income+=parseFloat(tx.amount);
            else expense+=parseFloat(tx.amount);
        });

        updateChart(income, expense);
    });
}

function addTransaction() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    if(!amount || !category || !date) return alert('Please fill required fields');

    fetch(`${API_URL}/transactions`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({amount, category, type, date, description, user_id: userId})
    }).then(res=>res.json()).then(()=>{
        fetchTransactions(); // always fetch latest to update table + chart
    });
}

function deleteTransaction(id, btn) {
    const tr = btn.closest('tr');
    tr.classList.add('deleting'); // animation

    setTimeout(() => {
        fetch(`${API_URL}/transactions/${id}`, { method:'DELETE' })
        .then(()=> {
            fetchTransactions(); // refresh table + chart
        });
    }, 500);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');

    // save preference
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

window.onload = () => {
    if(localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
};


// ----------------- Chart -----------------
function updateChart(income, expense) {
    const ctx = document.getElementById('summaryChart').getContext('2d');

    if(chart) chart.destroy();

    chart = new Chart(ctx,{
        type:'doughnut',
        data:{
            labels:['Income','Expense'],
            datasets:[{ data:[income,expense], backgroundColor:['#4caf50','#f44336'] }]
        },
        options:{
            responsive:true,
            plugins:{ legend:{ position:'bottom' } }
        }
    });
}
