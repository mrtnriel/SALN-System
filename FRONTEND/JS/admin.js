// --- Authentication & Session ---
if (localStorage.getItem('saln_role') !== 'admin') window.location.href = 'login.html';

function logout() { 
    localStorage.clear(); 
    window.location.href = 'login.html'; 
}

// --- Global Variables ---
const API_URL = 'http://127.0.0.1:5000/api';
let globalAgencies = []; // Array to hold agencies for instant search/sorting
let globalApprovedRecords = []; // Array to hold approved records for instant search/sorting
let submissionsChartInstance = null; // Holds the active chart to prevent overlapping

// --- Helper: Convert timestamp to "Time Ago" ---
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
}

// --- Dashboard Stats ---
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`);
        const data = await res.json();
        
        // 1. Update Counters
        document.getElementById('pending-count').innerText = data.counters.pending;
        document.getElementById('approved-count').innerText = data.counters.approved;
        document.getElementById('today-count').innerText = data.counters.today;
        document.getElementById('total-count').innerText = data.counters.total;

        // 2. Update Chart
        const ctx = document.getElementById('submissionsChart').getContext('2d');
        if (submissionsChartInstance) {
            submissionsChartInstance.destroy(); 
        }

        submissionsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.chartData.labels,
                datasets: [{
                    label: 'New SALN Submissions',
                    data: data.chartData.values,
                    backgroundColor: 'rgba(13, 110, 253, 0.1)', 
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4 
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: { stepSize: 1 } 
                    } 
                }
            }
        });

        // 3. Update Recent Activity Feed
        const activityList = document.getElementById('recent-activity-list');
        activityList.innerHTML = '';
        
        if (data.recentActivity && data.recentActivity.length > 0) {
            data.recentActivity.forEach(act => {
                activityList.insertAdjacentHTML('beforeend', `
                    <a href="#" class="list-group-item list-group-item-action px-0 border-0" onclick="showSection(event, 'pending')">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1 text-primary"><i class="bi bi-file-earmark-plus me-2"></i>${act.type}</h6>
                            <small class="text-muted">${timeAgo(act.date)}</small>
                        </div>
                        <p class="mb-1 small text-dark">${act.name}</p>
                    </a>
                `);
            });
        } else {
            activityList.innerHTML = '<p class="text-muted small text-center mt-3">No recent activity.</p>';
        }

    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

// --- Pending Requests ---
async function loadPendingRequests() {
    const tbody = document.querySelector('#pending-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading requests...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/admin/pending`);
        const data = await res.json();
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No pending submissions found.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(req => {
            const dateStr = new Date(req.submission_date).toLocaleString();
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="ps-4 fw-bold text-secondary">#REQ-${req.pending_id}</td>
                    <td class="fw-bold">${req.declarant_name}</td>
                    <td>${dateStr}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="viewPendingRecord(${req.pending_id})">
                            <i class="bi bi-eye me-1"></i> View
                        </button>
                        <button class="btn btn-sm btn-success me-2" onclick="approveRequest(${req.pending_id})">
                            <i class="bi bi-check-circle me-1"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteRequest(${req.pending_id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });
    } catch (error) { 
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error loading data.</td></tr>'; 
    }
}

async function viewPendingRecord(pendingId) {
    const modalContent = document.getElementById('modal-record-content');
    
    modalContent.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Fetching pending record...</p>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewRecordModal'));
    modal.show();

    try {
        const res = await fetch(`${API_URL}/admin/pending/${pendingId}`);
        const payload = await res.json();

        if (!res.ok) throw new Error(payload.error || "Failed to load");

        const emptyRow = (colSpan) => `<tr><td colspan="${colSpan}" class="text-center text-muted py-3">No records declared.</td></tr>`;

        const dec = payload.declarant || {};
        const sp = payload.spouse || {};
        const children = payload.children || [];
        const real = payload.real_properties || [];
        const personal = payload.personal_properties || [];
        const liab = payload.liabilities || [];

        const decName = `${dec.first_name || ''} ${dec.mi || ''} ${dec.family_name || ''}`.trim() || 'N/A';
        const spName = sp.first_name ? `${sp.first_name || ''} ${sp.mi || ''} ${sp.family_name || ''}`.trim() : 'N/A';

        modalContent.innerHTML = `
            <div class="alert alert-warning mb-4">
                <i class="bi bi-exclamation-triangle me-2"></i><strong>Pending Review:</strong> This record has not yet been approved or saved to the main database.
            </div>
            <div class="row g-4">
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold">Declarant Information</h6>
                    <table class="table table-sm table-borderless">
                        <tr><th width="35%" class="text-muted">Name</th><td class="fw-bold">${decName}</td></tr>
                        <tr><th class="text-muted">Agency</th><td>${dec.agency || 'N/A'}</td></tr>
                        <tr><th class="text-muted">Gov ID</th><td>${dec.id_no || 'N/A'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold">Spouse Information</h6>
                    <table class="table table-sm table-borderless">
                        <tr><th width="35%" class="text-muted">Name</th><td class="fw-bold">${spName}</td></tr>
                        <tr><th class="text-muted">Gov ID</th><td>${sp.id_no || 'N/A'}</td></tr>
                    </table>
                </div>
                <div class="col-12">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Unmarried Children Below 18</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Name</th><th>Age</th></tr></thead>
                        <tbody>
                            ${children.length ? children.map(c => `<tr><td>${c[0]}</td><td>${c[1]}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
                <div class="col-12">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Real Properties</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Description</th><th>Location</th><th>Year Acquired</th><th>Acquisition Cost</th></tr></thead>
                        <tbody>
                            ${real.length ? real.map(p => `<tr><td>${p[0]}</td><td>${p[2]}</td><td>${p[5]}</td><td>₱${p[7]}</td></tr>`).join('') : emptyRow(4)}
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Personal Properties</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Description</th><th>Acquisition Cost</th></tr></thead>
                        <tbody>
                            ${personal.length ? personal.map(p => `<tr><td>${p[0]}</td><td>₱${p[2]}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Liabilities</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Creditor</th><th>Balance</th></tr></thead>
                        <tbody>
                            ${liab.length ? liab.map(l => `<tr><td>${l[1]}</td><td>₱${l[2]}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        modalContent.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${err.message}</div>`;
    }
}

async function approveRequest(id) {
    if (!confirm("Approve this SALN and save it to the main database?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/approve/${id}`, { method: 'POST' });
        const result = await res.json();
        if (res.ok) { 
            alert(result.message); 
            loadPendingRequests();
            loadApprovedRecords();
            loadStats(); 
        } else alert("Error: " + result.error);
    } catch (e) { alert("Server error."); }
}

async function deleteRequest(id) {
    if (!confirm("Permanently delete this submission?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/delete/${id}`, { method: 'DELETE' });
        if (res.ok) { 
            loadPendingRequests(); 
            loadStats(); 
        }
    } catch (e) { alert("Server error."); }
}

// --- Approved Records ---
async function loadApprovedRecords() {
    const tbody = document.querySelector('#approved-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading approved records...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/admin/approved`);
        const data = await res.json();
        
        // Save the data globally for client-side filtering
        globalApprovedRecords = data;
        
        // Call render function
        renderApprovedRecords();
        
    } catch (error) { 
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error loading data.</td></tr>'; 
    }
}

function renderApprovedRecords() {
    const tbody = document.querySelector('#approved-table tbody');
    
    // Safety check in case elements haven't been added to HTML yet
    const searchInput = document.getElementById('approved-search');
    const sortSelect = document.getElementById('approved-sort');
    
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
    const sortOrder = sortSelect ? sortSelect.value : 'newest';

    // 1. Filter by Declarant Name
    let filteredRecords = globalApprovedRecords.filter(record => {
        const name = (record.declarant_name || '').toLowerCase();
        return name.includes(searchTerm);
    });

    // 2. Sort the filtered data
    filteredRecords.sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') {
            const dateA = new Date(a.filing_date || 0);
            const dateB = new Date(b.filing_date || 0);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        } else {
            const nameA = (a.declarant_name || '').toLowerCase();
            const nameB = (b.declarant_name || '').toLowerCase();
            if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        }
    });

    // 3. Render
    tbody.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No approved records match your search.</td></tr>';
        return;
    }

    filteredRecords.forEach(record => {
        const dateStr = record.filing_date ? new Date(record.filing_date).toLocaleDateString() : 'N/A';
        
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td class="ps-4 fw-bold text-secondary">#REC-${record.saln_id}</td>
                <td class="fw-bold">${record.declarant_name}</td>
                <td>${dateStr}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewRecord(${record.saln_id})">
                        <i class="bi bi-eye me-1"></i> View
                    </button>
                </td>
            </tr>
        `);
    });
}

// --- Search & View Records ---
async function searchRecords() {
    const keyword = document.getElementById('search-input').value;
    const tbody = document.querySelector('#search-results tbody');
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">Searching...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/admin/search?q=${keyword}`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records found.</td></tr>';
            return;
        }

        data.forEach(record => {
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="ps-4">${record.saln_id}</td>
                    <td class="fw-bold">${record.declarant_name}</td>
                    <td>${record.agency_name || 'N/A'}</td>
                    <td>${record.saln_year || 'N/A'}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewRecord(${record.saln_id})">
                            <i class="bi bi-eye me-1"></i> View
                        </button>
                    </td>
                </tr>
            `);
        });
    } catch(err) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-danger">Error loading search results.</td></tr>';
    }
}

async function viewRecord(declarantId) {
    const modalContent = document.getElementById('modal-record-content');
    
    modalContent.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Fetching comprehensive record...</p>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewRecordModal'));
    modal.show();

    try {
        const res = await fetch(`${API_URL}/admin/record/${declarantId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load");

        const emptyRow = (colSpan) => `<tr><td colspan="${colSpan}" class="text-center text-muted py-3">No records declared.</td></tr>`;

        modalContent.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold">Declarant Information</h6>
                    <table class="table table-sm table-borderless">
                        <tr><th width="35%" class="text-muted">Name</th><td class="fw-bold">${data.declarant.DECLARANT_NAME || 'N/A'}</td></tr>
                        <tr><th class="text-muted">Agency</th><td>${data.declarant.AGENCY_NAME || 'N/A'}</td></tr>
                        <tr><th class="text-muted">Gov ID</th><td>${data.declarant.DECLARANT_GOV_ID_NO || 'N/A'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold">Spouse Information</h6>
                    <table class="table table-sm table-borderless">
                        <tr><th width="35%" class="text-muted">Name</th><td class="fw-bold">${data.spouse ? data.spouse.SPOUSE_NAME : 'N/A'}</td></tr>
                        <tr><th class="text-muted">Gov ID</th><td>${data.spouse ? data.spouse.SPOUSE_GOV_ID_NO : 'N/A'}</td></tr>
                    </table>
                </div>
                <div class="col-12">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Unmarried Children Below 18</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Name</th><th>Age</th></tr></thead>
                        <tbody>
                            ${data.children.length ? data.children.map(c => `<tr><td>${c.UNMARRIED_CHILDREN_NAME}</td><td>${c.CHILD_AGE}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
                <div class="col-12">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Real Properties</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Description</th><th>Location</th><th>Year Acquired</th><th>Acquisition Cost</th></tr></thead>
                        <tbody>
                            ${data.real_properties.length ? data.real_properties.map(p => `<tr><td>${p.REAL_PROPERTY_DESCRIPTION}</td><td>${p.REAL_EXACT_LOCATION}</td><td>${p.REAL_ACQUISITION_YEAR}</td><td>₱${p.REAL_ACQUISITION_COST}</td></tr>`).join('') : emptyRow(4)}
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Personal Properties</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Description</th><th>Acquisition Cost</th></tr></thead>
                        <tbody>
                            ${data.personal_properties.length ? data.personal_properties.map(p => `<tr><td>${p.PERSONAL_PROPERTY_DESCRIPTION}</td><td>₱${p.PERSONAL_ACQUISITION_COST}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="border-bottom pb-2 text-primary fw-bold mt-2">Liabilities</h6>
                    <table class="table table-sm table-striped">
                        <thead><tr><th>Creditor</th><th>Balance</th></tr></thead>
                        <tbody>
                            ${data.liabilities.length ? data.liabilities.map(l => `<tr><td>${l.NAME_OF_CREDITORS}</td><td>₱${l.OUTSTANDING_BALANCE}</td></tr>`).join('') : emptyRow(2)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        modalContent.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${err.message}</div>`;
    }
}

// --- Agencies ---
async function loadAgencies() {
    const tbody = document.querySelector('#agencies-table tbody');
    tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4">Loading agencies...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/admin/agencies`);
        const rawAgencyData = await res.json();

        const uniqueAgenciesMap = new Map();
        rawAgencyData.forEach(agency => {
            if (!uniqueAgenciesMap.has(agency.AGENCY_NAME)) {
                uniqueAgenciesMap.set(agency.AGENCY_NAME, agency);
            }
        });

        // Save deduplicated list to global array
        globalAgencies = Array.from(uniqueAgenciesMap.values());

        // Call render function
        renderAgencies();

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-danger">Error loading agencies. Make sure your API endpoint is running.</td></tr>';
        console.error("Agency load error:", error);
    }
}

function renderAgencies() {
    const tbody = document.querySelector('#agencies-table tbody');
    const searchTerm = document.getElementById('agency-search').value.toLowerCase();
    const sortOrder = document.getElementById('agency-sort').value; // 'asc' or 'desc'

    // Filter
    let filteredAgencies = globalAgencies.filter(agency => {
        const name = (agency.AGENCY_NAME || '').toLowerCase();
        const address = (agency.OFFICE_ADDRESS || '').toLowerCase();
        return name.includes(searchTerm) || address.includes(searchTerm);
    });

    // Sort
    filteredAgencies.sort((a, b) => {
        const nameA = (a.AGENCY_NAME || '').toLowerCase();
        const nameB = (b.AGENCY_NAME || '').toLowerCase();
        
        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Render
    tbody.innerHTML = '';
    
    if (filteredAgencies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-muted">No agencies match your search.</td></tr>';
        return;
    }

    filteredAgencies.forEach(agency => {
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td class="ps-4 fw-bold">${agency.AGENCY_NAME}</td>
                <td>${agency.OFFICE_ADDRESS || 'N/A'}</td>
            </tr>
        `);
    });
}

// --- Predefined Filters ---
async function runFilter(filterKey, titleName) {
    const thead = document.getElementById('filter-thead');
    const tbody = document.getElementById('filter-tbody');
    const card = document.getElementById('filter-results-card');
    const title = document.getElementById('filter-title');

    // Reset UI state
    card.style.display = 'block';
    title.innerHTML = `<i class="bi bi-table me-2"></i>${titleName}`;
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Executing query...</p></td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/filters/${filterKey}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to execute query.");

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td class="text-center py-4 text-muted">No records found matching this filter criteria.</td></tr>';
            return;
        }

        // 1. Generate Headers Dynamically based on SQL Column Names
        const headers = Object.keys(data[0]);
        let headerHTML = '<tr>';
        headers.forEach(h => {
            // Format headers nicely: 'DECLARANT_NAME' -> 'Declarant Name'
            const formattedHeader = h.replace(/_/g, ' ')
                                     .toLowerCase()
                                     .replace(/\b\w/g, l => l.toUpperCase());
            headerHTML += `<th class="ps-3">${formattedHeader}</th>`;
        });
        headerHTML += '</tr>';
        thead.innerHTML = headerHTML;

        // 2. Generate Rows
        let rowsHTML = '';
        data.forEach(row => {
            rowsHTML += '<tr>';
            headers.forEach((h, index) => {
                let cellValue = row[h];
                
                // Handle formatting
                if (cellValue === null) {
                    cellValue = '<span class="badge bg-light text-secondary">NULL</span>';
                } else if (typeof cellValue === 'number' && cellValue > 1000) {
                    
                    // Ignore formatting if the column header contains "year"
                    if (h.toLowerCase().includes('year')) {
                        cellValue = cellValue.toString();
                    } else {
                        // Format large numbers/currency with commas
                        cellValue = cellValue.toLocaleString();
                    }
                    
                } else if (typeof cellValue === 'string' && cellValue.match(/^\w{3}, \d{2} \w{3} \d{4}/)) {
                    // Quick check for dates to format them cleaner
                    cellValue = new Date(cellValue).toLocaleDateString();
                }

                // Add padding to first column to match your design style
                const paddingClass = index === 0 ? 'ps-3 fw-bold text-secondary' : '';
                rowsHTML += `<td class="${paddingClass}">${cellValue}</td>`;
            });
            rowsHTML += '</tr>';
        });
        tbody.innerHTML = rowsHTML;

    } catch (err) {
        tbody.innerHTML = `<tr><td class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${err.message}</td></tr>`;
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadPendingRequests();
    loadApprovedRecords();
});