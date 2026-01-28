
let members = JSON.parse(localStorage.getItem('members')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

const name1 = document.getElementById('name1');
const add = document.getElementById('add');
const memberlist = document.getElementById('memberlist');
const select = document.getElementById('select');
const subscribe = document.getElementById('subscribe'); 
const settlementlist = document.getElementById('settlementList');
const summarytable = document.getElementById('summaryTable');
const exForm = document.getElementById('split');


updateUI();


add.addEventListener('click', () => {
    const nm = name1.value.trim();
    if (nm && !members.includes(nm)) {
        members.push(nm);
        name1.value = ''; 
        saveandrefresh();
    } else if (members.includes(nm)) {
        alert("This name already exists!");
    }
});


function deleteMember(nm) {
   
    members = members.filter(m => m !== nm);
    
    expenses = expenses.filter(e => e.payer !== nm);
    
    expenses = expenses.map(e => ({
        ...e,
        participants: e.participants.filter(p => p !== nm)
    }));
    saveandrefresh();
}


exForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const why = document.getElementById('why').value;
    const how = parseFloat(document.getElementById('how').value);
    const payer = select.value;
    const selectedParticipants = Array.from(document.querySelectorAll('.participant-checkbox:checked'))
                                     .map(cb => cb.value);

    
    if (!why || isNaN(how) || how <= 0) {
        alert("Please enter a valid reason and amount.");
        return;
    }
    if (selectedParticipants.length === 0) {
        alert("Please select at least one person to split with.");
        return;
    }

    const newExpense = { id: Date.now(), name: why, amount: how, payer, participants: selectedParticipants };
    expenses.push(newExpense);
    
    exForm.reset();
    saveandrefresh();
});


function calculateBalances() {
    const balances = {};
    members.forEach(m => balances[m] = 0);

    expenses.forEach(exp => {
        const share = exp.amount / exp.participants.length;
        balances[exp.payer] += exp.amount;
        exp.participants.forEach(p => {
            if (balances.hasOwnProperty(p)) {
                balances[p] -= share;
            }
        });
    });
    return balances;
}

function solveSettlements(balances) {
    let debtors = [];
    let creditors = [];

    Object.keys(balances).forEach(name => {
        if (balances[name] < -0.01) debtors.push({ name, amount: Math.abs(balances[name]) });
        else if (balances[name] > 0.01) creditors.push({ name, amount: balances[name] });
    });

    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const payAmount = Math.min(debtors[i].amount, creditors[j].amount);
        settlements.push(`${debtors[i].name} pays <strong>$${payAmount.toFixed(2)}</strong> to ${creditors[j].name}`);

        debtors[i].amount -= payAmount;
        creditors[j].amount -= payAmount;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }
    return settlements;
}


function updateUI() {
    
    memberlist.innerHTML = members.map(m => `
      <br>  <span class="tag">${m} <span onclick="deleteMember('${m}')" style="cursor:pointer; color:red; margin-left:5px;">&times;</span></span>
    `).join('');

    
    select.innerHTML = members.map(m => `<option value="${m}">${m}</option>`).join('');

    
    subscribe.innerHTML = members.map(m => `
        <label style="display:block; margin: 5px 0;">
            <input type="checkbox" class="participant-checkbox" value="${m}" checked> ${m}
        </label>
    `).join('');

    const balances = calculateBalances();
    displaySummary(balances);
    
    const settlements = solveSettlements(balances);
    settlementlist.innerHTML = settlements.length > 0 
        ? settlements.map(s => `<li>${s}</li>`).join('')
        : "<li>All settled up!</li>";
}

function displaySummary(balances) {
    let html = `<table border="1" style="width:100%; text-align:left; border-collapse: collapse;">
                <thead><tr><th>Member</th><th>Net Balance</th></tr></thead><tbody>`;
    for (let name in balances) {
        const bal = balances[name];
        const color = bal >= 0 ? 'green' : 'red';
        html += `<tr>
                    <td style="padding:8px;">${name}</td>
                    <td style="padding:8px; color:${color}; font-weight:bold">
                        ${bal >= 0 ? '+' : ''}$${bal.toFixed(2)}
                    </td>
                 </tr>`;
    }
    html += `</tbody></table>`;
    summarytable.innerHTML = html;
}


function saveandrefresh() {
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateUI();
}


document.getElementById('reset').addEventListener('click', () => {
    if(confirm("Are you sure? This will delete everything.")) {
        localStorage.clear();
        location.reload();
    }
});