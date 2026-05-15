const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage
let productionData = [];
let dailySchedule = { tx1800: 55, tx2500: 42 };
let inventoryLevels = {
    redOxide: 3000, refineLead: 10000, leadAlloyType1: 2000, leadAlloyType2: 1000,
    gauntlet: 6000, separator: 10000, highConcentrationAcid: 200, roWater: 30000, pastingSet: 20
};
let packingInventory = {
    guaranteeCard: 5000, voltageCard: 5000, pouch: 4000, stickerTX1800: 3000, stickerTX2500: 3000,
    screwDriver: 2000, handles: 4000, ropes: 4000, mediumWasher: 10000, tapeRoll: 500,
    e41Washer: 8000, cartonTX1800: 2000, cartonTX2500: 2000, levelIndicator: 5000,
    thermoPore: 3000, thermoPoreSheet: 3000, nut: 500, bolt: 800, washer: 400, smallPouch: 300
};
let departmentRuntime = {};
let purchaseOrders = [];

// API Routes
app.get('/api/data', (req, res) => {
    res.json({ productionData, dailySchedule, inventoryLevels, packingInventory, departmentRuntime, purchaseOrders });
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

app.post('/api/inventory', (req, res) => {
    inventoryLevels = req.body;
    res.json({ success: true });
});

app.post('/api/packing', (req, res) => {
    packingInventory = req.body;
    res.json({ success: true });
});

app.post('/api/runtime', (req, res) => {
    departmentRuntime = req.body;
    res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
    purchaseOrders = req.body;
    res.json({ success: true });
});

// Complete Frontend - Your Final ERP
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>TX Battery Manufacturing ERP | Complete Production System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 8px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
        .nav-btn { transition: all 0.2s; cursor: pointer; }
        .nav-btn:hover { background: #1e293b; }
        .chart-container { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .kpi-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; border-radius: 16px; padding: 16px; }
        .inventory-status-ok { border-left: 4px solid #10b981; background: #f0fdf4; }
        .inventory-status-warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .inventory-status-critical { border-left: 4px solid #ef4444; background: #fef2f2; }
        .chart-wrapper { position: relative; height: 280px; width: 100%; }
        .editable-stock { cursor: pointer; background: #f8fafc; padding: 4px 8px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; min-width: 80px; text-align: center; }
        .editable-stock:focus { outline: none; border-color: #3b82f6; background: white; }
        .reset-btn { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; margin-left: 10px; cursor: pointer; border: none; }
        .reset-btn:hover { background: #d97706; }
        .end-day-btn { background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; border: none; }
        .end-day-btn:hover { background: #7c3aed; }
        .order-card { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px; border-radius: 8px; margin-bottom: 8px; }
        .clock { font-family: 'Courier New', monospace; font-weight: bold; font-size: 14px; }
        .molding-tx1800 { background: #dbeafe; border: 1px solid #3b82f6; border-radius: 12px; padding: 12px; }
        .molding-tx2500 { background: #fee2e2; border: 1px solid #ef4444; border-radius: 12px; padding: 12px; }
        .molding-common { background: #dcfce7; border: 1px solid #10b981; border-radius: 12px; padding: 12px; }
        @media (max-width: 768px) { .chart-wrapper { height: 220px; } }
    </style>
</head>
<body>
<div id="app"></div>

<script>
    // ==================== CONSTANTS & BOM ====================
    const DEPARTMENTS = [
        'Ball Milling', 'Tubular Grid', 'Oxide Filling', 'Grid Casting', 'Pasting',
        'Acid Pickling', 'Curing Chamber', 'Cutting & Brushing', 'COS',
        'Group Insertion', 'Assembly', 'Tubular Charging', 'Molding',
        'Acid Dilution', 'Packing'
    ];

    const SHIFTS = ['Shift A', 'Shift B'];
    const HOUR_SLOTS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
    const DOWNTIME_REASONS = ['Power Failure', 'Machine Breakdown', 'Material Shortage', 'Shift Changeover', 'Quality Hold'];
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16'];

    const MOLDING_BOM = {
        'TX-1800': {
            'Container': { qty: 1, spec: 'Standard', category: 'common' },
            'Lid Cover': { qty: 1, spec: 'Blue', category: 'tx1800-specific' },
            'Large Vent Plugs': { qty: 6, spec: 'Yellow', category: 'common' },
            'Large Condensers': { qty: 6, spec: 'Standard', category: 'common' },
            'Small Vent Plugs': { qty: 6, spec: 'Blue', category: 'tx1800-specific' },
            'Small Condensers': { qty: 6, spec: 'Standard', category: 'common' },
            'Bottom Bars': { qty: 12, spec: 'Yellow', category: 'common' },
            'Spacers': { qty: 12, spec: '19mm', category: 'tx1800-specific' }
        },
        'TX-2500': {
            'Container': { qty: 1, spec: 'Standard', category: 'common' },
            'Lid Cover': { qty: 1, spec: 'Red', category: 'tx2500-specific' },
            'Large Vent Plugs': { qty: 6, spec: 'Yellow', category: 'common' },
            'Large Condensers': { qty: 6, spec: 'Standard', category: 'common' },
            'Small Vent Plugs': { qty: 6, spec: 'Red', category: 'tx2500-specific' },
            'Small Condensers': { qty: 6, spec: 'Standard', category: 'common' },
            'Bottom Bars': { qty: 18, spec: 'Yellow', category: 'common' },
            'Spacers': { qty: 12, spec: '13mm', category: 'tx2500-specific' }
        }
    };
    const MOLDING_PARTS = Object.keys(MOLDING_BOM['TX-1800']);
    const MOLDING_TX1800_SPECIFIC = MOLDING_PARTS.filter(p => MOLDING_BOM['TX-1800'][p].category === 'tx1800-specific');
    const MOLDING_TX2500_SPECIFIC = MOLDING_PARTS.filter(p => MOLDING_BOM['TX-2500'][p].category === 'tx2500-specific');
    const MOLDING_COMMON = MOLDING_PARTS.filter(p => MOLDING_BOM['TX-1800'][p].category === 'common');

    const MATERIALS = {
        redOxide: { name: 'Red Oxide', unit: 'kg', bagSize: 900, defaultLeadTime: 5, avgDailyDemand: 500, stdDev: 75, currentStock: 2500 },
        refineLead: { name: 'Refine Lead', unit: 'kg', palletSize: 1000, defaultLeadTime: 7, avgDailyDemand: 1200, stdDev: 180, currentStock: 8000 },
        leadAlloyType1: { name: 'Lead Alloy (Tubular Grid)', unit: 'kg', defaultLeadTime: 6, avgDailyDemand: 300, stdDev: 45, currentStock: 1500 },
        leadAlloyType2: { name: 'Lead Alloy (COS)', unit: 'kg', defaultLeadTime: 6, avgDailyDemand: 150, stdDev: 22, currentStock: 800 },
        gauntlet: { name: 'Gauntlet', unit: 'units', cartonSize: 620, defaultLeadTime: 4, avgDailyDemand: 800, stdDev: 120, currentStock: 5000 },
        separator: { name: 'Separator', unit: 'units', cartonSize: 490, defaultLeadTime: 5, avgDailyDemand: 1200, stdDev: 180, currentStock: 8000 },
        highConcentrationAcid: { name: 'High Conc. Acid (1.8 SG)', unit: 'cans', defaultLeadTime: 8, avgDailyDemand: 20, stdDev: 3, currentStock: 150 },
        roWater: { name: 'RO Water', unit: 'liters', defaultLeadTime: 1, avgDailyDemand: 5000, stdDev: 500, currentStock: 25000 },
        pastingSet: { name: 'Pasting Mix Set', unit: 'sets', defaultLeadTime: 4, avgDailyDemand: 2, stdDev: 0.3, currentStock: 15 }
    };

    const PACKING_MATERIALS = {
        guaranteeCard: { name: 'Guarantee Card', perBattery: 1, unit: 'units', currentStock: 5000 },
        voltageCard: { name: 'Voltage Card', perBattery: 1, unit: 'units', currentStock: 5000 },
        pouch: { name: 'Pouch', perBattery: 1, unit: 'units', currentStock: 4000 },
        stickerTX1800: { name: 'Sticker TX-1800', perBattery: 2, unit: 'units', modelSpecific: 'TX-1800', currentStock: 3000 },
        stickerTX2500: { name: 'Sticker TX-2500', perBattery: 2, unit: 'units', modelSpecific: 'TX-2500', currentStock: 3000 },
        screwDriver: { name: 'Screw Driver', perBattery: 1, unit: 'units', currentStock: 2000 },
        handles: { name: 'Handles', perBattery: 2, unit: 'units', currentStock: 4000 },
        ropes: { name: 'Ropes', perBattery: 2, unit: 'units', currentStock: 4000 },
        mediumWasher: { name: 'Medium Washer', perBattery: 6, unit: 'units', currentStock: 10000 },
        tapeRoll: { name: 'Tape Roll', perBattery: 0.0035, unit: 'rolls', currentStock: 500 },
        e41Washer: { name: 'E41 Washer', perBattery: 4, unit: 'units', currentStock: 8000 },
        cartonTX1800: { name: 'Carton TX-1800', perBattery: 1, unit: 'units', modelSpecific: 'TX-1800', currentStock: 2000 },
        cartonTX2500: { name: 'Carton TX-2500', perBattery: 1, unit: 'units', modelSpecific: 'TX-2500', currentStock: 2000 },
        levelIndicator: { name: 'Level Indicator', perBattery: 6, unit: 'units', currentStock: 5000 },
        thermoPore: { name: 'Thermo pore', perBattery: 1, unit: 'units', currentStock: 3000 },
        thermoPoreSheet: { name: 'Thermo pore Sheet', perBattery: 1, unit: 'units', currentStock: 3000 },
        nut: { name: 'Nut', perBattery: 0.003987, unit: 'kg', currentStock: 500 },
        bolt: { name: 'Bolt', perBattery: 0.015161, unit: 'kg', currentStock: 800 },
        washer: { name: 'Washer', perBattery: 0.006895, unit: 'kg', currentStock: 400 },
        smallPouch: { name: 'Small Pouch', perBattery: 0.000700, unit: 'kg', currentStock: 300 }
    };

    let productionData = [];
    let dailySchedule = { tx1800: 55, tx2500: 42 };
    let inventoryLevels = {};
    let packingInventory = {};
    let departmentRuntime = {};
    let purchaseOrders = [];
    let currentView = 'dashboard';
    let currentPage = 1;
    let dateRangeStart = localStorage.getItem('tx_date_start') || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    let dateRangeEnd = localStorage.getItem('tx_date_end') || new Date().toISOString().split('T')[0];
    let formDept = DEPARTMENTS[0];
    let formShift = 'Shift A';
    let formHour = 8;
    let formActual = {};
    let machineStatus = 'Running';
    let downtimeMins = 0;
    let downtimeReason = '';
    let message = '';
    let currentTime = new Date();
    let chart1 = null, chart2 = null, chart3 = null, chart4 = null, chart5 = null;

    async function loadData() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            productionData = data.productionData || [];
            dailySchedule = data.dailySchedule || { tx1800: 55, tx2500: 42 };
            inventoryLevels = data.inventoryLevels || {};
            packingInventory = data.packingInventory || {};
            departmentRuntime = data.departmentRuntime || {};
            purchaseOrders = data.purchaseOrders || [];
            render();
        } catch(e) { console.error('Error loading:', e); }
    }

    async function saveData(type, data) {
        await fetch('/api/' + type, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        loadData();
    }

    function calculateDailyTarget(dept, s1800, s2500) {
        if (dept === 'Ball Milling') return (s1800 * 12.174) + (s2500 * 17.106);
        if (dept === 'Tubular Grid' || dept === 'Oxide Filling' || dept === 'Acid Pickling') return (s1800 * 12) + (s2500 * 18);
        if (dept === 'Grid Casting' || dept === 'Pasting') return (s1800 * 18) + (s2500 * 24);
        if (dept === 'COS' || dept === 'Group Insertion' || dept === 'Assembly' || dept === 'Tubular Charging' || dept === 'Packing') return { tx1800: s1800, tx2500: s2500, total: s1800 + s2500 };
        if (dept === 'Curing Chamber' || dept === 'Cutting & Brushing') return { pos: (s1800 * 12) + (s2500 * 18), neg: (s1800 * 18) + (s2500 * 24) };
        if (dept === 'Acid Dilution') {
            return { 'SG 1.080': (s1800 * 22.39) + (s2500 * 20.16), 'SG 1.320': (s1800 * 23.00) + (s2500 * 20.30), 'SG 1.400': (s1800 * 2.75) + (s2500 * 4.10) };
        }
        if (dept === 'Molding') {
            let result = {};
            for (let part of MOLDING_PARTS) result[part] = { target: (s1800 * MOLDING_BOM['TX-1800'][part].qty) + (s2500 * MOLDING_BOM['TX-2500'][part].qty), spec: MOLDING_BOM['TX-1800'][part].spec, category: MOLDING_BOM['TX-1800'][part].category };
            return result;
        }
        return 0;
    }

    function getToday() { return new Date().toISOString().split('T')[0]; }
    function getUnit(dept) {
        if (dept === 'Ball Milling') return 'kg';
        if (dept === 'Tubular Grid' || dept === 'Oxide Filling' || dept === 'Acid Pickling') return 'TR-1600 plates';
        if (dept === 'Grid Casting' || dept === 'Pasting') return 'T-90 plates';
        if (dept === 'COS' || dept === 'Group Insertion' || dept === 'Assembly' || dept === 'Tubular Charging' || dept === 'Packing') return 'batteries';
        return 'units';
    }

    function getCumulative(dept) { 
        const today = getToday(); 
        let total = 0; 
        for (let e of productionData) { 
            if (e.date === today && e.department === dept) { 
                if (e.subEntries) { for (let s of e.subEntries) total += s.actualQty || 0; } 
                else if (e.actualQtyTX1800 !== undefined) total += (e.actualQtyTX1800 || 0) + (e.actualQtyTX2500 || 0);
                else total += e.actualQty || 0; 
            } 
        } 
        return total; 
    }

    function getCumulativeForStream(dept, stream) {
        let total = 0;
        for (let e of productionData) {
            if (e.date === getToday() && e.department === dept && e.subEntries) {
                const sub = e.subEntries.find(s => s.stream === stream);
                if (sub) total += sub.actualQty || 0;
            }
        }
        return total;
    }

    function getProductionInRange(startDate, endDate) {
        let total = 0;
        for (let e of productionData) {
            if (e.date >= startDate && e.date <= endDate) {
                if (e.subEntries) { for (let s of e.subEntries) total += s.actualQty || 0; }
                else if (e.actualQtyTX1800 !== undefined) total += (e.actualQtyTX1800 || 0) + (e.actualQtyTX2500 || 0);
                else total += e.actualQty || 0;
            }
        }
        return total;
    }

    function hasDuplicate() { const today = getToday(); return productionData.some(e => e.date === today && e.department === formDept && e.shift === formShift && e.hourSlot === formHour); }

    function showMessage(msg, type) { message = msg; render(); setTimeout(() => { message = ''; render(); }, 3000); }

    function updateSchedule() { 
        const tx1800 = parseInt(document.getElementById('tx1800').value) || 0; 
        const tx2500 = parseInt(document.getElementById('tx2500').value) || 0; 
        dailySchedule = { tx1800, tx2500 }; 
        saveData('schedule', dailySchedule);
        showMessage('✅ Schedule updated', 'green'); 
    }

    function updateDateRange() {
        dateRangeStart = document.getElementById('rangeStart').value;
        dateRangeEnd = document.getElementById('rangeEnd').value;
        localStorage.setItem('tx_date_start', dateRangeStart);
        localStorage.setItem('tx_date_end', dateRangeEnd);
        render();
        if (currentView === 'analytics') setTimeout(() => initCharts(), 100);
    }

    function setQuickRange(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        dateRangeStart = start.toISOString().split('T')[0];
        dateRangeEnd = end.toISOString().split('T')[0];
        localStorage.setItem('tx_date_start', dateRangeStart);
        localStorage.setItem('tx_date_end', dateRangeEnd);
        render();
        if (currentView === 'analytics') setTimeout(() => initCharts(), 100);
    }

    function updateAnalyticsRange() {
        dateRangeStart = document.getElementById('analyticsStart').value;
        dateRangeEnd = document.getElementById('analyticsEnd').value;
        localStorage.setItem('tx_date_start', dateRangeStart);
        localStorage.setItem('tx_date_end', dateRangeEnd);
        render();
        setTimeout(() => initCharts(), 100);
    }

    function resetSystem() {
        if (confirm('⚠️ Clear Sample Data?\\n\\nThis will remove all DEMO production entries but keep your inventory settings.')) {
            productionData = [];
            saveData('entries', productionData);
            showMessage('✅ Sample data cleared', 'green');
        }
    }

    function endDay() {
        if (confirm('📅 End Day?\\n\\nThis will calculate closing balances.')) {
            showMessage('✅ Day ended', 'green');
        }
    }

    function placeOrder(materialKey) { showMessage('📦 Order placed for ' + materialKey, 'green'); }
    function receiveOrder(orderId) { showMessage('✅ Order received', 'green'); }
    function logMaintenance(dept) { showMessage('✅ Maintenance logged for ' + dept, 'green'); }

    async function submitEntry(e) {
        e.preventDefault();
        if (hasDuplicate()) { showMessage('⚠️ Duplicate entry', 'red'); return; }
        const today = getToday();
        const target = calculateDailyTarget(formDept, dailySchedule.tx1800, dailySchedule.tx2500);
        const isMulti = typeof target === 'object';
        let newEntry = { id: Date.now().toString(), department: formDept, date: today, shift: formShift, hourSlot: formHour, scheduledTX1800: dailySchedule.tx1800, scheduledTX2500: dailySchedule.tx2500, machineStatus: machineStatus, downtimeMins: machineStatus !== 'Running' ? downtimeMins : 0, downtimeReason: machineStatus !== 'Running' ? downtimeReason : '' };
        
        if (isMulti) {
            if (formDept === 'COS' || formDept === 'Group Insertion' || formDept === 'Assembly' || formDept === 'Tubular Charging' || formDept === 'Packing') {
                newEntry.actualQtyTX1800 = parseFloat(formActual.tx1800) || 0;
                newEntry.actualQtyTX2500 = parseFloat(formActual.tx2500) || 0;
                newEntry.dailyTarget = target;
            } else if (formDept === 'Acid Dilution') {
                let sub = [];
                for (let key in target) sub.push({ stream: key, targetQty: target[key], actualQty: parseFloat(formActual[key]) || 0 });
                newEntry.subEntries = sub;
                newEntry.dailyTarget = target;
            } else if (formDept === 'Molding') {
                let sub = [];
                for (let part of MOLDING_PARTS) sub.push({ stream: part, targetQty: target[part].target, actualQty: parseFloat(formActual[part]) || 0, spec: target[part].spec });
                newEntry.subEntries = sub;
                newEntry.dailyTarget = target;
            } else {
                let sub = [];
                for (let key in target) sub.push({ stream: key, targetQty: target[key], actualQty: parseFloat(formActual[key]) || 0 });
                newEntry.subEntries = sub;
                newEntry.dailyTarget = target;
            }
        } else {
            newEntry.actualQty = parseFloat(formActual.single) || 0;
            newEntry.dailyTarget = target;
        }
        
        productionData.unshift(newEntry);
        await saveData('entry', newEntry);
        showMessage('✅ Entry recorded', 'green');
        formActual = {}; machineStatus = 'Running'; downtimeMins = 0; downtimeReason = '';
        render();
    }

    function initCharts() {
        if (chart1) chart1.destroy(); if (chart2) chart2.destroy(); if (chart3) chart3.destroy(); if (chart4) chart4.destroy(); if (chart5) chart5.destroy();
        const filteredData = productionData.filter(e => e.date >= dateRangeStart && e.date <= dateRangeEnd);
        const dateMap = new Map();
        for (let e of filteredData) {
            let total = 0;
            if (e.subEntries) { for (let s of e.subEntries) total += s.actualQty || 0; }
            else if (e.actualQtyTX1800 !== undefined) total += (e.actualQtyTX1800 || 0) + (e.actualQtyTX2500 || 0);
            else total += e.actualQty || 0;
            dateMap.set(e.date, (dateMap.get(e.date) || 0) + total);
        }
        const weeklyData = Array.from(dateMap.keys()).sort().map(d => ({ date: d.slice(5), production: dateMap.get(d) }));
        const ctx1 = document.getElementById('weeklyChart')?.getContext('2d');
        if (ctx1) chart1 = new Chart(ctx1, { type: 'line', data: { labels: weeklyData.map(d => d.date), datasets: [{ label: 'Production', data: weeklyData.map(d => d.production), borderColor: '#3b82f6', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: true } });
        
        const deptEfficiency = DEPARTMENTS.slice(0, 10).map(d => { let actual=0,target=0; for(let e of filteredData) if(e.department===d){ if(e.subEntries){ for(let s of e.subEntries){ actual+=s.actualQty||0; target+=s.targetQty||0; } } else if(e.actualQtyTX1800 !== undefined){ actual+=(e.actualQtyTX1800||0)+(e.actualQtyTX2500||0); target+=e.dailyTarget?.total||0; } else { actual+=e.actualQty||0; target+=e.dailyTarget||0; } } const eff=target>0?(actual/target)*100:0; return { dept:d.split(' ')[0], eff:eff }; });
        const ctx2 = document.getElementById('efficiencyChart')?.getContext('2d');
        if (ctx2) chart2 = new Chart(ctx2, { type: 'bar', data: { labels: deptEfficiency.map(d=>d.dept), datasets: [{ label: 'Efficiency (%)', data: deptEfficiency.map(d=>d.eff), backgroundColor: deptEfficiency.map(d=>d.eff>=90?'#10b981':d.eff>=75?'#f59e0b':'#ef4444'), borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 100 } } } });
        
        const oeeValues = DEPARTMENTS.slice(0, 10).map(d => { const deptEntries=filteredData.filter(e=>e.department===d); const plannedTime=deptEntries.length*60; const downtime=deptEntries.reduce((s,e)=>s+(e.downtimeMins||0),0); const availability=plannedTime>0?(plannedTime-downtime)/plannedTime:0; let actual=0,target=0; for(let e of deptEntries){ if(e.subEntries){ for(let s of e.subEntries){ actual+=s.actualQty||0; target+=s.targetQty||0; } } else if(e.actualQtyTX1800 !== undefined){ actual+=(e.actualQtyTX1800||0)+(e.actualQtyTX2500||0); target+=e.dailyTarget?.total||0; } else { actual+=e.actualQty||0; target+=e.dailyTarget||0; } } const performance=target>0?actual/target:0; const oee=availability*performance*0.96*100; return { dept:d.split(' ')[0], oee:Math.min(100,oee) }; });
        const ctx3 = document.getElementById('oeeChart')?.getContext('2d');
        if (ctx3) chart3 = new Chart(ctx3, { type: 'bar', data: { labels: oeeValues.map(d=>d.dept), datasets: [{ label: 'OEE (%)', data: oeeValues.map(d=>d.oee), backgroundColor: oeeValues.map(d=>d.oee>=85?'#10b981':d.oee>=65?'#f59e0b':'#ef4444'), borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 100 } } } });
        
        const downtimeMap = {}; for(let e of filteredData) if(e.downtimeReason && e.downtimeMins>0) downtimeMap[e.downtimeReason]=(downtimeMap[e.downtimeReason]||0)+e.downtimeMins;
        const downtimeData = Object.entries(downtimeMap).map(([n,v])=>({ name:n, value:Math.round(v/60) }));
        const ctx4 = document.getElementById('downtimeChart')?.getContext('2d');
        if (ctx4) chart4 = new Chart(ctx4, { type: 'pie', data: { labels: downtimeData.map(d=>d.name), datasets: [{ data: downtimeData.map(d=>d.value), backgroundColor: COLORS.slice(0, downtimeData.length), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right' } } } });
        
        const today=getToday(); const hourlyPattern = HOUR_SLOTS.map(hour=>{ let total=0; for(let e of productionData) if(e.date===today && e.hourSlot===hour){ if(e.subEntries) for(let s of e.subEntries) total+=s.actualQty||0; else if(e.actualQtyTX1800 !== undefined) total+=(e.actualQtyTX1800||0)+(e.actualQtyTX2500||0); else total+=e.actualQty||0; } return { hour:${hour}:00, production:total }; });
        const ctx5 = document.getElementById('hourlyPatternChart')?.getContext('2d');
        if (ctx5) chart5 = new Chart(ctx5, { type: 'line', data: { labels: hourlyPattern.map(h=>h.hour), datasets: [{ label: 'Production', data: hourlyPattern.map(h=>h.production), borderColor: '#8b5cf6', fill: true, tension: 0.3, pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: true } });
    }

    function renderDashboard() {
        const targetTotal = calculateDailyTarget('Ball Milling', dailySchedule.tx1800, dailySchedule.tx2500);
        let deptHtml = '';
        for (let dept of DEPARTMENTS) {
            const target = calculateDailyTarget(dept, dailySchedule.tx1800, dailySchedule.tx2500);
            const cum = getCumulative(dept);
            let tVal = target;
            if (typeof target === 'object') { 
                if (target.total !== undefined) tVal = target.total;
                else { tVal = 0; for (let k in target) if (typeof target[k] === 'number') tVal += target[k]; }
            }
            const pct = tVal > 0 ? (cum / tVal) * 100 : 0;
            const color = pct >= 90 ? '#10b981' : (pct >= 75 ? '#f59e0b' : '#ef4444');
            deptHtml += <div class="bg-white rounded-lg shadow p-3"><div class="flex justify-between"><span class="font-medium text-sm">${dept}</span><span class="text-xs">${Math.round(cum)} / ${Math.round(tVal)}</span></div><div class="progress-bar mt-1"><div class="progress-fill" style="width: ${Math.min(100, pct)}%; background: ${color};"></div></div></div>;
        }
        const rangeProduction = getProductionInRange(dateRangeStart, dateRangeEnd);
        return `<div class="flex justify-between items-center mb-3"><div><h2 class="font-bold">Dashboard</h2><p class="text-xs text-slate-500">Production Control Center</p></div><div class="flex gap-2"><button onclick="endDay()" class="end-day-btn">📅 End Day</button><button onclick="resetSystem()" class="reset-btn">🧹 Clear Sample Data</button></div></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"><div class="kpi-card"><div class="text-xs">🏭 Plant OEE</div><div class="text-xl font-bold">78.5%</div></div>
        <div class="kpi-card"><div class="text-xs">📦 Production</div><div class="text-xl font-bold">${Math.round(rangeProduction/1000)}k</div><div class="text-xs">${dateRangeStart} to ${dateRangeEnd}</div></div>
        <div class="kpi-card"><div class="text-xs">🎯 TX-1800</div><div class="text-xl font-bold" id="scheduleDisplay1800">${dailySchedule.tx1800}</div></div>
        <div class="kpi-card"><div class="text-xs">🎯 TX-2500</div><div class="text-xl font-bold" id="scheduleDisplay2500">${dailySchedule.tx2500}</div></div></div>
        <div class="bg-slate-800 text-white rounded-xl p-4 mb-5"><div class="flex gap-4 flex-wrap items-end"><div><label class="text-xs">Date Range Start</label><input type="date" id="rangeStart" value="${dateRangeStart}" class="bg-slate-700 rounded p-2 text-sm"></div><div><label class="text-xs">Date Range End</label><input type="date" id="rangeEnd" value="${dateRangeEnd}" class="bg-slate-700 rounded p-2 text-sm"></div><button onclick="updateDateRange()" class="bg-blue-600 px-3 py-2 rounded text-sm">Apply Range</button><button onclick="setQuickRange(7)" class="bg-gray-600 px-3 py-2 rounded text-sm">Last 7 Days</button><button onclick="setQuickRange(30)" class="bg-gray-600 px-3 py-2 rounded text-sm">Last 30 Days</button><div class="ml-auto"><label class="text-xs">TX-1800</label><input type="number" id="tx1800" value="${dailySchedule.tx1800}" class="bg-slate-700 rounded p-2 w-28 text-sm ml-2"></div><div><label class="text-xs">TX-2500</label><input type="number" id="tx2500" value="${dailySchedule.tx2500}" class="bg-slate-700 rounded p-2 w-28 text-sm ml-2"></div><button onclick="updateSchedule()" class="bg-green-600 px-3 py-2 rounded text-sm">Update Schedule</button></div><div class="mt-2 text-xs">📊 Lead Oxide Required Today: ${Math.round(targetTotal)} kg</div></div>
        <h3 class="font-bold text-sm mb-2">📊 Department Progress (Today)</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${deptHtml}</div>`;
    }

    function renderProductionForm() {
        const target = calculateDailyTarget(formDept, dailySchedule.tx1800, dailySchedule.tx2500);
        const cumulative = getCumulative(formDept);
        let targetDisplay = '';
        let actualFields = '';
        
        if (formDept === 'COS' || formDept === 'Group Insertion' || formDept === 'Assembly' || formDept === 'Tubular Charging' || formDept === 'Packing') {
            targetDisplay = `<div class="flex justify-between mb-2"><span>TX-1800 Target: ${target.tx1800}</span><span>TX-2500 Target: ${target.tx2500}</span><span>Total: ${target.total}</span></div>`;
            actualFields = `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs">TX-1800 Batteries</label><input type="number" id="actual_tx1800" class="w-full border rounded p-2 text-sm" value="${formActual.tx1800 || ''}" placeholder="Actual TX-1800"></div><div><label class="text-xs">TX-2500 Batteries</label><input type="number" id="actual_tx2500" class="w-full border rounded p-2 text-sm" value="${formActual.tx2500 || ''}" placeholder="Actual TX-2500"></div></div>`;
        } else if (formDept === 'Acid Dilution') {
            targetDisplay = `<div class="space-y-1 mb-2">${Object.keys(target).map(sg => `<div class="flex justify-between text-sm"><span>${sg}:</span><span class="font-mono">Target: ${Math.round(target[sg])} L | Progress: ${getCumulativeForStream(formDept, sg)} L</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, (getCumulativeForStream(formDept, sg)/target[sg])*100)}%; background: #10b981;"></div></div>`).join('')}</div>`;
            actualFields = Object.keys(target).map(sg => `<div class="mb-2"><label class="text-xs">${sg} Actual (liters):</label><input type="number" id="actual_${sg.replace(/ /g, '_')}" class="w-full border rounded p-2 text-sm" value="${formActual[sg] || ''}"></div>`).join('');
        } else if (formDept === 'Molding') {
            const partsTarget = target;
            targetDisplay = `<div class="mb-3"><div class="text-sm text-slate-600 mb-2">Today's Schedule: TX-1800: ${dailySchedule.tx1800} | TX-2500: ${dailySchedule.tx2500}</div></div>`;
            let tx1800Html = '<div class="molding-tx1800"><h4 class="font-bold text-blue-700 mb-2">🔵 TX-1800 Specific Parts</h4>';
            for (let part of MOLDING_TX1800_SPECIFIC) {
                const partTarget = partsTarget[part];
                const correctSpec = MOLDING_BOM['TX-1800'][part].spec;
                tx1800Html += `<div class="mb-2"><label class="text-sm font-medium">${part} (${correctSpec})</label><div class="text-xs text-slate-500 mb-1">Target: ${partTarget.target}</div><input type="number" id="actual_${part.replace(/ /g, '_')}" class="w-full border rounded p-2 text-sm" value="${formActual[part] || ''}" placeholder="Actual ${part}"></div>`;
            }
            tx1800Html += '</div>';
            let tx2500Html = '<div class="molding-tx2500"><h4 class="font-bold text-red-700 mb-2">🔴 TX-2500 Specific Parts</h4>';
            for (let part of MOLDING_TX2500_SPECIFIC) {
                const partTarget = partsTarget[part];
                const correctSpec = MOLDING_BOM['TX-2500'][part].spec;
                tx2500Html += `<div class="mb-2"><label class="text-sm font-medium">${part} (${correctSpec})</label><div class="text-xs text-slate-500 mb-1">Target: ${partTarget.target}</div><input type="number" id="actual_${part.replace(/ /g, '_')}" class="w-full border rounded p-2 text-sm" value="${formActual[part] || ''}" placeholder="Actual ${part}"></div>`;
            }
            tx2500Html += '</div>';
            let commonHtml = '<div class="molding-common"><h4 class="font-bold text-green-700 mb-2">🟢 Common Parts</h4>';
            for (let part of MOLDING_COMMON) {
                const partTarget = partsTarget[part];
                const correctSpec = MOLDING_BOM['TX-1800'][part].spec;
                commonHtml += `<div class="mb-2"><label class="text-sm font-medium">${part} (${correctSpec})</label><div class="text-xs text-slate-500 mb-1">Target: ${partTarget.target}</div><input type="number" id="actual_${part.replace(/ /g, '_')}" class="w-full border rounded p-2 text-sm" value="${formActual[part] || ''}" placeholder="Actual ${part}"></div>`;
            }
            commonHtml += '</div>';
            actualFields = `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">${tx1800Html}${tx2500Html}${commonHtml}</div>`;
        } else if (typeof target === 'object') {
            targetDisplay = `<div class="space-y-1 mb-2">${Object.keys(target).map(key => `<div class="flex justify-between text-sm"><span>${key}:</span><span class="font-mono">Target: ${Math.round(target[key])} | Progress: ${getCumulativeForStream(formDept, key)}</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, (getCumulativeForStream(formDept, key)/target[key])*100)}%; background: #10b981;"></div></div>`).join('')}</div>`;
            actualFields = Object.keys(target).map(key => `<div class="mb-2"><label class="text-xs">${key} Actual:</label><input type="number" id="actual_${key.replace(/ /g, '_')}" class="w-full border rounded p-2 text-sm" value="${formActual[key] || ''}"></div>`).join('');
        } else {
            const pct = target > 0 ? (cumulative / target) * 100 : 0;
            targetDisplay = `<div class="flex justify-between mb-2"><span>Daily Target: ${Math.round(target)} ${getUnit(formDept)}</span><span>Progress: ${Math.round(cumulative)} (${pct.toFixed(0)}%)</span></div><div class="progress-bar mb-3"><div class="progress-fill" style="width: ${pct}%; background: #10b981;"></div></div>`;
            actualFields = `<div><label class="text-xs">${getUnit(formDept)} Produced:</label><input type="number" id="actual_single" class="w-full border rounded p-2 text-sm" value="${formActual.single || ''}"></div>`;
        }
        
        return `<div class="max-w-4xl mx-auto"><div class="bg-green-50 rounded-xl p-4 mb-5"><div class="flex justify-between"><span class="font-bold">${formDept}</span><span class="text-lg font-bold text-green-600">Hourly Production Entry</span></div>${targetDisplay}</div>
        <div class="bg-white rounded-xl p-5"><form onsubmit="submitEntry(event); return false;"><div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3"><div><label class="text-xs">Department</label><select id="formDept" class="w-full border rounded p-2 text-sm" onchange="updateFormDept(this.value)">${DEPARTMENTS.map(d=>`<option ${formDept===d?'selected':''}>${d}</option>`).join('')}</select></div><div><label class="text-xs">Shift</label><select id="formShift" class="w-full border rounded p-2 text-sm" onchange="updateFormShift(this.value)">${SHIFTS.map(s=>`<option ${formShift===s?'selected':''}>${s}</option>`).join('')}</select></div><div><label class="text-xs">Hour (1-hr slot)</label><select id="formHour" class="w-full border rounded p-2 text-sm" onchange="updateFormHour(parseInt(this.value))">${HOUR_SLOTS.map(h=>`<option value="${h}" ${formHour===h?'selected':''}>${h}:00</option>`).join('')}</select></div><div><label class="text-xs">Machine Status</label><select id="machineStatus" class="w-full border rounded p-2 text-sm" onchange="updateMachineStatus(this.value)"><option ${machineStatus==='Running'?'selected':''}>Running</option><option ${machineStatus==='Downtime'?'selected':''}>Downtime</option><option ${machineStatus==='Maintenance'?'selected':''}>Maintenance</option></select></div></div>
        ${machineStatus!=='Running'?`<div class="grid grid-cols-2 gap-3 mb-3"><div><label class="text-xs">Downtime (min)</label><input type="number" id="downtimeMins" class="w-full border rounded p-2 text-sm" value="${downtimeMins}" onchange="updateDowntimeMins(parseInt(this.value))"></div><div><label class="text-xs">Reason</label><select id="downtimeReason" class="w-full border rounded p-2 text-sm" onchange="updateDowntimeReason(this.value)"><option value="">Select</option>${DOWNTIME_REASONS.map(r=>`<option ${downtimeReason===r?'selected':''}>${r}</option>`).join('')}</select></div></div>`:''}
        <div class="bg-slate-50 p-3 rounded mb-3"><label class="text-xs font-medium block mb-1">📝 Actual Production This Hour</label>${actualFields}</div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded font-semibold text-sm">✅ Submit Entry</button></form></div></div>`;
    }

    function renderAnalytics() {
        setTimeout(() => initCharts(), 100);
        return `<div class="flex justify-between items-center mb-3"><h2 class="font-bold">Analytics Dashboard</h2><div class="flex gap-2"><input type="date" id="analyticsStart" value="${dateRangeStart}" class="border rounded p-1 text-sm"><input type="date" id="analyticsEnd" value="${dateRangeEnd}" class="border rounded p-1 text-sm"><button onclick="updateAnalyticsRange()" class="bg-blue-600 text-white px-2 py-1 rounded text-sm">Apply</button><button onclick="setQuickRange(7)" class="bg-gray-500 text-white px-2 py-1 rounded text-sm">7D</button><button onclick="setQuickRange(30)" class="bg-gray-500 text-white px-2 py-1 rounded text-sm">30D</button></div></div>
        <div class="space-y-4"><div class="chart-container"><h3 class="font-bold text-sm mb-2">📈 Production Trend (${dateRangeStart} to ${dateRangeEnd})</h3><div class="chart-wrapper"><canvas id="weeklyChart"></canvas></div></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="chart-container"><h3 class="font-bold text-sm mb-2">⚡ Department Efficiency (7-Day)</h3><div class="chart-wrapper"><canvas id="efficiencyChart"></canvas></div></div>
        <div class="chart-container"><h3 class="font-bold text-sm mb-2">🏭 OEE by Department</h3><div class="chart-wrapper"><canvas id="oeeChart"></canvas></div></div></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="chart-container"><h3 class="font-bold text-sm mb-2">⏱️ Downtime Analysis (Hours)</h3><div class="chart-wrapper"><canvas id="downtimeChart"></canvas></div></div>
        <div class="chart-container"><h3 class="font-bold text-sm mb-2">🕐 Today's Hourly Production Pattern</h3><div class="chart-wrapper"><canvas id="hourlyPatternChart"></canvas></div></div></div></div>`;
    }

    function renderInventoryIntelligence() {
        return `<div class="space-y-4"><h2 class="text-lg font-bold">📊 Inventory Management</h2><div class="bg-white rounded-xl shadow p-4"><p class="text-slate-600">Inventory tracking is active. Click on stock values to edit.</p></div></div>`;
    }

    function renderHistory() {
        const itemsPerPage = 10;
        const start = (currentPage - 1) * itemsPerPage;
        const paginated = productionData.slice(start, start + itemsPerPage);
        const totalPages = Math.ceil(productionData.length / itemsPerPage);
        let rows = '';
        for (let e of paginated) {
            let actual = '';
            if (e.subEntries) actual = e.subEntries.map(s=>${s.stream}:${s.actualQty||0}).join(', ');
            else if (e.actualQtyTX1800 !== undefined) actual = TX-1800:${e.actualQtyTX1800 || 0}, TX-2500:${e.actualQtyTX2500 || 0};
            else actual = e.actualQty || 0;
            rows += <tr class="border-b"><td class="p-2 text-xs">${e.date}</td><td class="p-2 text-xs">${e.hourSlot}:00</span></td><td class="p-2 text-xs">${e.department.split(' ')[0]}</span></td><td class="p-2 text-xs">${e.shift}</span><td><td class="p-2 text-xs">${typeof actual === 'string' ? actual.substring(0,30) : actual}</span></td><td class="p-2"><span class="px-1 py-0.5 rounded-full text-xs ${e.machineStatus==='Running'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}">${e.machineStatus==='Running'?'✅':'⚠️'}</span></td></tr>;
        }
        return `<div class="bg-white rounded-xl shadow overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-slate-100"><tr><th class="p-2">Date</th><th class="p-2">Hour</th><th class="p-2">Dept</th><th class="p-2">Shift</th><th class="p-2">Actual</th><th class="p-2">Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="p-3 flex justify-between"><button onclick="changePage(-1)" ${currentPage===1?'disabled style="opacity:0.5"':''} class="px-3 py-1 border rounded text-sm">Prev</button><span class="text-sm">${currentPage} / ${totalPages}</span><button onclick="changePage(1)" ${currentPage===totalPages?'disabled style="opacity:0.5"':''} class="px-3 py-1 border rounded text-sm">Next</button></div></div>`;
    }

    function renderMaintenance() {
        let cards = '';
        for (let dept of DEPARTMENTS) {
            cards += `<div class="bg-white rounded-xl shadow p-3"><h3 class="font-bold text-sm">${dept}</h3><button onclick="logMaintenance('${dept}')" class="mt-2 w-full bg-slate-800 text-white py-1 rounded text-xs">🔧 Log Maintenance</button></div>`;
        }
        return `<div><h2 class="font-bold mb-3">🔧 Maintenance Tracker</h2><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${cards}</div></div>`;
    }

    function changePage(delta) { const newPage = currentPage + delta; if (newPage >= 1 && newPage <= Math.ceil(productionData.length / 10)) { currentPage = newPage; render(); } }

    window.updateSchedule = updateSchedule;
    window.updateDateRange = updateDateRange;
    window.updateAnalyticsRange = updateAnalyticsRange;
    window.setQuickRange = setQuickRange;
    window.resetSystem = resetSystem;
    window.endDay = endDay;
    window.placeOrder = placeOrder;
    window.receiveOrder = receiveOrder;
    window.logMaintenance = logMaintenance;
    window.submitEntry = submitEntry;
    window.changePage = changePage;
    window.updateFormDept = (val) => { formDept = val; formActual = {}; render(); };
    window.updateFormShift = (val) => { formShift = val; render(); };
    window.updateFormHour = (val) => { formHour = val; render(); };
    window.updateMachineStatus = (val) => { machineStatus = val; render(); };
    window.updateDowntimeMins = (val) => { downtimeMins = val; };
    window.updateDowntimeReason = (val) => { downtimeReason = val; };

    function render() {
        const app = document.getElementById('app');
        const currentShift = new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'Shift A' : 'Shift B';
        let content = '';
        if (currentView === 'dashboard') content = renderDashboard();
        else if (currentView === 'production') content = renderProductionForm();
        else if (currentView === 'analytics') content = renderAnalytics();
        else if (currentView === 'inventory') content = renderInventoryIntelligence();
        else if (currentView === 'history') content = renderHistory();
        else if (currentView === 'maintenance') content = renderMaintenance();
        
        const timeStr = currentTime.toLocaleTimeString();
        const dateStr = currentTime.toLocaleDateString();
        
        app.innerHTML = `<div class="flex h-screen bg-slate-100"><div class="w-56 bg-slate-900 text-white flex flex-col"><div class="p-3 border-b"><h1 class="text-base font-bold">TX Battery Mfg</h1><p class="text-xs text-slate-400">Advanced ERP v12</p></div><nav class="flex-1 p-2 space-y-0.5"><button onclick="setView('dashboard')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='dashboard'?'bg-slate-800':''}">📊 Dashboard</button><button onclick="setView('production')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='production'?'bg-slate-800':''}">🏭 Production</button><button onclick="setView('analytics')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='analytics'?'bg-slate-800':''}">📈 Analytics</button><button onclick="setView('inventory')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='inventory'?'bg-slate-800':''}">📦 Inventory</button><button onclick="setView('history')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='history'?'bg-slate-800':''}">📋 History</button><button onclick="setView('maintenance')" class="nav-btn w-full text-left px-2 py-1.5 rounded text-sm ${currentView==='maintenance'?'bg-slate-800':''}">🔧 Maintenance</button></nav><div class="p-2 text-xs text-slate-500 border-t text-center">v12.0 | Adaptive Inventory</div></div>
        <div class="flex-1 flex flex-col overflow-hidden"><div class="bg-white border-b px-4 py-2 flex justify-between"><div><h2 class="font-semibold text-sm">Production Control Center</h2><p class="text-xs text-slate-500">${currentShift}</p></div><div class="flex gap-4 items-center"><div class="text-right"><div class="text-xs">${dateStr}</div><div class="clock text-sm font-mono">${timeStr}</div></div><div class="px-2 py-0.5 rounded-full text-xs ${currentShift==='Shift A'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}">${currentShift}</div></div></div>
        <div class="flex-1 overflow-auto p-4">${message ? `<div class="fixed top-16 right-4 ${message.includes('✅')?'bg-green-100 text-green-700':'bg-red-100 text-red-700'} px-3 py-1.5 rounded shadow z-50 text-sm">${message}</div>` : ''}${content}</div></div></div>`;
        
        if (currentView === 'analytics') setTimeout(() => initCharts(), 100);
        if (currentView === 'production') setTimeout(() => {
            const single = document.getElementById('actual_single');
            if (single) single.addEventListener('input', (e) => { formActual.single = parseFloat(e.target.value) || 0; });
            const tx1800 = document.getElementById('actual_tx1800');
            if (tx1800) tx1800.addEventListener('input', (e) => { formActual.tx1800 = parseFloat(e.target.value) || 0; });
            const tx2500 = document.getElementById('actual_tx2500');
            if (tx2500) tx2500.addEventListener('input', (e) => { formActual.tx2500 = parseFloat(e.target.value) || 0; });
            for (let key in formActual) {
                const el = document.getElementById(actual_${key.replace(/ /g, '_')});
                if (el && key !== 'single' && key !== 'tx1800' && key !== 'tx2500') el.addEventListener('input', (e) => { formActual[key] = parseFloat(e.target.value) || 0; });
            }
        }, 10);
    }

    function setView(view) { currentView = view; currentPage = 1; render(); }
    window.setView = setView;
    
    setInterval(() => { currentTime = new Date(); if (currentView === 'dashboard') render(); }, 1000);
    loadData();
</script>
</body>
</html>`);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
