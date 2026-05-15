const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage
let productionData = [];
let dailySchedule = { tx1800: 55, tx2500: 42 };
let inventoryData = { redOxide: 3000, refineLead: 10000 };

// API Routes
app.get('/api/data', (req, res) => {
    res.json({ productionData, dailySchedule, inventoryData });
});

app.post('/api/entry', (req, res) => {
    const entry = req.body;
    entry.id = Date.now().toString();
    entry.date = entry.date || new Date().toISOString().split('T')[0];
    productionData.unshift(entry);
    res.json({ success: true });
});

app.post('/api/schedule', (req, res) => {
    dailySchedule = req.body;
    res.json({ success: true });
});

// Frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TX Battery ERP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #f1f5f9; font-family: Arial; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
        .btn-blue { background: #3b82f6; color: white; }
        .btn-green { background: #10b981; color: white; }
        .nav-btn { padding: 10px 20px; background: #e2e8f0; border: none; border-radius: 8px; margin: 4px; cursor: pointer; }
        .active { background: #1e293b; color: white; }
        input, select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; width: 100%; margin: 5px 0; }
        .flex { display: flex; gap: 10px; flex-wrap: wrap; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 8px; }
        .progress-fill { background: #10b981; height: 100%; border-radius: 10px; width: 0%; }
    </style>
</head>
<body>
<div id="app" style="max-width: 1200px; margin: 0 auto;"></div>

<script>
    let productionData = [], dailySchedule = { tx1800: 55, tx2500: 42 }, currentTab = 'dashboard';
    
    async function load() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            productionData = data.productionData || [];
            dailySchedule = data.dailySchedule || { tx1800: 55, tx2500: 42 };
            render();
        } catch(e) { console.log('Error:', e); }
    }
    
    async function saveEntry(entry) {
        await fetch('/api/entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        load();
    }
    
    async function saveSchedule() {
        const tx1800 = parseInt(document.getElementById('s1800').value) || 0;
        const tx2500 = parseInt(document.getElementById('s2500').value) || 0;
        await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx1800, tx2500 }) });
        load();
    }
    
    function getToday() { return new Date().toISOString().split('T')[0]; }
    
    function renderDashboard() {
        const departments = ['Ball Milling', 'Tubular Grid', 'COS', 'Assembly', 'Packing'];
        const todayTotal = productionData.filter(e => e.date === getToday()).reduce((s,e)=>s+(e.actualQty||0),0);
        let html = '<h1>📊 Dashboard</h1><div class="card"><div class="flex"><div style="flex:1"><label>TX-1800</label><input id="s1800" value="'+dailySchedule.tx1800+'"></div><div style="flex:1"><label>TX-2500</label><input id="s2500" value="'+dailySchedule.tx2500+'"></div><div><button class="btn btn-blue" onclick="saveSchedule()" style="margin-top:22px">Update</button></div></div></div><div class="card"><h3>Today\'s Total: '+todayTotal+'</h3></div>';
        for(let d of departments) {
            const target = d==='Ball Milling' ? (dailySchedule.tx1800*12.174+dailySchedule.tx2500*17.106) : 100;
            const actual = productionData.filter(e=>e.date===getToday() && e.department===d).reduce((s,e)=>s+(e.actualQty||0),0);
            const pct = target>0 ? (actual/target)*100 : 0;
            html += '<div class="card"><div class="flex"><strong>'+d+'</strong><span>'+Math.round(actual)+' / '+Math.round(target)+'</span></div><div class="progress-bar mt-2"><div class="progress-fill" style="width:'+Math.min(100,pct)+'%"></div></div></div>';
        }
        return html;
    }
    
    function renderProduction() {
        return '<h1>🏭 Production Entry</h1><div class="card"><div class="flex"><select id="dept" style="flex:1"><option>Ball Milling</option><option>Tubular Grid</option><option>COS</option><option>Assembly</option><option>Packing</option></select><select id="shift" style="flex:1"><option>Shift A</option><option>Shift B</option></select><select id="hour" style="flex:1">'+[6,8,10,12,14,16,18,20].map(h=>'<option>'+h+':00</option>').join('')+'</select></div><div><input type="number" id="actual" placeholder="Actual Production"></div><button class="btn btn-green" onclick="submitEntry()" style="margin-top:10px; width:100%">Submit</button></div><div class="card"><h3>Recent Entries</h3><div id="recentList"></div></div>';
    }
    
    window.submitEntry = async () => {
        const dept = document.getElementById('dept').value;
        const shift = document.getElementById('shift').value;
        const hour = parseInt(document.getElementById('hour').value);
        const actual = parseInt(document.getElementById('actual').value);
        if(!actual) { alert('Enter quantity'); return; }
        await saveEntry({ department: dept, shift: shift, hourSlot: hour, actualQty: actual, date: getToday() });
        document.getElementById('actual').value = '';
        render();
    };
    
    function renderAnalytics() {
        const total = productionData.reduce((s,e)=>s+(e.actualQty||0),0);
        return '<h1>📈 Analytics</h1><div class="card"><h3>Total Production: '+Math.round(total/1000)+'k</h3><h3>Total Records: '+productionData.length+'</h3></div><div class="card"><h3>Recent Records</h3><div id="recentRecords"></div></div>';
    }
    
    function renderInventory() { return '<h1>📦 Inventory</h1><div class="card"><p>Inventory Management Active</p></div>'; }
    function renderHistory() { return '<h1>📋 History</h1><div class="card"><div id="historyTable"></div></div>'; }
    function renderMaintenance() { return '<h1>🔧 Maintenance</h1><div class="card"><p>Maintenance Tracker Active</p></div>'; }
    
    function setTab(tab) {
        currentTab = tab;
        render();
        if(tab==='production') setTimeout(()=>{
            const recentDiv = document.getElementById('recentList');
            if(recentDiv) recentDiv.innerHTML = productionData.filter(e=>e.date===getToday()).slice(0,5).map(e=>'<div>'+e.hourSlot+':00 - '+e.department+' - '+e.actualQty+'</div>').join('');
        },100);
        if(tab==='analytics') setTimeout(()=>{
            const recentDiv = document.getElementById('recentRecords');
            if(recentDiv) recentDiv.innerHTML = productionData.slice(0,10).map(e=>'<div>'+e.date+' - '+e.department+' - '+e.actualQty+'</div>').join('');
        },100);
        if(tab==='history') setTimeout(()=>{
            const histDiv = document.getElementById('historyTable');
            if(histDiv) histDiv.innerHTML = '<table border="1" cellpadding="8"><tr><th>Date</th><th>Hour</th><th>Dept</th><th>Qty</th></tr>'+productionData.slice(0,20).map(e=>'<tr><td>'+e.date+'</td><td>'+e.hourSlot+':00</td><td>'+e.department+'</td><td>'+e.actualQty+'</td></tr>').join('')+'</table>';
        },100);
    }
    
    function render() {
        let content = '';
        if(currentTab==='dashboard') content = renderDashboard();
        else if(currentTab==='production') content = renderProduction();
        else if(currentTab==='analytics') content = renderAnalytics();
        else if(currentTab==='inventory') content = renderInventory();
        else if(currentTab==='history') content = renderHistory();
        else if(currentTab==='maintenance') content = renderMaintenance();
        
        document.getElementById('app').innerHTML = '<div class="flex"><button class="nav-btn" onclick="setTab(\'dashboard\')">📊 Dashboard</button><button class="nav-btn" onclick="setTab(\'production\')">🏭 Production</button><button class="nav-btn" onclick="setTab(\'analytics\')">📈 Analytics</button><button class="nav-btn" onclick="setTab(\'inventory\')">📦 Inventory</button><button class="nav-btn" onclick="setTab(\'history\')">📋 History</button><button class="nav-btn" onclick="setTab(\'maintenance\')">🔧 Maintenance</button></div>' + content + '<div style="text-align:center; margin-top:20px; font-size:12px; color:gray;">☁️ TX Battery ERP | Cloud Live</div>';
    }
    
    window.setTab = setTab;
    window.saveSchedule = saveSchedule;
    load();
</script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
