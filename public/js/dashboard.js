// Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('active');
        });
    }
    
    // Highlight active link in sidebar
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
            link.classList.add('active');
            // Ensure standard class is replaced if active
            link.classList.remove('text-secondary');
            link.classList.add('text-white');
        }
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.classList.add('fade');
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });
});

// Delete confirmation
function confirmDelete(url, message = 'Are you sure you want to delete this item?') {
    if (confirm(message)) {
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred');
        });
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                if (this.value) {
                    params.set('search', this.value);
                } else {
                    params.delete('search');
                }
                window.location.search = params.toString();
            }, 500);
        });
    }
}

// Export functionality
function exportData(type) {
    const params = new URLSearchParams(window.location.search);
    params.set('export', type);
    window.location.href = window.location.pathname + '?' + params.toString();
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Check if the user is typing in an input field or textarea
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    
    // Ctrl + N or Alt + N: Create New Order
    if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.location.href = '/orders/create';
    }
    
    // Ctrl + P or Alt + P: Print Page / Invoice
    if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'p') {
        // Let the browser handle native print
    }
    
    // ESC: Clear search or focus
    if (e.key === 'Escape') {
        if (isInput) {
            e.target.blur();
            if (e.target.id === 'productSearch') {
                e.target.value = '';
                e.target.dispatchEvent(new Event('input')); // trigger filter update
            }
        }
    }
});
