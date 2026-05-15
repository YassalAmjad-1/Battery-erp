const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage
let productionData = [];
let dailySchedule = { tx1800: 55, tx2500: 42 };

// API Routes
app.get('/api/data', (req, res) => {
    res.json({ productionData, dailySchedule });
});

app.post('/api/entry', (req, res) => {
    const entry = req.body;
    entry.id = Date.now().toString();
    entry.date = entry.date || new Date().toISOString().split('T')[0];
    productionData.unshift(entry);
    res.json({ success: true, message: 'Entry saved!' });
});

app.post('/api/schedule', (req, res) => {
    dailySchedule = req.body;
    res.json({ success: true, message: 'Schedule updated!' });
});

// Frontend - Complete HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TX Battery Manufacturing ERP</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f0f2f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .nav { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .nav-btn { padding: 10px 20px; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .nav-btn.active { background: #1e293b; color: white; }
        .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-blue { background: #3b82f6; color: white; }
        .btn-green { background: #10b981; color: white; }
        input, select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; width: 100%; margin: 5px 0; }
        .flex { display: flex; gap: 15px; flex-wrap: wrap; }
        .flex > div { flex: 1; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 8px; margin-top: 8px; }
        .progress-fill { background: #10b981; height: 100%; border-radius: 10px; transition: width 0.3s; }
        .kpi { background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border-radius: 12px; padding: 15px; text-align: center; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        @media (max-width: 768px) { .flex { flex-direction: column; } body { padding: 10px; } .nav-btn { padding: 6px 12px; font-size: 12px; } }
    </style>
</head>
<body>
<div class="container" id="app"></div>

<script>
    let productionData = [], dailySchedule = { tx1800: 55, tx2500: 42 }, currentTab = 'dashboard';
    
    async function loadData() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            productionData = data.productionData || [];
            dailySchedule = data.dailySchedule || { tx1800: 55, tx2500: 42 };
            render();
        } catch(e) { console.error('Error:', e); }
    }
    
    async function saveEntry(entry) {
        await fetch('/api/entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        loadData();
    }
    
    async function updateSchedule() {
        const tx1800 = parseInt(document.getElementById('s1800').value) || 0;
        const tx2500 = parseInt(document.getElementById('s2500').value) || 0;
        await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx1800, tx2500 }) });
        loadData();
    }
    
    function getToday() { return new Date().toISOString().split('T')[0]; }
    
    function renderDashboard() {
        const departments = ['Ball Milling', 'Tubular Grid', 'COS', 'Assembly', 'Packing'];
        const todayTotal = productionData.filter(e => e.date === getToday()).reduce((s,e)=>s+(e.actualQty||0),0);
        const allTimeTotal = productionData.reduce((s,e)=>s+(e.actualQty||0),0);
        
        let html = \`
            <h1>📊 Dashboard</h1>
            <div class="flex">
                <div class="kpi"><div style="font-size:12px">Today's Production</div><div style="font-size:28px; font-weight:bold">\${todayTotal}</div></div>
                <div class="kpi"><div style="font-size:12px">Total Production</div><div style="font-size:28px; font-weight:bold">\${Math.round(allTimeTotal/1000)}k</div></div>
                <div class="kpi"><div style="font-size:12px">Records</div><div style="font-size:28px; font-weight:bold">\${productionData.length}</div></div>
            </div>
            <div class="card">
                <h3>📅 Daily Schedule</h3>
                <div class="flex">
                    <div><label>TX-1800 Batteries</label><input type="number" id="s1800" value="\${dailySchedule.tx1800}"></div>
                    <div><label>TX-2500 Batteries</label><input type="number" id="s2500" value="\${dailySchedule.tx2500}"></div>
                    <div><button class="btn btn-blue" onclick="updateSchedule()" style="margin-top:22px">Update Schedule</button></div>
                </div>
            </div>
            <h3>📊 Department Progress (Today)</h3>
        \`;
        
        for(let dept of departments) {
            const target = dept === 'Ball Milling' ? (dailySchedule.tx1800 * 12.174 + dailySchedule.tx2500 * 17.106) : 100;
            const actual = productionData.filter(e => e.date === getToday() && e.department === dept).reduce((s,e)=>s+(e.actualQty||0),0);
            const percent = target > 0 ? (actual / target) * 100 : 0;
            const color = percent >= 90 ? '#10b981' : (percent >= 75 ? '#f59e0b' : '#ef4444');
            html += \`
                <div class="card">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>\${dept}</strong>
                        <span>\${Math.round(actual)} / \${Math.round(target)}</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: \${Math.min(100, percent)}%; background: \${color};"></div></div>
                </div>
            \`;
        }
        return html;
    }
    
    function renderProduction() {
        return \`
            <h1>🏭 Production Entry</h1>
            <div class="card">
                <div class="flex">
                    <div><label>Department</label><select id="dept" class="w-full"><option>Ball Milling</option><option>Tubular Grid</option><option>COS</option><option>Assembly</option><option>Packing</option></select></div>
                    <div><label>Shift</label><select id="shift" class="w-full"><option>Shift A</option><option>Shift B</option></select></div>
                    <div><label>Hour</label><select id="hour" class="w-full">\${[6,8,10,12,14,16,18,20].map(h=>'<option>'+h+':00</option>').join('')}</select></div>
                </div>
                <div><label>Actual Production</label><input type="number" id="actual" placeholder="Enter quantity produced"></div>
                <button class="btn btn-green" onclick="submitEntry()" style="margin-top:15px; width:100%">✅ Submit Entry</button>
            </div>
            <div class="card">
                <h3>📋 Recent Entries (Today)</h3>
                <div id="recentEntries"></div>
            </div>
        \`;
    }
    
    window.submitEntry = async function() {
        const dept = document.getElementById('dept').value;
        const shift = document.getElementById('shift').value;
        const hour = parseInt(document.getElementById('hour').value);
        const actual = parseInt(document.getElementById('actual').value);
        if(!actual) { alert('Please enter quantity'); return; }
        await saveEntry({ department: dept, shift: shift, hourSlot: hour, actualQty: actual, machineStatus: 'Running', date: getToday() });
        document.getElementById('actual').value = '';
        loadData();
    };
    
    function renderAnalytics() {
        const total = productionData.reduce((s,e)=>s+(e.actualQty||0),0);
        return \`
            <h1>📈 Analytics</h1>
            <div class="card"><h3>Total Production: \${Math.round(total/1000)}k units</h3><h3>Total Records: \${productionData.length}</h3></div>
            <div class="card"><h3>Recent Records</h3><div id="recentRecords"></div></div>
        \`;
    }
    
    function renderInventory() { return '<h1>📦 Inventory Management</h1><div class="card"><p>Coming soon...</p></div>'; }
    function renderHistory() { return '<h1>📋 Production History</h1><div class="card"><div id="historyTable"></div></div>'; }
    function renderMaintenance() { return '<h1>🔧 Maintenance Tracker</h1><div class="card"><p>Coming soon...</p></div>'; }
    
    function setTab(tab) {
        currentTab = tab;
        render();
        if(tab === 'production') {
            setTimeout(() => {
                const recentDiv = document.getElementById('recentEntries');
                if(recentDiv) {
                    const todayEntries = productionData.filter(e => e.date === getToday()).slice(0,10);
                    recentDiv.innerHTML = todayEntries.map(e => '<div style="border-bottom:1px solid #ddd; padding:8px">' + e.hourSlot + ':00 - ' + e.department + ' - ' + e.actualQty + ' units</div>').join('');
                    if(todayEntries.length === 0) recentDiv.innerHTML = '<div style="padding:8px">No entries yet today</div>';
                }
            }, 50);
        }
        if(tab === 'analytics') {
            setTimeout(() => {
                const recentDiv = document.getElementById('recentRecords');
                if(recentDiv) {
                    recentDiv.innerHTML = productionData.slice(0,15).map(e => '<div style="border-bottom:1px solid #ddd; padding:8px">' + e.date + ' - ' + e.department + ' - ' + e.actualQty + ' units</div>').join('');
                }
            }, 50);
        }
        if(tab === 'history') {
            setTimeout(() => {
                const histDiv = document.getElementById('historyTable');
                if(histDiv) {
                    let html = '<table><tr><th>Date</th><th>Hour</th><th>Department</th><th>Shift</th><th>Quantity</th></tr>';
                    html += productionData.slice(0,30).map(e => '<tr><td>' + e.date + '</td><td>' + e.hourSlot + ':00</td><td>' + e.department + '</td><td>' + e.shift + '</td><td>' + e.actualQty + '</td></tr>').join('');
                    html += '</table>';
                    histDiv.innerHTML = html;
                }
            }, 50);
        }
    }
    
    function render() {
        let content = '';
        if(currentTab === 'dashboard') content = renderDashboard();
        else if(currentTab === 'production') content = renderProduction();
        else if(currentTab === 'analytics') content = renderAnalytics();
        else if(currentTab === 'inventory') content = renderInventory();
        else if(currentTab === 'history') content = renderHistory();
        else if(currentTab === 'maintenance') content = renderMaintenance();
        
        document.getElementById('app').innerHTML = \`
            <div class="nav">
                <button class="nav-btn \${currentTab === 'dashboard' ? 'active' : ''}" onclick="setTab('dashboard')">📊 Dashboard</button>
                <button class="nav-btn \${currentTab === 'production' ? 'active' : ''}" onclick="setTab('production')">🏭 Production</button>
                <button class="nav-btn \${currentTab === 'analytics' ? 'active' : ''}" onclick="setTab('analytics')">📈 Analytics</button>
                <button class="nav-btn \${currentTab === 'inventory' ? 'active' : ''}" onclick="setTab('inventory')">📦 Inventory</button>
                <button class="nav-btn \${currentTab === 'history' ? 'active' : ''}" onclick="setTab('history')">📋 History</button>
                <button class="nav-btn \${currentTab === 'maintenance' ? 'active' : ''}" onclick="setTab('maintenance')">🔧 Maintenance</button>
            </div>
            \${content}
            <div style="text-align: center; margin-top: 30px; padding: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
                ☁️ TX Battery Manufacturing ERP | Cloud Hosted | Data Shared Across All Devices
            </div>
        \`;
    }
    
    window.updateSchedule = updateSchedule;
    window.setTab = setTab;
    loadData();
</script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
