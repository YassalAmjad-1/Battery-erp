const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage (in-memory)
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
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
        .btn-blue { background: #3b82f6; color: white; }
        .btn-green { background: #10b981; color: white; }
        .card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .nav-btn { padding: 8px 16px; background: #e2e8f0; border-radius: 8px; cursor: pointer; }
        .nav-btn.active { background: #1e293b; color: white; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 6px; }
        .progress-fill { background: #10b981; height: 100%; border-radius: 10px; transition: width 0.3s; }
    </style>
</head>
<body class="bg-gray-100">
<div id="app" class="max-w-6xl mx-auto p-4"></div>
<script>
    let productionData = [], dailySchedule = { tx1800: 55, tx2500: 42 }, currentTab = 'dashboard';
    
    async function load() {
        const res = await fetch('/api/data');
        const data = await res.json();
        productionData = data.productionData || [];
        dailySchedule = data.dailySchedule || { tx1800: 55, tx2500: 42 };
        render();
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
    
    function getCumulative(dept) {
        const today = getToday();
        return productionData.filter(e => e.date === today && e.department === dept).reduce((s,e)=>s+(e.actualQty||0),0);
    }
    
    function renderDashboard() {
        const depts = ['Ball Milling', 'Tubular Grid', 'COS', 'Assembly', 'Packing'];
        let html = '<h1 class="text-2xl font-bold mb-4">📊 Dashboard</h1><div class="grid grid-cols-2 gap-4 mb-4"><div class="bg-white p-4 rounded-lg"><div class="text-gray-500">TX-1800</div><input id="s1800" value="'+dailySchedule.tx1800+'" class="border rounded p-2 w-full"><div class="text-gray-500 mt-2">TX-2500</div><input id="s2500" value="'+dailySchedule.tx2500+'" class="border rounded p-2 w-full"><button onclick="saveSchedule()" class="btn btn-blue mt-3 w-full">Update Schedule</button></div><div class="bg-white p-4 rounded-lg"><div class="text-gray-500">Today\'s Total</div><div class="text-3xl font-bold">'+productionData.filter(e=>e.date===getToday()).reduce((s,e)=>s+(e.actualQty||0),0)+'</div></div></div><div class="space-y-2">';
        for(let d of depts) {
            const target = d==='Ball Milling' ? (dailySchedule.tx1800*12.174+dailySchedule.tx2500*17.106) : 100;
            const actual = getCumulative(d);
            const pct = target>0 ? (actual/target)*100 : 0;
            html += '<div class="card"><div class="flex justify-between"><strong>'+d+'</strong><span>'+Math.round(actual)+' / '+Math.round(target)+'</span></div><div class="progress-bar mt-2"><div class="progress-fill" style="width: '+Math.min(100,pct)+'%"></div></div></div>';
        }
        return html+'</div>';
    }
    
    function renderProduction() {
        return '<h1 class="text-2xl font-bold mb-4">🏭 Production Entry</h1><div class="card"><div class="grid grid-cols-2 gap-3 mb-3"><div><label>Department</label><select id="dept" class="w-full border rounded p-2"><option>Ball Milling</option><option>Tubular Grid</option><option>COS</option><option>Assembly</option><option>Packing</option></select></div><div><label>Shift</label><select id="shift" class="w-full border rounded p-2"><option>Shift A</option><option>Shift B</option></select></div><div><label>Hour</label><select id="hour" class="w-full border rounded p-2">'+[6,8,10,12,14,16,18,20].map(h=>'<option>'+h+':00</option>').join('')+'</select></div><div><label>Status</label><select id="status" class="w-full border rounded p-2"><option>Running</option><option>Downtime</option></select></div></div><div><label>Actual Production</label><input type="number" id="actual" class="w-full border rounded p-2" placeholder="Enter quantity"></div><button onclick="submitEntry()" class="btn btn-green w-full mt-4 py-3">✅ Submit</button></div><div class="card"><h3 class="font-bold">Recent Entries</h3><div id="recentList"></div></div>';
    }
    
    window.submitEntry = async () => {
        const dept = document.getElementById('dept').value;
        const shift = document.getElementById('shift').value;
        const hour = parseInt(document.getElementById('hour').value);
        const actual = parseInt(document.getElementById('actual').value);
        const status = document.getElementById('status').value;
        if(!actual) { alert('Enter quantity'); return; }
        await saveEntry({ department: dept, shift, hourSlot: hour, actualQty: actual, machineStatus: status, date: getToday() });
        document.getElementById('actual').value = '';
        render();
    };
    
    function renderAnalytics() {
        const total = productionData.reduce((s,e)=>s+(e.actualQty||0),0);
        const today = productionData.filter(e=>e.date===getToday()).reduce((s,e)=>s+(e.actualQty||0),0);
        return '<h1 class="text-2xl font-bold mb-4">📈 Analytics</h1><div class="grid grid-cols-2 gap-4 mb-4"><div class="card text-center"><div class="text-gray-500">Total Production</div><div class="text-3xl font-bold">'+Math.round(total/1000)+'k</div></div><div class="card text-center"><div class="text-gray-500">Today\'s Production</div><div class="text-3xl font-bold">'+today+'</div></div></div><div class="card"><h3 class="font-bold">Recent Records</h3><div id="historyList"></div></div>';
    }
    
    function renderInventory() {
        return '<h1 class="text-2xl font-bold mb-4">📦 Inventory</h1><div class="card"><p>Inventory tracking coming soon.</p></div>';
    }
    
    function renderHistory() {
        let html = '<h1 class="text-2xl font-bold mb-4">📋 History</h1><div class="card overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b"><th class="text-left p-2">Date</th><th class="text-left p-2">Hour</th><th class="text-left p-2">Dept</th><th class="text-right p-2">Qty</th></tr></thead><tbody>';
        for(let e of productionData.slice(0,30)) {
            html += '<tr class="border-b"><td class="p-2">'+e.date+'</td><td class="p-2">'+e.hourSlot+':00</td><td class="p-2">'+e.department+'</td><td class="p-2 text-right">'+e.actualQty+'</td></tr>';
        }
        return html+'</tbody></table></div>';
    }
    
    function renderMaintenance() {
        return '<h1 class="text-2xl font-bold mb-4">🔧 Maintenance</h1><div class="card"><p>Maintenance tracking coming soon.</p></div>';
    }
    
    function setTab(tab) {
        currentTab = tab;
        render();
        if(tab==='production') setTimeout(()=>{
            const recentDiv = document.getElementById('recentList');
            if(recentDiv) recentDiv.innerHTML = productionData.filter(e=>e.date===getToday()).slice(0,5).map(e=>'<div class="border-b py-2">'+e.hourSlot+':00 - '+e.department+' - '+e.actualQty+' units</div>').join('');
        },100);
        if(tab==='analytics') setTimeout(()=>{
            const histDiv = document.getElementById('historyList');
            if(histDiv) histDiv.innerHTML = productionData.slice(0,10).map(e=>'<div class="border-b py-2">'+e.date+' - '+e.department+' - '+e.actualQty+' units</div>').join('');
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
        
        document.getElementById('app').innerHTML = \`
            <div class="flex gap-2 mb-4 flex-wrap">
                <button class="nav-btn \${currentTab==='dashboard'?'active':''}" onclick="setTab('dashboard')">📊 Dashboard</button>
                <button class="nav-btn \${currentTab==='production'?'active':''}" onclick="setTab('production')">🏭 Production</button>
                <button class="nav-btn \${currentTab==='analytics'?'active':''}" onclick="setTab('analytics')">📈 Analytics</button>
                <button class="nav-btn \${currentTab==='inventory'?'active':''}" onclick="setTab('inventory')">📦 Inventory</button>
                <button class="nav-btn \${currentTab==='history'?'active':''}" onclick="setTab('history')">📋 History</button>
                <button class="nav-btn \${currentTab==='maintenance'?'active':''}" onclick="setTab('maintenance')">🔧 Maintenance</button>
            </div>
            \${content}
            <div class="text-center text-gray-400 text-xs mt-8 pt-4 border-t">☁️ Cloud ERP | Data Shared</div>
        \`;
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