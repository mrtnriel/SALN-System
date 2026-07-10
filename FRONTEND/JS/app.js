if (localStorage.getItem('saln_logged_in') !== 'true') window.location.href = 'login.html';
function logout() { localStorage.clear(); window.location.href = 'login.html'; }

const API_URL = 'http://127.0.0.1:5000/api';
let currentStep = 0;
const steps = document.querySelectorAll('.form-step');
const navButtons = document.querySelectorAll('.custom-sidebar button');

// --- Load Agencies ---
async function loadAgencies() {
    try {
        const res = await fetch(`${API_URL}/agencies`);
        const agencies = await res.json();
        const datalist = document.getElementById('agency-list');
        agencies.forEach(agency => {
            const option = document.createElement('option');
            option.value = agency;
            datalist.appendChild(option);
        });
    } catch (e) { console.error("Failed to load agencies"); }
}

function updateNavigation() {
    steps.forEach((step, idx) => { step.classList.toggle('d-none', idx !== currentStep); step.classList.toggle('active-step', idx === currentStep); });
    navButtons.forEach((btn, idx) => btn.classList.toggle('active', idx === currentStep));

    document.getElementById('btn-back').disabled = (currentStep === 0);
    const nextBtn = document.getElementById('btn-next');
    
    if (currentStep === steps.length - 1) { 
        nextBtn.textContent = 'Submit SALN'; 
        nextBtn.classList.replace('btn-primary', 'btn-success');
        toggleSubmitButton(); 
    } else { 
        nextBtn.textContent = 'Next Step'; 
        nextBtn.classList.replace('btn-success', 'btn-primary'); 
        nextBtn.disabled = false;
    }
}

// Native HTML5 Form Validation hook
function validateCurrentStep() {
    const currentFormStep = steps[currentStep];
    const inputs = currentFormStep.querySelectorAll('input, select, textarea');
    
    for (let input of inputs) {
        if (!input.disabled && !input.checkValidity()) {
            input.reportValidity(); 
            return false;
        }
    }
    return true;
}

function navigate(dir) {
    if (dir > 0 && !validateCurrentStep()) return; 

    if (currentStep + dir === steps.length - 1 && dir > 0) populateReviewScreen();
    if (currentStep + dir === steps.length) { submitSALN(); return; }
    
    currentStep += dir; updateNavigation();
}

function jumpToStep(idx) { 
    if (idx > currentStep && !validateCurrentStep()) return;
    if (idx === steps.length - 1) populateReviewScreen(); 
    currentStep = idx; updateNavigation(); 
}

function toggleSubmitButton() {
    const isCertified = document.getElementById('certify-chk').checked;
    document.getElementById('btn-next').disabled = !isCertified;
}

const getRadio = name => document.querySelector(`input[name="${name}"]:checked`)?.value || "Not Specified";
const exTable = id => Array.from(document.querySelectorAll(`#${id} tbody tr`)).map(row => Array.from(row.querySelectorAll('input')).map(input => input.value)).filter(row => row[0] !== "");

// Helper to send null payloads if "Not Applicable" is checked
const getTableData = (tableId, checkboxId, columnsCount) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && checkbox.checked) {
        return [Array(columnsCount).fill(null)];
    }
    return exTable(tableId);
};

function buildPayload() {
    const noSpouse = document.getElementById('no-spouse').checked;
    
    // Create a null-filled object for a missing spouse
    const nullSpouse = { first_name: null, mi: null, family_name: null, position: null, agency: null, address: null, id_type: null, id_no: null, id_date: null };

    return {
        compliance_for: getRadio('complianceFor'), filing_date: document.getElementById('filing_date').value || "Not Specified", filing_type: getRadio('filingType'),
        declarant: {
            first_name: document.getElementById('dec_first').value, mi: document.getElementById('dec_mi').value, family_name: document.getElementById('dec_family').value,
            position: document.getElementById('dec_pos').value, agency: document.getElementById('dec_agency').value, address: document.getElementById('dec_address').value,
            id_type: document.getElementById('dec_id_type').value, id_no: document.getElementById('dec_id_no').value, id_date: document.getElementById('dec_id_date').value
        },
        spouse: noSpouse ? nullSpouse : {
            first_name: document.getElementById('sp_first').value, mi: document.getElementById('sp_mi').value, family_name: document.getElementById('sp_family').value,
            position: document.getElementById('sp_pos').value, agency: document.getElementById('sp_agency').value, address: document.getElementById('sp_address').value,
            id_type: document.getElementById('sp_id_type').value, id_no: document.getElementById('sp_id_no').value, id_date: document.getElementById('sp_id_date').value
        },
        other_spouses: getTableData('other-spouses-table', 'no-other-spouses', 1),
        children: getTableData('children-table', 'no-children', 2), 
        real_properties: exTable('real-assets-table'), 
        personal_properties: exTable('personal-assets-table'), 
        liabilities: getTableData('liabilities-table', 'no-liabilities', 3),
        business: getTableData('business-table', 'no-business', 4),
        relatives: getTableData('relatives-table', 'no-relatives', 4),
        total_assets: document.getElementById('total-assets').textContent, total_liabilities: document.getElementById('total-liabilities').textContent, net_worth: document.getElementById('net-worth-display').textContent.replace('Net Worth: ₱ ', '')
    };
}

function populateReviewScreen() {
    const data = buildPayload();
    
    // Ensure we don't count the null placeholder row as a literal child or property in the review display
    const childCount = data.children[0] && data.children[0][0] === null ? 0 : data.children.length;
    const liabCount = data.liabilities[0] && data.liabilities[0][0] === null ? 0 : data.liabilities.length;

    document.getElementById('review-content').innerHTML = `
        <div class="row mb-3">
            <div class="col-md-6"><h6 class="text-secondary">Declarant</h6><p class="fw-bold">${data.declarant.first_name || ''} ${data.declarant.family_name || ''}</p></div>
            <div class="col-md-6"><h6 class="text-secondary">Filing</h6><p>${data.compliance_for}</p></div>
        </div><hr>
        <ul class="list-unstyled">
            <li><i class="bi bi-check2 text-success"></i> ${childCount} Children | ${data.real_properties.length} Real Prop | ${liabCount} Liabilities</li>
        </ul><hr>
        <div class="bg-light p-3 rounded text-end">
            <h6>Assets: <span class="text-success">₱ ${data.total_assets}</span></h6>
            <h6>Liabilities: <span class="text-danger">₱ ${data.total_liabilities}</span></h6>
            <h5 class="fw-bold">Net Worth: ₱ ${data.net_worth}</h5>
        </div>`;
}

async function submitSALN() {
    const btn = document.getElementById('btn-next'); btn.innerHTML = 'Saving...'; btn.disabled = true;
    try {
        const res = await fetch(`${API_URL}/submit_saln`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
        if (res.ok) { alert("Sent to Admin for Review!"); window.location.reload(); } else { alert("Database Error."); btn.textContent = 'Submit SALN'; btn.disabled = false; }
    } catch (e) { alert("Server connection failed."); btn.textContent = 'Submit SALN'; btn.disabled = false; }
}

// --- Toggles & Math ---
function toggleTable(type) {
    const checkbox = document.getElementById(`no-${type}`);
    if (!checkbox) return; 
    
    const isChecked = checkbox.checked;
    const table = document.getElementById(`${type}-table`);
    const btn = document.getElementById(`btn-add-${type}`);
    
    table.style.opacity = isChecked ? "0.5" : "1";
    if (btn) btn.disabled = isChecked;
    
    table.querySelectorAll('input, button').forEach(input => {
        input.disabled = isChecked;
        
        if (isChecked && (input.type === 'text' || input.type === 'number' || input.type === 'date')) {
            input.value = '';
        }
    });
    calculateTotals(); 
}

function toggleSpouse() {
    const isChecked = document.getElementById('no-spouse').checked;
    const container = document.getElementById('spouse-container');
    container.style.opacity = isChecked ? "0.5" : "1";
    container.querySelectorAll('input, button').forEach(i => { if(i.id !== 'no-other-spouses') i.disabled = isChecked; });
    
    const otherSpouseBox = document.getElementById('no-other-spouses');
    if(isChecked) { otherSpouseBox.checked = true; otherSpouseBox.disabled = true; toggleTable('other-spouses'); } 
    else { otherSpouseBox.disabled = false; }
}

const parseC = val => isNaN(parseFloat(String(val).replace(/,/g, ''))) ? 0 : parseFloat(String(val).replace(/,/g, ''));
const formatC = num => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calculateTotals() {
    let r = 0, p = 0, l = 0;
    document.querySelectorAll('.real-cost').forEach(i => r += parseC(i.value)); 
    document.querySelectorAll('.personal-cost').forEach(i => p += parseC(i.value)); 
    document.querySelectorAll('.liability-bal').forEach(i => l += parseC(i.value));
    
    document.getElementById('real-subtotal').textContent = formatC(r); 
    document.getElementById('personal-subtotal').textContent = formatC(p);
    document.getElementById('total-assets').textContent = formatC(r + p); 
    document.getElementById('total-liabilities').textContent = formatC(l);
    document.getElementById('net-worth-display').textContent = `Net Worth: ₱ ${formatC((r + p) - l)}`;
}

// --- Row Additions ---
const delBtn = `<td class="text-center"><button tabindex="-1" type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove(); calculateTotals();"><i class="bi bi-trash"></i></button></td>`;
const addRealAssetRow = () => document.querySelector('#real-assets-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm real-cost" oninput="calculateTotals()" required></td>${delBtn}</tr>`);
const addPersonalAssetRow = () => document.querySelector('#personal-assets-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm personal-cost" oninput="calculateTotals()" required></td>${delBtn}</tr>`);
const addLiabilityRow = () => document.querySelector('#liabilities-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm liability-bal" oninput="calculateTotals()" required></td>${delBtn}</tr>`);
const addChildRow = () => document.querySelector('#children-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="number" class="form-control form-control-sm" required></td>${delBtn}</tr>`);
const addBusinessRow = () => document.querySelector('#business-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="date" class="form-control form-control-sm" required></td>${delBtn}</tr>`);
const addRelativeRow = () => document.querySelector('#relatives-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td><td><input type="text" class="form-control form-control-sm" required></td>${delBtn}</tr>`);
const addOtherSpouseRow = () => document.querySelector('#other-spouses-table tbody').insertAdjacentHTML('beforeend', `<tr><td><input type="text" class="form-control form-control-sm" required></td>${delBtn}</tr>`);

document.addEventListener('DOMContentLoaded', () => {
    loadAgencies();
    addRealAssetRow(); addPersonalAssetRow(); addLiabilityRow(); addChildRow(); addBusinessRow(); addRelativeRow(); addOtherSpouseRow();
    updateNavigation();
});