

const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const dateInput = document.getElementById('date');
const categoryFilterSelect = document.getElementById('categoryFilter');
const expensesContainer = document.getElementById('expensesContainer');
const totalSpentElement = document.getElementById('totalSpent');
const expenseCountElement = document.getElementById('expenseCount');
const avgExpenseElement = document.getElementById('avgExpense');
const formStatus = document.getElementById('formStatus');

const CATEGORY_EMOJI = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Utilities: '💡',
    Health: '🏥',
    Education: '📚',
    Other: '📌'
};

let expenses = [];

let categoryChart = null;
let trendsChart = null;

function initializeApp() {
    if (!expenseForm) return;

    dateInput.valueAsDate = new Date();

    loadExpenses();

    updateDisplay();
}


function loadExpenses() {
    try {
        const savedData = localStorage.getItem('ledgerLeafExpenses');
        expenses = savedData ? JSON.parse(savedData) : [];
        if (!Array.isArray(expenses)) expenses = [];
    } catch (error) {
        console.error('Could not load saved expenses:', error);
        expenses = [];
    }
}

function saveExpenses() {
    try {
        localStorage.setItem('ledgerLeafExpenses', JSON.stringify(expenses));
    } catch (error) {
        console.error('Could not save expenses:', error);
        showFormStatus('Your expense was added, but it could not be saved for next time.', 'error');
    }
}

/**
 * Validate the add-expense form.
 * @returns {boolean} true if every field passes
 */
function validateExpenseForm() {
    let isValid = true;

    ['amount', 'category', 'date'].forEach(function (field) {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) errorEl.textContent = '';
        document.getElementById(field).classList.remove('is-invalid');
    });

    const amountValue = parseFloat(amountInput.value);
    if (!amountInput.value || isNaN(amountValue) || amountValue <= 0) {
        setError('amount', 'Enter an amount greater than ₨0.');
        isValid = false;
    }

    if (!categoryInput.value) {
        setError('category', 'Please choose a category.');
        isValid = false;
    }

    if (!dateInput.value) {
        setError('date', 'Please choose a date.');
        isValid = false;
    } else {
        const chosenDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (chosenDate > today) {
            setError('date', 'Date cannot be in the future.');
            isValid = false;
        }
    }

    return isValid;
}

function setError(field, message) {
    const errorEl = document.getElementById(field + 'Error');
    const inputEl = document.getElementById(field);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('is-invalid');
}

function showFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form__status is-visible form__status--' + type;
    if (type === 'success') {
        setTimeout(function () {
            formStatus.className = 'form__status';
        }, 4000);
    }
}


if (expenseForm) {
    expenseForm.addEventListener('submit', function (event) {
        event.preventDefault();

        try {
            if (!validateExpenseForm()) {
                showFormStatus('Please fix the highlighted fields.', 'error');
                return;
            }

            const newExpense = {
                id: Date.now(), 
                amount: parseFloat(amountInput.value),
                category: categoryInput.value,
                description: descriptionInput.value.trim(),
                date: dateInput.value
            };

            expenses.push(newExpense);
            saveExpenses();

            expenseForm.reset();
            dateInput.valueAsDate = new Date();

            updateDisplay();
            showFormStatus('Expense added to your ledger.', 'success');

        } catch (error) {
            console.error('Error adding expense:', error);
            showFormStatus('Something went wrong while adding that expense. Please try again.', 'error');
        }
    });
}

if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener('change', updateDisplay);
}


/**
 * Delete an expense by ID, after the user confirms.
 * @param {number} id
 */
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        expenses = expenses.filter(function (expense) { return expense.id !== id; });
        saveExpenses();
        updateDisplay();
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

/**
 * Get expenses filtered by the selected category (or all, if none chosen).
 * @returns {Array}
 */
function getFilteredExpenses() {
    const selectedCategory = categoryFilterSelect ? categoryFilterSelect.value : '';
    if (!selectedCategory) return expenses;
    return expenses.filter(function (expense) { return expense.category === selectedCategory; });
}

function updateDisplay() {
    updateStatistics();
    updateExpensesTable();
    updateCharts();
}

function updateStatistics() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
    const count = filtered.length;
    const average = count > 0 ? total / count : 0;

    if (totalSpentElement) totalSpentElement.textContent = '\u20A8' + total.toFixed(2);
    if (expenseCountElement) expenseCountElement.textContent = count;
    if (avgExpenseElement) avgExpenseElement.textContent = '\u20A8' + average.toFixed(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateExpensesTable() {
    if (!expensesContainer) return;

    const filtered = getFilteredExpenses();
    const sorted = filtered.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    if (sorted.length === 0) {
        if (expenses.length === 0) {
            expensesContainer.innerHTML = '<div class="empty-state">No expenses added yet. Start by adding your first expense above.</div>';
        } else {
            expensesContainer.innerHTML = '<div class="no-data">No expenses match this filter.</div>';
        }
        return;
    }

    let html = '<table class="expenses-table">' +
        '<thead><tr>' +
        '<th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Action</th>' +
        '</tr></thead><tbody>';

    sorted.forEach(function (expense) {
        const categoryClass = 'cat-' + expense.category.toLowerCase();
        const formattedDate = new Date(expense.date).toLocaleDateString();
        const emoji = CATEGORY_EMOJI[expense.category] || '📌';
        const description = expense.description ? escapeHtml(expense.description) : '\u2014';

        html += '<tr>' +
            '<td>' + formattedDate + '</td>' +
            '<td><span class="badge ' + categoryClass + '">' + emoji + ' ' + expense.category + '</span></td>' +
            '<td>' + description + '</td>' +
            '<td class="amount">\u20A8' + expense.amount.toFixed(2) + '</td>' +
            '<td><button class="btn btn--delete" onclick="deleteExpense(' + expense.id + ')">Delete</button></td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    expensesContainer.innerHTML = html;
}

function updateCharts() {
    updateCategoryChart();
    updateTrendsChart();
}

function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const categories = {};
    expenses.forEach(function (expense) {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    const ctx = canvas.getContext('2d');
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#C97B30', '#2E6E91', '#8E5BA8', '#2F8F7A', '#B5524A', '#1B6E5C', '#6B6458'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter' } } }
            }
        }
    });
}

function updateTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const last7Days = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        last7Days[dateString] = 0;
    }

    expenses.forEach(function (expense) {
        if (Object.prototype.hasOwnProperty.call(last7Days, expense.date)) {
            last7Days[expense.date] += expense.amount;
        }
    });

    const ctx = canvas.getContext('2d');
    if (trendsChart) trendsChart.destroy();

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(last7Days).map(function (dateStr) {
                return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Daily spending',
                data: Object.values(last7Days),
                borderColor: '#1B4332',
                backgroundColor: 'rgba(27, 67, 50, 0.08)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#C9A227'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) { return '\u20A8' + value.toFixed(0); }
                    }
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', initializeApp);
