// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';
// const API_BASE_URL = 'https://bahasha-t8425.ondigitalocean.app/api/v1';

// State
let churches = [];
let currentChurch = null;
let deleteChurchId = null;

// DOM Elements
const churchModal = document.getElementById('church-modal');
const deleteModal = document.getElementById('delete-modal');
const logoutModal = document.getElementById('logout-modal');
const churchForm = document.getElementById('church-form');
const churchesTableBody = document.getElementById('churches-table-body');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');

// Color picker sync
const colorInput = document.getElementById('church-color');
const colorTextInput = document.getElementById('church-color-text');

colorInput.addEventListener('input', (e) => {
    colorTextInput.value = e.target.value;
});

colorTextInput.addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        colorInput.value = e.target.value;
    }
});

// Church code auto-format (lowercase, replace spaces with hyphens)
document.getElementById('church-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        if (!response.ok) {
            console.error('Auth verify failed:', response.status);
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Expected JSON but got:', contentType);
            alert('Server error: Invalid response format. Please check if the backend is running.');
            return;
        }
        
        const data = await response.json();
        if (!data.valid) {
            localStorage.clear();
            window.location.href = 'login.html';
        } else {
            displayUserInfo(data.user);
            loadChurches();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        alert(`Authentication error: ${error.message}\n\nPlease ensure the backend server is running at ${API_BASE_URL}`);
    }
}

function displayUserInfo(user) {
    document.getElementById('user-name').textContent = user.username || 'User';
}

// ============================================
// LOAD CHURCHES
// ============================================

async function loadChurches() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/churches/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        churches = data.churches || [];
        
        updateStats();
        renderChurches();
        
    } catch (error) {
        console.error('Error loading churches:', error);
        showError('Failed to load churches. Please try again.');
    }
}

function updateStats() {
    const total = churches.length;
    const active = churches.filter(c => c.is_active).length;
    const featured = churches.filter(c => c.is_featured).length;
    const inactive = total - active;
    
    document.getElementById('total-churches').textContent = total;
    document.getElementById('active-churches').textContent = active;
    document.getElementById('featured-churches').textContent = featured;
    document.getElementById('inactive-churches').textContent = inactive;
}

function renderChurches() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilterValue = statusFilter.value;
    
    let filtered = churches.filter(church => {
        const matchesSearch = 
            church.name.toLowerCase().includes(searchTerm) ||
            church.code.toLowerCase().includes(searchTerm) ||
            (church.city && church.city.toLowerCase().includes(searchTerm));
        
        let matchesStatus = true;
        if (statusFilterValue === 'active') {
            matchesStatus = church.is_active;
        } else if (statusFilterValue === 'inactive') {
            matchesStatus = !church.is_active;
        } else if (statusFilterValue === 'featured') {
            matchesStatus = church.is_featured;
        }
        
        return matchesSearch && matchesStatus;
    });
    
    if (filtered.length === 0) {
        churchesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-church text-4xl mb-4 text-gray-300"></i>
                    <p>No churches found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    churchesTableBody.innerHTML = filtered.map(church => {
        const statusBadge = church.is_active 
            ? '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>'
            : '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inactive</span>';
        
        const featuredBadge = church.is_featured 
            ? '<span class="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full ml-2"><i class="fas fa-star"></i> Featured</span>'
            : '';
        
        const donationUrl = `${window.location.origin}/form/${church.code}`;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            ${church.logo_url 
                                ? `<img class="h-10 w-10 rounded-full object-cover" src="${church.logo_url}" alt="${church.name}">`
                                : `<div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">${church.name.charAt(0)}</div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${church.name}</div>
                            <div class="text-xs text-gray-500">${church.description || 'No description'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 rounded">${church.code}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${church.city || '-'}</div>
                    <div class="text-xs text-gray-500">${church.country || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${church.phone || '-'}</div>
                    <div class="text-xs text-gray-500">${church.email || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                    ${featuredBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="viewChurch(${church.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editChurch(${church.id})" class="text-green-600 hover:text-green-900" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="viewDonationLink(${church.id})" class="text-purple-600 hover:text-purple-900" title="Copy Link">
                            <i class="fas fa-link"></i>
                        </button>
                        <button onclick="viewStats(${church.id})" class="text-yellow-600 hover:text-yellow-900" title="Statistics">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button onclick="confirmDelete(${church.id})" class="text-red-600 hover:text-red-900" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// CHURCH ACTIONS
// ============================================

function openAddChurchModal() {
    currentChurch = null;
    document.getElementById('modal-title').textContent = 'Add New Church';
    document.getElementById('church-id').value = '';
    churchForm.reset();
    
    // Set defaults
    document.getElementById('church-active').checked = true;
    document.getElementById('church-featured').checked = false;
    document.getElementById('church-color').value = '#3b82f6';
    document.getElementById('church-color-text').value = '#3b82f6';
    document.getElementById('church-language').value = 'en';
    document.getElementById('church-template').value = 'church_donation_link';
    
    churchModal.classList.remove('hidden');
}

function editChurch(id) {
    currentChurch = churches.find(c => c.id === id);
    
    if (!currentChurch) {
        showError('Church not found');
        return;
    }
    
    document.getElementById('modal-title').textContent = 'Edit Church';
    document.getElementById('church-id').value = currentChurch.id;
    document.getElementById('church-name').value = currentChurch.name || '';
    document.getElementById('church-code').value = currentChurch.code || '';
    document.getElementById('church-description').value = currentChurch.description || '';
    document.getElementById('church-address').value = currentChurch.address || '';
    document.getElementById('church-city').value = currentChurch.city || '';
    document.getElementById('church-country').value = currentChurch.country || '';
    document.getElementById('church-phone').value = currentChurch.phone || '';
    document.getElementById('church-email').value = currentChurch.email || '';
    document.getElementById('church-logo').value = currentChurch.logo_url || '';
    document.getElementById('church-color').value = currentChurch.primary_color || '#3b82f6';
    document.getElementById('church-color-text').value = currentChurch.primary_color || '#3b82f6';
    document.getElementById('church-template').value = currentChurch.template_name || '';
    document.getElementById('church-language').value = currentChurch.template_language || 'en';
    document.getElementById('church-template-image').value = currentChurch.template_header_image || '';
    document.getElementById('church-mpesa-shortcode').value = currentChurch.mpesa_shortcode || '';
    document.getElementById('church-mpesa-reference').value = currentChurch.mpesa_account_reference || '';
    document.getElementById('church-active').checked = currentChurch.is_active;
    document.getElementById('church-featured').checked = currentChurch.is_featured;
    
    churchModal.classList.remove('hidden');
}

function viewChurch(id) {
    const church = churches.find(c => c.id === id);
    
    if (!church) {
        showError('Church not found');
        return;
    }
    
    const donationUrl = `${window.location.origin}/form/${church.code}`;
    
    alert(`
Church Details:
━━━━━━━━━━━━━━━━━━━━
Name: ${church.name}
Code: ${church.code}
City: ${church.city || 'N/A'}
Status: ${church.is_active ? 'Active' : 'Inactive'}

Donation URL:
${donationUrl}

Contact:
Phone: ${church.phone || 'N/A'}
Email: ${church.email || 'N/A'}
    `);
}

function viewDonationLink(id) {
    const church = churches.find(c => c.id === id);
    
    if (!church) {
        showError('Church not found');
        return;
    }
    
    const donationUrl = `${window.location.origin}/form/${church.code}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(donationUrl).then(() => {
        showSuccess(`Donation link copied to clipboard!\n\n${donationUrl}`);
    }).catch(err => {
        prompt('Copy this link:', donationUrl);
    });
}

async function viewStats(id) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/churches/${id}/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        alert(`
Church Statistics:
━━━━━━━━━━━━━━━━━━━━
Church: ${data.church_name}
Code: ${data.church_code}

Total Users: ${data.user_count}
Total Donations: ${data.donation_count}
Total Amount: KES ${data.total_amount?.toLocaleString() || 0}
Average Donation: KES ${data.average_donation?.toLocaleString() || 0}
        `);
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Failed to load statistics');
    }
}

function confirmDelete(id) {
    deleteChurchId = id;
    deleteModal.classList.remove('hidden');
}

async function deleteChurch() {
    if (!deleteChurchId) return;
    
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/churches/${deleteChurchId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showSuccess('Church deleted successfully');
        deleteModal.classList.add('hidden');
        deleteChurchId = null;
        loadChurches();
        
    } catch (error) {
        console.error('Error deleting church:', error);
        showError('Failed to delete church');
    }
}

// ============================================
// FORM SUBMISSION
// ============================================

async function saveChurch(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    const churchId = document.getElementById('church-id').value;
    const isEdit = !!churchId;
    
    const churchData = {
        name: document.getElementById('church-name').value,
        code: document.getElementById('church-code').value,
        description: document.getElementById('church-description').value || null,
        address: document.getElementById('church-address').value || null,
        city: document.getElementById('church-city').value || null,
        country: document.getElementById('church-country').value || null,
        phone: document.getElementById('church-phone').value || null,
        email: document.getElementById('church-email').value || null,
        logo_url: document.getElementById('church-logo').value || null,
        primary_color: document.getElementById('church-color-text').value || '#3b82f6',
        template_name: document.getElementById('church-template').value,
        template_language: document.getElementById('church-language').value,
        template_header_image: document.getElementById('church-template-image').value || null,
        mpesa_shortcode: document.getElementById('church-mpesa-shortcode').value || null,
        mpesa_account_reference: document.getElementById('church-mpesa-reference').value || null,
        is_active: document.getElementById('church-active').checked,
        is_featured: document.getElementById('church-featured').checked,
    };
    
    const saveBtn = document.getElementById('save-church-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    
    try {
        const url = isEdit 
            ? `${API_BASE_URL}/churches/${churchId}`
            : `${API_BASE_URL}/churches/`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(churchData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        showSuccess(isEdit ? 'Church updated successfully!' : 'Church created successfully!');
        churchModal.classList.add('hidden');
        loadChurches();
        
    } catch (error) {
        console.error('Error saving church:', error);
        showError(`Failed to save church: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Church';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Modal controls
document.getElementById('add-church-btn').addEventListener('click', openAddChurchModal);
document.getElementById('close-modal').addEventListener('click', () => {
    churchModal.classList.add('hidden');
});
document.getElementById('cancel-btn').addEventListener('click', () => {
    churchModal.classList.add('hidden');
});

// Form submission
churchForm.addEventListener('submit', saveChurch);

// Delete modal
document.getElementById('cancel-delete').addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    deleteChurchId = null;
});
document.getElementById('confirm-delete').addEventListener('click', deleteChurch);

// Search and filter
searchInput.addEventListener('input', renderChurches);
statusFilter.addEventListener('change', renderChurches);

// Logout
document.getElementById('logout-button').addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
});

document.getElementById('cancel-logout').addEventListener('click', () => {
    logoutModal.classList.add('hidden');
});

document.getElementById('confirm-logout').addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

// Close modals on outside click
churchModal.addEventListener('click', (e) => {
    if (e.target === churchModal) {
        churchModal.classList.add('hidden');
    }
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.add('hidden');
        deleteChurchId = null;
    }
});

logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        logoutModal.classList.add('hidden');
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showError(message) {
    alert('❌ Error: ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});