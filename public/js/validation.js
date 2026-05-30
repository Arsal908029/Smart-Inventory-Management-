// Form validation
function validateProductForm() {
    const sku = document.getElementById('sku');
    const price = document.getElementById('price');
    const quantity = document.getElementById('quantity');
    
    if (sku && sku.value.trim() === '') {
        showError(sku, 'SKU is required');
        return false;
    }
    
    if (price && (parseFloat(price.value) <= 0 || isNaN(parseFloat(price.value)))) {
        showError(price, 'Price must be greater than 0');
        return false;
    }
    
    if (quantity && (parseInt(quantity.value) < 0 || isNaN(parseInt(quantity.value)))) {
        showError(quantity, 'Quantity cannot be negative');
        return false;
    }
    
    return true;
}

function validateOrderForm() {
    const customerName = document.getElementById('customerName');
    const items = document.querySelectorAll('.order-item');
    
    if (customerName && customerName.value.trim() === '') {
        showError(customerName, 'Customer name is required');
        return false;
    }
    
    if (items.length === 0) {
        alert('Please add at least one item to the order');
        return false;
    }
    
    return true;
}

function showError(input, message) {
    const formGroup = input.closest('.mb-3');
    const errorDiv = formGroup.querySelector('.invalid-feedback');
    
    input.classList.add('is-invalid');
    
    if (errorDiv) {
        errorDiv.textContent = message;
    } else {
        const div = document.createElement('div');
        div.className = 'invalid-feedback';
        div.textContent = message;
        formGroup.appendChild(div);
    }
    
    setTimeout(() => {
        input.classList.remove('is-invalid');
    }, 3000);
}

// Number formatting
function formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

// Date formatting
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    switch(format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'full':
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        default:
            return `${year}-${month}-${day}`;
    }
}
