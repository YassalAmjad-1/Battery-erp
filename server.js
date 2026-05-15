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
        .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
        .btn-blue { background: #3b82f6; color: white; }
        .btn-green { background: #10b981; color: white; }
        .nav-btn { padding: 10px 20px; background: #e2e8f0; border: none; border-radius: 8px; margin: 4px; cursor: pointer; }
        .active { background: #1e293b; color: white; }
        input, select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; width: 100%; margin: 5px 0; }
        .flex { display: flex; gap: 10px; flex-wrap: wrap; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 8px; }
        .progress-fill { background: #10b981; height: 100%; border-radius: 10px; width: 0%; transition: width 0.3s; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
<div id="app" style="max-width: 1200px; margin: 0 auto;"></div>

<script>
    let productionData = [];
    let dailySchedule = { tx1800: 55, tx2500: 42 };
    let currentTab = 'dashboard';
    let currentPage = 1;
    
    async function loadData() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            productionData = data.productionData || [];
            dailySchedule = data.dailySchedule || { tx1800: 55, tx2500: 42 };
            render();
        } catch(e) { console.log('Error:', e); setTimeout(loadData, 2000); }
    }
    
    async function saveEntry(entry) {
        await fetch('/api/entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        loadData();
    }
    
    async function saveSchedule() {
        const tx1800 = parseInt(document.getElementById('s1800').value) || 0;
        const tx2500 = parseInt(document.getElementById('s2500').value) || 0;
        await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx1800, tx2500 }) });
        loadData();
    }
    
    function getToday() { return new Date().toISOString().split('T')[0]; }
    
    function renderDashboard() {
        const departments = ['Ball Milling', 'Tubular Grid', 'Oxide Filling', 'Grid Casting', 'Pasting', 'Acid Pickling', 'Curing Chamber', 'Cutting & Brushing', 'COS', 'Group Insertion', 'Assembly', 'Tubular Charging', 'Molding', 'Acid Dilution', 'Packing'];
        const todayTotal = productionData.filter(e => e.date === getToday()).reduce((s,e)=>s+(e.actualQty||0),0);
        let html = '<h1 class="text-2xl font-bold mb-4">📊 Dashboard</h1><div class="card"><div class="flex"><div style="flex:1"><label>TX-1800 Batteries</label><input id="s1800" value="'+dailySchedule.tx1800+'" class="border rounded p-2"></div><div style="flex:1"><label>TX-2500 Batteries</label><input id="s2500" value="'+dailySchedule.tx2500+'" class="border rounded p-2"></div><div><button class="btn btn-blue" onclick="saveSchedule()" style="margin-top:22px">Update Schedule</button></div></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><div class="card text-center"><div class="text-gray-500">Today\'s Production</div><div class="text-2xl font-bold">'+todayTotal+'</div></div><div class="card text-center"><div class="text-gray-500">Total Records</div><div class="text-2xl font-bold">'+productionData.length+'</div></div><div class="card text-center"><div class="text-gray-500">TX-1800 Plan</div><div class="text-2xl font-bold">'+dailySchedule.tx1800+'</div></div><div class="card text-center"><div class="text-gray-500">TX-2500 Plan</div><div class="text-2xl font-bold">'+dailySchedule.tx2500+'</div></div></div><h2 class="font-bold text-lg mb-3">📊 Department Progress (Today)</h2>';
        for(let d of departments) {
            let target = 100;
            if(d === 'Ball Milling') target = (dailySchedule.tx1800 * 12.174) + (dailySchedule.tx2500 * 17.106);
            if(d === 'Tubular Grid' || d === 'Oxide Filling' || d === 'Acid Pickling') target = (dailySchedule.tx1800 * 12) + (dailySchedule.tx2500 * 18);
            if(d === 'Grid Casting' || d === 'Pasting') target = (dailySchedule.tx1800 * 18) + (dailySchedule.tx2500 * 24);
            if(d === 'COS' || d === 'Group Insertion' || d === 'Assembly' || d === 'Tubular Charging' || d === 'Packing') target = dailySchedule.tx1800 + dailySchedule.tx2500;
            const actual = productionData.filter(e=>e.date===getToday() && e.department===d).reduce((s,e)=>s+(e.actualQty||0),0);
            const percent = target > 0 ? (actual / target) * 100 : 0;
            const color = percent >= 90 ? '#10b981' : (percent >= 75 ? '#f59e0b' : '#ef4444');
            html += '<div class="card"><div class="flex justify-between"><strong>'+d+'</strong><span>'+Math.round(actual)+' / '+Math.round(target)+'</span></div><div class="progress-bar mt-2"><div class="progress-fill" style="width:'+Math.min(100,percent)+'%; background:'+color+';"></div></div></div>';
        }
        return html;
    }
    
    function renderProduction() {
        const departments = ['Ball Milling', 'Tubular Grid', 'Oxide Filling', 'Grid Casting', 'Pasting', 'Acid Pickling', 'Curing Chamber', 'Cutting & Brushing', 'COS', 'Group Insertion', 'Assembly', 'Tubular Charging', 'Molding', 'Acid Dilution', 'Packing'];
        return '<h1 class="text-2xl font-bold mb-4">🏭 Production Entry</h1><div class="card"><div class="flex"><div style="flex:1"><label>Department</label><select id="dept" class="w-full border rounded p-2">'+departments.map(d=>'<option>'+d+'</option>').join('')+'</select></div><div style="flex:1"><label>Shift</label><select id="shift" class="w-full border rounded p-2"><option>Shift A</option><option>Shift B</option></select></div><div style="flex:1"><label>Hour</label><select id="hour" class="w-full border rounded p-2">'+[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(h=>'<option>'+h+':00</option>').join('')+'</select></div><div style="flex:1"><label>Machine Status</label><select id="status" class="w-full border rounded p-2"><option>Running</option><option>Downtime</option></select></div></div><div class="mt-3"><label>Actual Production</label><input type="number" id="actual" class="w-full border rounded p-2" placeholder="Enter quantity produced"></div><button class="btn btn-green w-full mt-4 py-3" onclick="submitEntry()">✅ Submit Entry</button></div><div class="card"><h3 class="font-bold mb-2">📋 Recent Entries (Today)</h3><div id="recentEntries"></div></div>';
    }
    
    window.submitEntry = async function() {
        const dept = document.getElementById('dept').value;
        const shift = document.getElementById('shift').value;
        const hour = parseInt(document.getElementById('hour').value);
        const actual = parseInt(document.getElementById('actual').value);
        const status = document.getElementById('status').value;
        if(!actual) { alert('Please enter quantity'); return; }
        await saveEntry({ department: dept, shift: shift, hourSlot: hour, actualQty: actual, machineStatus: status, date: getToday() });
        document.getElementById('actual').value = '';
        render();
    };
    
    function renderAnalytics() {
        const totalProduction = productionData.reduce((s,e)=>s+(e.actualQty||0),0);
        const todayProduction = productionData.filter(e=>e.date===getToday()).reduce((s,e)=>s+(e.actualQty||0),0);
        return '<h1 class="text-2xl font-bold mb-4">📈 Analytics</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div class="card text-center"><div class="text-gray-500">Total Production</div><div class="text-3xl font-bold text-blue-600">'+Math.round(totalProduction/1000)+'k</div></div><div class="card text-center"><div class="text-gray-500">Today\'s Production</div><div class="text-3xl font-bold text-green-600">'+todayProduction+'</div></div><div class="card text-center"><div class="text-gray-500">Total Records</div><div class="text-3xl font-bold">'+productionData.length+'</div></div></div><div class="card"><h3 class="font-bold mb-2">📊 Department-wise Production</h3><div id="deptStats"></div></div>';
    }
    
    function renderInventory() {
        return '<h1 class="text-2xl font-bold mb-4">📦 Inventory Management</h1><div class="card"><p class="text-gray-600">Inventory tracking system active. Stock levels are maintained in cloud database.</p><div class="mt-4"><h3 class="font-bold">Current Stock Levels</h3><div id="inventoryList" class="mt-2"></div></div></div>';
    }
    
    function renderHistory() {
        const itemsPerPage = 10;
        const start = (currentPage - 1) * itemsPerPage;
        const paginated = productionData.slice(start, start + itemsPerPage);
        const totalPages = Math.ceil(productionData.length / itemsPerPage);
        let rows = '';
        for(let e of paginated) {
            rows += '<tr class="border-b"><td class="p-2">'+e.date+'</td><td class="p-2">'+e.hourSlot+':00</td><td class="p-2">'+e.department+'</td><td class="p-2">'+e.shift+'</td><td class="p-2 text-right">'+e.actualQty+'</td><td class="p-2"><span class="px-2 py-1 rounded-full text-xs '+(e.machineStatus==='Running'?'bg-green-100 text-green-700':'bg-red-100 text-red-700')+'">'+e.machineStatus+'</span></td></tr>';
        }
        return '<h1 class="text-2xl font-bold mb-4">📋 Production History</h1><div class="card overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b"><th class="text-left p-2">Date</th><th class="text-left p-2">Hour</th><th class="text-left p-2">Dept</th><th class="text-left p-2">Shift</th><th class="text-right p-2">Qty</th><th class="text-left p-2">Status</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="flex justify-between mt-4"><button onclick="changePage(-1)" class="px-4 py-2 border rounded">Previous</button><span>Page '+currentPage+' of '+totalPages+'</span><button onclick="changePage(1)" class="px-4 py-2 border rounded">Next</button></div>';
    }
    
    function renderMaintenance() {
        return '<h1 class="text-2xl font-bold mb-4">🔧 Maintenance Tracker</h1><div class="card"><p>Equipment maintenance tracking system.</p><button class="btn btn-blue mt-4" onclick="alert(\'Maintenance logged\')">🔧 Log Maintenance</button></div>';
    }
    
    function changePage(delta) {
        const newPage = currentPage + delta;
        if(newPage >= 1 && newPage <= Math.ceil(productionData.length / 10)) {
            currentPage = newPage;
            render();
        }
    }
    
    function setTab(tab) {
        currentTab = tab;
        render();
        if(tab === 'production') {
            setTimeout(() => {
                const recentDiv = document.getElementById('recentEntries');
                if(recentDiv) {
                    const todayEntries = productionData.filter(e => e.date === getToday()).slice(0,10);
                    recentDiv.innerHTML = todayEntries.map(e => '<div class="border-b py-2">'+e.hourSlot+':00 - '+e.department+' - '+e.actualQty+' units</div>').join('');
                    if(todayEntries.length === 0) recentDiv.innerHTML = '<div class="py-2 text-gray-500">No entries yet today</div>';
                }
            }, 50);
        }
        if(tab === 'analytics') {
            setTimeout(() => {
                const deptDiv = document.getElementById('deptStats');
                if(deptDiv) {
                    const deptMap = new Map();
                    for(let e of productionData) {
                        const total = deptMap.get(e.department) || 0;
                        deptMap.set(e.department, total + (e.actualQty||0));
                    }
                    let html = '<div class="space-y-2">';
                    for(let [dept, total] of deptMap) {
                        html += '<div class="flex justify-between"><span>'+dept+'</span><span class="font-bold">'+total.toLocaleString()+' units</span></div>';
                    }
                    html += '</div>';
                    deptDiv.innerHTML = html;
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
        
        document.getElementById('app').innerHTML = '<div class="flex gap-2 mb-4 flex-wrap"><button class="nav-btn '+(currentTab==='dashboard'?'active':'')+'" onclick="setTab(\'dashboard\')">📊 Dashboard</button><button class="nav-btn '+(currentTab==='production'?'active':'')+'" onclick="setTab(\'production\')">🏭 Production</button><button class="nav-btn '+(currentTab==='analytics'?'active':'')+'" onclick="setTab(\'analytics\')">📈 Analytics</button><button class="nav-btn '+(currentTab==='inventory'?'active':'')+'" onclick="setTab(\'inventory\')">📦 Inventory</button><button class="nav-btn '+(currentTab==='history'?'active':'')+'" onclick="setTab(\'history\')">📋 History</button><button class="nav-btn '+(currentTab==='maintenance'?'active':'')+'" onclick="setTab(\'maintenance\')">🔧 Maintenance</button></div>'+content+'<div class="text-center text-gray-400 text-xs mt-8 pt-4 border-t">☁️ TX Battery ERP | Cloud Hosted | Data Shared</div>';
    }
    
    window.setTab = setTab;
    window.saveSchedule = saveSchedule;
    window.changePage = changePage;
    loadData();
</script>
</body>
</html>
    `);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
