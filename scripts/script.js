// const API_BASE_URL = window.location.origin;
const API_BASE_URL =  'https://b6f3243efdb7.ngrok-free.app/api/v1'
// const API_BASE_URL = 'http://localhost:5000/api/v1'

// Store form data - now includes dynamic categories
let contributionData = {
    tithe: 0,
    offering: 0,
    localBudget: 0,
    churchDevelopment: 0,
    evangelism: 0,
    dynamicCategories: {}, // Store dynamic category contributions
    total: 0
};

// Counter for unique IDs
let categoryCounter = 0;

// Console log all form inputs as user types
function logFormData() {
    console.log('=== FORM DATA UPDATE ===');
    console.log('Tithe:', document.getElementById('tithe').value);
    console.log('Offering:', document.getElementById('offering').value);
    console.log('Local Budget:', document.getElementById('localBudget').value);
    console.log('Church Development:', document.getElementById('churchDevelopment').value);
    console.log('Evangelism:', document.getElementById('evangelism').value);
    console.log('Dynamic Categories:', contributionData.dynamicCategories);
    console.log('========================');
}

// Add event listeners to log form data on input for static fields
['tithe', 'offering', 'localBudget', 'churchDevelopment', 'evangelism'].forEach(id => {
    document.getElementById(id).addEventListener('input', logFormData);
});

// Handle category selection and create input field
document.getElementById('category').addEventListener('change', function() {
    let category = this.value;
    if (category) {
        createCategoryInput(category);
        // Hide the dropdown after selection
        // refreshCategorySelector();
    }
});

// Function to hide the main category selector
function refreshCategorySelector() {
    const categorySelector = document.getElementById('category');
    categorySelector.selectedIndex = 0;
}

// Function to show the main category selector
function showCategorySelector() {
    const categorySelector = document.getElementById('category').closest('.input-group');
    categorySelector.style.display = 'block';
    // Reset to default option
    document.getElementById('category').selectedIndex = 0;
}

// Function to create a new category input field
function createCategoryInput(categoryName) {
    categoryCounter++;
    const uniqueId = `${categoryName}_${categoryCounter}`;
    
    const addedFieldContainer = document.getElementById('added_field');
    
    // Create new input group
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <input type="text" class="input-field" id="${uniqueId}" 
                   placeholder="${categoryName}" inputmode="numeric" 
                   data-category="${categoryName}">
            <button type="button" class="remove-btn" onclick="removeCategoryField('${uniqueId}', '${categoryName}')" 
                    style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
        </div>
    `;
    
    // Add the new input group to the container
    addedFieldContainer.appendChild(inputGroup);
    
    // Add event listener to the new input field
    const newInput = document.getElementById(uniqueId);
    newInput.addEventListener('input', function() {
        const value = parseFloat(this.value) || 0;
        const categoryName = this.dataset.category;
        
        // Update contributionData
        contributionData.dynamicCategories[uniqueId] = {
            name: categoryName,
            amount: value
        };
        
        logFormData();
        
        // If user enters a value and there's no empty category field, show category selector
        if (value > 0 && !hasEmptyDynamicField()) {
            showCategorySelector();
        }
    });
    
    // Format number input
    newInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = value;
    });
}

// Function to check if there are any empty dynamic fields
function hasEmptyDynamicField() {
    const dynamicInputs = document.querySelectorAll('#added_field input[data-category]');
    for (let input of dynamicInputs) {
        if (!input.value || parseFloat(input.value) === 0) {
            return true;
        }
    }
    return false;
}

// Function to remove a category field
function removeCategoryField(fieldId, categoryName) {
    // Remove from contributionData
    delete contributionData.dynamicCategories[fieldId];
    
    // Remove the input group from DOM
    const field = document.getElementById(fieldId);
    if (field) {
        field.closest('.input-group').remove();
    }
    
    // If no dynamic fields remain, show the category selector
    const dynamicInputs = document.querySelectorAll('#added_field input[data-category]');
    if (dynamicInputs.length === 0) {
        showCategorySelector();
    }
    
    logFormData();
}

// Form 1 submission - updated to include dynamic categories
document.getElementById('contributionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get all static values
    contributionData.tithe = parseFloat(document.getElementById('tithe').value) || 0;
    contributionData.offering = parseFloat(document.getElementById('offering').value) || 0;
    contributionData.localBudget = parseFloat(document.getElementById('localBudget').value) || 0;
    contributionData.churchDevelopment = parseFloat(document.getElementById('churchDevelopment').value) || 0;
    contributionData.evangelism = parseFloat(document.getElementById('evangelism').value) || 0;
    
    // Calculate total including dynamic categories
    let dynamicTotal = 0;
    Object.values(contributionData.dynamicCategories).forEach(category => {
        dynamicTotal += category.amount;
    });
    
    contributionData.total = contributionData.tithe + contributionData.offering + contributionData.localBudget + 
                       contributionData.churchDevelopment + contributionData.evangelism + dynamicTotal;
    
    // Console log all form 1 data
    console.log('=== FORM 1 SUBMISSION ===');
    console.log('All Form 1 Fields:', contributionData);
    console.log('=========================');
    
    // Validate that at least one amount is entered
    if (contributionData.total <= 0) {
        alert('Please enter at least one contribution amount');
        return;
    }
    
    // Update receipt table
    updateReceiptTable();
    
    // Switch to form 2
    let form1 = document.getElementById('form1');
    let form2 = document.getElementById('form2');
    form1.classList.add('hidden');
    form2.classList.remove('hidden');

    //save history for back button functionality
    history.pushState({page: 'form2'}, "Form 2", "#form 2");
});

// Updated receipt table function to include dynamic categories
function updateReceiptTable() {
    const receiptBody = document.getElementById('receiptBody');
    const staticContributions = [
        { name: 'Tithe', amount: contributionData.tithe },
        { name: 'Offering', amount: contributionData.offering },
        { name: 'Local Church Budget', amount: contributionData.localBudget },
        { name: 'Church Development', amount: contributionData.churchDevelopment },
        { name: 'Evangelism', amount: contributionData.evangelism }
    ];
    
    let tableHTML = '';
    
    // Add rows for non-zero static amounts
    staticContributions.forEach(contribution => {
        if (contribution.amount > 0) {
            tableHTML += `
                <tr>
                    <td>${contribution.name}</td>
                    <td class="amount">${contribution.amount.toFixed(2)}</td>
                </tr>
            `;
        }
    });
    
    // Add rows for dynamic categories
    Object.values(contributionData.dynamicCategories).forEach(category => {
        if (category.amount > 0) {
            tableHTML += `
                <tr>
                    <td>${category.name}</td>
                    <td class="amount">${category.amount.toFixed(2)}</td>
                </tr>
            `;
        }
    });
    
    // Add total row
    tableHTML += `
        <tr class="receipt-total">
            <td><strong>Total</strong></td>
            <td class="amount"><strong>${contributionData.total.toFixed(2)}</strong></td>
        </tr>
    `;
    receiptBody.innerHTML = tableHTML;
}

//autofill phone and name automatically via local storage
document.getElementById('giverName').value = localStorage.getItem('nameStored') || "";
document.getElementById('mpesaNumber').value = localStorage.getItem('mpesaNumberStored') || "";

// Log form 2 inputs
function logForm2Data() {
    console.log('=== FORM 2 DATA UPDATE ===');
    console.log('Giver Name:', document.getElementById('giverName').value);
    console.log('Member Status:', document.getElementById('memberStatus').value);
    console.log('M-Pesa Number:', document.getElementById('mpesaNumber').value);
    console.log('==========================');
}

// Add event listeners for form 2
document.getElementById('giverName').addEventListener('input', logForm2Data);
document.getElementById('memberStatus').addEventListener('change', logForm2Data);
document.getElementById('mpesaNumber').addEventListener('input', logForm2Data);

// Form 2 submission (M-Pesa payment)
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('giverName').value;
    const memberStatus = document.getElementById('memberStatus').value;
    const mpesaNumber = document.getElementById('mpesaNumber').value;
    const giveBtn = document.getElementById('giveBtn');
    const messageContainer = document.getElementById('messageContainer');
    

    //set local storage for name and mpesa number

    localStorage.setItem('mpesaNumberStored', mpesaNumber);
    localStorage.setItem('nameStored', name);

    // Console log all form 2 data
    console.log('=== FORM 2 SUBMISSION ===');
    console.log('Giver Name:', name);
    console.log('Member Status:', memberStatus);
    console.log('M-Pesa Number:', mpesaNumber);
    console.log('Complete Contribution Data:', contributionData);
    console.log('=========================');
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(mpesaNumber)) {
        showMessage('Please enter a valid 10-digit M-Pesa number', 'error');
        return;
    }
    
    if (!name || !memberStatus) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    giveBtn.classList.add('loading');
    giveBtn.disabled = true;
    giveBtn.innerHTML = 'Processing...';
    
    // Clear any previous messages
    messageContainer.innerHTML = '';
    
    // Initiate actual Daraja STK Push
    initiateSTKPush(mpesaNumber, contributionData.total, name, memberStatus);
});

// Initiate STK Push using backend API
async function initiateSTKPush(phoneNumber, amount, name, memberStatus) {
    try {
        console.log('🚀 Initiating STK Push...');
        
        const response = await fetch(`${API_BASE_URL}/mpesa/stkpush`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                amount: amount,
                name: name,
                memberStatus: memberStatus,
                contributionData: contributionData
            })
        });

        const data = await response.json();
        console.log('STK Push Response:', data);

        if (data.success) {
            showMessage(`STK push sent to ${phoneNumber}. Please check your phone and enter your M-Pesa PIN to complete the payment of Ksh ${amount.toFixed(2)}`, 'success');
            
            console.log(`✅ STK Push sent successfully. Checkout ID: ${data.checkoutRequestId}`);
            
            // Start checking payment status immediately
            checkPaymentStatus(data.checkoutRequestId, name, amount);
        } else {
            console.error('❌ STK Push failed:', data);
            showMessage(`Payment initiation failed: ${data.message}`, 'error');
            resetGiveButton();
        }

    } catch (error) {
        console.error('❌ STK Push Error:', error);
        showMessage('Payment initiation failed. Please check your network connection and try again.', 'error');
        resetGiveButton();
    }
}

// IMPROVED: Check payment status with better error handling and logging
async function checkPaymentStatus(checkoutRequestId, name, amount) {
    console.log(`🔍 Starting payment status monitoring for: ${checkoutRequestId}`);
    
    const maxAttempts = 24; // Check for up to 2 minutes (24 attempts × 5 seconds)
    let attempts = 0;
    let statusCheckInterval;

    const checkStatus = async () => {
        try {
            attempts++;
            console.log(`🔄 Payment status check attempt ${attempts}/${maxAttempts} for ${checkoutRequestId}`);
            
            const response = await fetch(`${API_BASE_URL}/mpesa/payment-status/${checkoutRequestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Status check response not OK: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`📊 Status check response:`, data);

            if (data.success && data.data) {
                const paymentData = data.data;
                console.log(`📈 Payment status: ${paymentData.status}`);

                if (paymentData.status === 'completed') {
                    clearInterval(statusCheckInterval);
                    console.log('🎉 Payment completed successfully!');
                    
                    const receiptInfo = paymentData.mpesaReceiptNumber ? 
                        `Receipt: ${paymentData.mpesaReceiptNumber}` : 
                        'Receipt number will be available shortly';
                    
                    showMessage(
                        `✅ Payment of Ksh ${amount.toFixed(2)} received successfully! Thank you ${name} for your contribution to SDA Church. ${receiptInfo}`, 
                        'success'
                    );
                    
                    // Log the complete transaction details
                    console.log('=== PAYMENT COMPLETED ===');
                    console.log('Transaction Details:', paymentData);
                    console.log('=========================');
                    
                    resetGiveButton();
                    return;
                    
                } else if (paymentData.status === 'failed') {
                    clearInterval(statusCheckInterval);
                    console.log('❌ Payment failed');
                    
                    const errorMessage = paymentData.resultDesc || 'Transaction was cancelled or failed';
                    showMessage(`❌ Payment failed: ${errorMessage}`, 'error');
                    resetGiveButton();
                    return;
                    
                } else if (paymentData.status === 'pending') {
                    console.log(`⏳ Payment still pending... (attempt ${attempts}/${maxAttempts})`);
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(statusCheckInterval);
                        console.log('⏰ Payment status check timeout');
                        showMessage(
                            '⏰ Payment status check timeout. Please check your M-Pesa messages or contact support if payment was deducted.', 
                            'error'
                        );
                        resetGiveButton();
                    }
                    return;
                }
            } else {
                console.warn(`⚠️ Unexpected response format or payment not found:`, data);
                
                if (attempts >= maxAttempts) {
                    clearInterval(statusCheckInterval);
                    showMessage('Unable to verify payment status. Please contact support if payment was deducted.', 'error');
                    resetGiveButton();
                }
            }

        } catch (error) {
            console.error(`❌ Payment status check error (attempt ${attempts}):`, error);
            
            if (attempts >= maxAttempts) {
                clearInterval(statusCheckInterval);
                showMessage('Unable to verify payment status due to network issues. Please contact support if payment was deducted.', 'error');
                resetGiveButton();
            }
        }
    };

    // Start checking after 3 seconds (give time for the STK push to be processed)
    setTimeout(() => {
        console.log('🕐 Starting status monitoring...');
        checkStatus(); // First check
        statusCheckInterval = setInterval(checkStatus, 5000); // Then check every 5 seconds
    }, 3000);
}

// Alternative: Query STK status using Safaricom API (fallback method)
async function querySTKStatus(checkoutRequestId) {
    try {
        console.log('🔍 Querying STK status via Safaricom API...');
        
        const response = await fetch(`${API_BASE_URL}/mpesa/query-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                checkoutRequestId: checkoutRequestId
            })
        });

        const data = await response.json();
        console.log('STK Query Response:', data);
        
        return data;

    } catch (error) {
        console.error('STK Query Error:', error);
        return { success: false, error: error.message };
    }
}

function resetGiveButton() {
    const giveBtn = document.getElementById('giveBtn');
    giveBtn.classList.remove('loading');
    giveBtn.disabled = false;
    giveBtn.innerHTML = 'Give <span class="btn-arrow">→</span>';
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageClass = type === 'success' ? 'success-message' : 'error-message';
    
    messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
    
    // Auto-hide error messages after 10 seconds (increased from 5)
    if (type === 'error') {
        setTimeout(() => {
            if (messageContainer.innerHTML.includes(message)) {
                messageContainer.innerHTML = '';
            }
        }, 10000);
    }
    // Success messages stay visible until user action
}

// Format number inputs as user types
const numberInputs = ['tithe', 'offering', 'localBudget', 'churchDevelopment', 'evangelism'];

numberInputs.forEach(inputId => {
    document.getElementById(inputId).addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d.]/g, '');
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = value;
    });
});

// Format M-Pesa number input
document.getElementById('mpesaNumber').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    e.target.value = value;
});

// Handle browser back button
window.addEventListener("popstate", function(event) {
    if (event.state) {
        if (event.state.page === "form1") {
            document.getElementById('form2').classList.add("hidden");
            document.getElementById('form1').classList.remove("hidden");
        } else if (event.state.page === "form2") {
            document.getElementById('form1').classList.add("hidden");
            document.getElementById('form2').classList.remove("hidden");
        }
    } else {
        // Default to form1 if no state is set
        document.getElementById('form2').classList.add("hidden");
        document.getElementById('form1').classList.remove("hidden");
    }
});

// Debug function to check backend health
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/mpesa/health`);
        const data = await response.json();
        console.log('🏥 Backend Health Check:', data);
        return data;
    } catch (error) {
        console.error('❌ Backend Health Check Failed:', error);
        return { status: 'ERROR', error: error.message };
    }
}

// Call health check on page load for debugging
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Page loaded, checking backend health...');
    checkBackendHealth();
});

// Expose debug functions to global scope for console testing - REMOVED getAllDonations
window.debugMpesa = {
    checkHealth: checkBackendHealth,
    querySTKStatus: querySTKStatus
};
