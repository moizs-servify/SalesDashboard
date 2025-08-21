let salesChart;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log('Token found:', !!token);
    
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/';
        return;
    }

    console.log('Initializing dashboard...');
    initializeChart();
    loadFilterOptions();
    loadDashboardData();

    // Add event listeners for filters
    document.getElementById('brand-filter').addEventListener('change', updateDashboard);
    document.getElementById('subcategory-filter').addEventListener('change', updateDashboard);
    document.getElementById('time-filter').addEventListener('change', updateDashboard);
    document.getElementById('store-filter').addEventListener('change', updateDashboard);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Add event listeners for header controls
    document.getElementById('view-toggle').addEventListener('click', toggleView);
    document.getElementById('logout-btn').addEventListener('click', logout);
});

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log('Getting auth headers, token exists:', !!token);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Single toggle function for view switching
function toggleView() {
    const toggle = document.getElementById('view-toggle');
    const currentView = toggle.getAttribute('data-view');
    const salesText = document.getElementById('sales-text');
    const insightsText = document.getElementById('insights-text');
    
    if (currentView === 'sales') {
        // Switch to Insights
        toggle.setAttribute('data-view', 'insights');
        toggle.classList.remove('bg-primary');
        toggle.classList.add('bg-gray-200');
        
        // Hide Sales text and show Insights text
        salesText.classList.add('opacity-0');
        salesText.classList.remove('text-white');
        
        insightsText.classList.remove('opacity-0');
        insightsText.classList.add('text-white');
        
        console.log('Insights view activated');
        // Add your insights view logic here
        
    } else {
        // Switch to Sales
        toggle.setAttribute('data-view', 'sales');
        toggle.classList.remove('bg-gray-200');
        toggle.classList.add('bg-primary');
        
        // Show Sales text and hide Insights text
        salesText.classList.remove('opacity-0');
        salesText.classList.add('text-white');
        
        insightsText.classList.add('opacity-0');
        insightsText.classList.remove('text-white');
        
        console.log('Sales view activated');
        // Add your sales view logic here
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    window.location.href = '/';
}

function initializeChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');

    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Sales Volume',
                data: [],
                backgroundColor: 'rgba(67, 4, 155, 0.8)',
                borderColor: 'rgba(76, 219, 55, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sales Volume',
                        color: '#6B7280',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    },
                    grid: {
                        color: '#F3F4F6',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Product Categories',
                        color: '#6B7280',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

async function loadDashboardData() {
    try {
        const filters = getCurrentFilters();

        // Load sales data
        const salesResponse = await fetch(`/api/sales-data?${new URLSearchParams(filters)}`, {
            headers: getAuthHeaders()
        });
        const salesData = await salesResponse.json();

        // Load metrics
        const metricsResponse = await fetch(`/api/metrics?${new URLSearchParams(filters)}`, {
            headers: getAuthHeaders()
        });
        const metrics = await metricsResponse.json();

        updateChart(salesData);
        updateMetrics(metrics);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function getCurrentFilters() {
    return {
        brand: document.getElementById('brand-filter').value,
        productSubcategory: document.getElementById('subcategory-filter').value,
        timePeriod: document.getElementById('time-filter').value,
        store: document.getElementById('store-filter').value
    };
}

function updateChart(salesData) {
    // Group data by product subcategory
    const categoryData = {};

    salesData.forEach(item => {
        if (!categoryData[item.productSubcategory]) {
            categoryData[item.productSubcategory] = 0;
        }
        categoryData[item.productSubcategory] += item.sales;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    // Update chart
    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = data;
    salesChart.update('active');
}

function updateMetrics(metrics) {
    // Update metric values
    document.getElementById('total-sales').textContent = metrics.totalSales.toLocaleString();
    document.getElementById('total-revenue').textContent = `$${metrics.totalRevenue.toLocaleString()}`;
    document.getElementById('avg-order-value').textContent = `$${metrics.averageOrderValue.toLocaleString()}`;
    document.getElementById('total-orders').textContent = metrics.totalOrders.toLocaleString();

    // Update trends if available
    if (metrics.trends) {
        updateTrendDisplay('total-sales-trend', metrics.trends.salesTrend);
        updateTrendDisplay('total-revenue-trend', metrics.trends.revenueTrend);
        updateTrendDisplay('avg-order-value-trend', metrics.trends.aovTrend);
        updateTrendDisplay('total-orders-trend', metrics.trends.ordersTrend);
    }
}

function updateTrendDisplay(elementId, trendValue) {
    const trendElement = document.getElementById(elementId);
    const span = trendElement.querySelector('span');
    const svg = trendElement.querySelector('svg');

    const isPositive = trendValue >= 0;
    const formattedTrend = `${isPositive ? '+' : ''}${trendValue.toFixed(1)}%`;

    span.textContent = formattedTrend;

    if (isPositive) {
        span.className = 'text-green-500 text-sm font-medium';
        svg.className = 'w-4 h-4 text-green-500';
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>';
    } else {
        span.className = 'text-red-500 text-sm font-medium';
        svg.className = 'w-4 h-4 text-red-500';
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>';
    }
}

function updateDashboard() {
    loadDashboardData();
}

function resetFilters() {
    document.getElementById('brand-filter').value = 'all';
    document.getElementById('subcategory-filter').value = 'all';
    document.getElementById('time-filter').value = 'indefinite';
    document.getElementById('store-filter').value = 'all';

    loadDashboardData();
}

// Format numbers for better readability
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Load filter options dynamically from database
async function loadFilterOptions() {
    try {
        console.log('Loading filter options...');
        const response = await fetch('/api/filter-options', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            console.error('Filter options error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }
        
        const options = await response.json();

        // Update brand filter
        const brandFilter = document.getElementById('brand-filter');
        brandFilter.innerHTML = '<option value="all">All Brands</option>';
        options.brands.forEach(brand => {
            brandFilter.innerHTML += `<option value="${brand}">${brand}</option>`;
        });

        // Update subcategory filter
        const subcategoryFilter = document.getElementById('subcategory-filter');
        subcategoryFilter.innerHTML = '<option value="all">All Categories</option>';
        options.productSubcategories.forEach(subcategory => {
            subcategoryFilter.innerHTML += `<option value="${subcategory}">${subcategory}</option>`;
        });

        // Update store filter
        const storeFilter = document.getElementById('store-filter');
        storeFilter.innerHTML = '<option value="all">All Stores</option>';
        options.stores.forEach(store => {
            storeFilter.innerHTML += `<option value="${store}">${store}</option>`;
        });

    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}