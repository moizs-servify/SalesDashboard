import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import mysql.connector
from datetime import datetime, timedelta
import hashlib
import os
from typing import Dict, List, Optional
import json

# Page configuration
st.set_page_config(
    page_title="Servify Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #43049b, #4cdb37);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        color: white;
    }
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        border: 2px solid #4cdb37;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .metric-value {
        font-size: 2rem;
        font-weight: bold;
        color: #43049b;
    }
    .metric-label {
        color: #6b7280;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .trend-positive {
        color: #10b981;
    }
    .trend-negative {
        color: #ef4444;
    }
    .filter-section {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        border: 2px solid #4cdb37;
        margin-bottom: 2rem;
    }
    .chart-container {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        border: 2px solid #4cdb37;
    }
</style>
""", unsafe_allow_html=True)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'servify_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as e:
        st.error(f"Database connection error: {e}")
        return None

def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def authenticate_user(email: str, password: str) -> bool:
    """Authenticate user with email and password"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor(dictionary=True)
        hashed_password = hash_password(password)
        
        query = "SELECT * FROM users WHERE email = %s AND password = %s"
        cursor.execute(query, (email, hashed_password))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return user is not None
    except mysql.connector.Error as e:
        st.error(f"Authentication error: {e}")
        return False

def get_filter_options() -> Dict[str, List[str]]:
    """Get filter options from database"""
    connection = get_db_connection()
    if not connection:
        return {'brands': [], 'productSubcategories': [], 'stores': []}
    
    try:
        cursor = connection.cursor()
        
        # Get brands
        cursor.execute("SELECT DISTINCT brand FROM sales_data WHERE brand IS NOT NULL ORDER BY brand")
        brands = [row[0] for row in cursor.fetchall()]
        
        # Get product subcategories
        cursor.execute("SELECT DISTINCT productSubcategory FROM sales_data WHERE productSubcategory IS NOT NULL ORDER BY productSubcategory")
        subcategories = [row[0] for row in cursor.fetchall()]
        
        # Get stores
        cursor.execute("SELECT DISTINCT store FROM sales_data WHERE store IS NOT NULL ORDER BY store")
        stores = [row[0] for row in cursor.fetchall()]
        
        cursor.close()
        connection.close()
        
        return {
            'brands': brands,
            'productSubcategories': subcategories,
            'stores': stores
        }
    except mysql.connector.Error as e:
        st.error(f"Error loading filter options: {e}")
        return {'brands': [], 'productSubcategories': [], 'stores': []}

def get_sales_data(filters: Dict) -> pd.DataFrame:
    """Get sales data based on filters"""
    connection = get_db_connection()
    if not connection:
        return pd.DataFrame()
    
    try:
        # Build WHERE clause based on filters
        where_conditions = []
        params = []
        
        if filters.get('brand') and filters['brand'] != 'all':
            where_conditions.append("brand = %s")
            params.append(filters['brand'])
        
        if filters.get('productSubcategory') and filters['productSubcategory'] != 'all':
            where_conditions.append("productSubcategory = %s")
            params.append(filters['productSubcategory'])
        
        if filters.get('store') and filters['store'] != 'all':
            where_conditions.append("store = %s")
            params.append(filters['store'])
        
        if filters.get('timePeriod') and filters['timePeriod'] != 'indefinite':
            if filters['timePeriod'] == 'daily':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)")
            elif filters['timePeriod'] == 'weekly':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)")
            elif filters['timePeriod'] == 'monthly':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        query = f"""
        SELECT 
            productSubcategory,
            SUM(sales) as total_sales,
            SUM(revenue) as total_revenue,
            COUNT(*) as order_count
        FROM sales_data 
        WHERE {where_clause}
        GROUP BY productSubcategory
        ORDER BY total_sales DESC
        """
        
        df = pd.read_sql(query, connection, params=params)
        connection.close()
        return df
        
    except mysql.connector.Error as e:
        st.error(f"Error loading sales data: {e}")
        return pd.DataFrame()

def get_metrics(filters: Dict) -> Dict:
    """Get dashboard metrics based on filters"""
    connection = get_db_connection()
    if not connection:
        return {
            'totalSales': 0,
            'totalRevenue': 0,
            'averageOrderValue': 0,
            'totalOrders': 0
        }
    
    try:
        # Build WHERE clause based on filters
        where_conditions = []
        params = []
        
        if filters.get('brand') and filters['brand'] != 'all':
            where_conditions.append("brand = %s")
            params.append(filters['brand'])
        
        if filters.get('productSubcategory') and filters['productSubcategory'] != 'all':
            where_conditions.append("productSubcategory = %s")
            params.append(filters['productSubcategory'])
        
        if filters.get('store') and filters['store'] != 'all':
            where_conditions.append("store = %s")
            params.append(filters['store'])
        
        if filters.get('timePeriod') and filters['timePeriod'] != 'indefinite':
            if filters['timePeriod'] == 'daily':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)")
            elif filters['timePeriod'] == 'weekly':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)")
            elif filters['timePeriod'] == 'monthly':
                where_conditions.append("date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        query = f"""
        SELECT 
            SUM(sales) as total_sales,
            SUM(revenue) as total_revenue,
            COUNT(*) as total_orders,
            AVG(revenue) as avg_order_value
        FROM sales_data 
        WHERE {where_clause}
        """
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return {
            'totalSales': result['total_sales'] or 0,
            'totalRevenue': result['total_revenue'] or 0,
            'averageOrderValue': result['avg_order_value'] or 0,
            'totalOrders': result['total_orders'] or 0
        }
        
    except mysql.connector.Error as e:
        st.error(f"Error loading metrics: {e}")
        return {
            'totalSales': 0,
            'totalRevenue': 0,
            'averageOrderValue': 0,
            'totalOrders': 0
        }

def create_sales_chart(df: pd.DataFrame):
    """Create sales chart using Plotly"""
    if df.empty:
        st.warning("No data available for the selected filters.")
        return
    
    fig = px.bar(
        df,
        x='productSubcategory',
        y='total_sales',
        title='Sales by Category',
        color='total_sales',
        color_continuous_scale=['#43049b', '#4cdb37'],
        labels={'total_sales': 'Sales Volume', 'productSubcategory': 'Product Categories'}
    )
    
    fig.update_layout(
        plot_bgcolor='white',
        paper_bgcolor='white',
        font=dict(color='#6b7280'),
        xaxis=dict(
            title_font=dict(size=12, color='#6b7280'),
            tickfont=dict(size=11, color='#6b7280'),
            gridcolor='#f3f4f6'
        ),
        yaxis=dict(
            title_font=dict(size=12, color='#6b7280'),
            tickfont=dict(size=11, color='#6b7280'),
            gridcolor='#f3f4f6'
        ),
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)

def display_metrics(metrics: Dict):
    """Display metrics in cards"""
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{metrics['totalSales']:,.0f}</div>
            <div class="metric-label">Total Sales</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">${metrics['totalRevenue']:,.0f}</div>
            <div class="metric-label">Total Revenue</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">${metrics['averageOrderValue']:,.0f}</div>
            <div class="metric-label">Average Order Value</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{metrics['totalOrders']:,.0f}</div>
            <div class="metric-label">Total Orders</div>
        </div>
        """, unsafe_allow_html=True)

def main():
    """Main application function"""
    
    # Initialize session state
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    
    if 'current_view' not in st.session_state:
        st.session_state.current_view = 'sales'
    
    # Authentication page
    if not st.session_state.authenticated:
        st.markdown("""
        <div class="main-header">
            <h1 style="text-align: center; margin: 0;">Servify Dashboard</h1>
            <p style="text-align: center; margin: 0.5rem 0 0 0;">Sign in to your account</p>
        </div>
        """, unsafe_allow_html=True)
        
        with st.form("login_form"):
            email = st.text_input("Email", placeholder="Enter your email")
            password = st.text_input("Password", type="password", placeholder="Enter your password")
            remember_me = st.checkbox("Remember me")
            
            if st.form_submit_button("Sign In"):
                if authenticate_user(email, password):
                    st.session_state.authenticated = True
                    st.rerun()
                else:
                    st.error("Invalid email or password")
        
        return
    
    # Main dashboard
    st.markdown("""
    <div class="main-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1 style="margin: 0;">Servify Dashboard</h1>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button onclick="window.location.reload()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Refresh</button>
                <button onclick="window.location.href='?logout=true'" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Logout</button>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Check for logout
    if st.query_params.get("logout"):
        st.session_state.authenticated = False
        st.rerun()
    
    # View toggle
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        view_option = st.selectbox(
            "Select View",
            ["Sales", "Insights"],
            index=0 if st.session_state.current_view == 'sales' else 1,
            key="view_selector"
        )
        st.session_state.current_view = view_option.lower()
    
    # Filters section
    st.markdown('<div class="filter-section">', unsafe_allow_html=True)
    st.subheader("Filters")
    
    filter_options = get_filter_options()
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        brand_filter = st.selectbox(
            "Brand",
            ["All Brands"] + filter_options['brands'],
            key="brand_filter"
        )
    
    with col2:
        category_filter = st.selectbox(
            "Product Category",
            ["All Categories"] + filter_options['productSubcategories'],
            key="category_filter"
        )
    
    with col3:
        time_filter = st.selectbox(
            "Time Period",
            ["All Time", "Last Day", "Last Week", "Last Month"],
            key="time_filter"
        )
    
    with col4:
        store_filter = st.selectbox(
            "Store",
            ["All Stores"] + filter_options['stores'],
            key="store_filter"
        )
    
    with col5:
        if st.button("Reset Filters", key="reset_filters"):
            st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Prepare filters
    filters = {
        'brand': brand_filter if brand_filter != "All Brands" else 'all',
        'productSubcategory': category_filter if category_filter != "All Categories" else 'all',
        'timePeriod': {
            "All Time": "indefinite",
            "Last Day": "daily",
            "Last Week": "weekly",
            "Last Month": "monthly"
        }[time_filter],
        'store': store_filter if store_filter != "All Stores" else 'all'
    }
    
    # Load data
    sales_data = get_sales_data(filters)
    metrics = get_metrics(filters)
    
    # Display metrics
    display_metrics(metrics)
    
    # Display chart
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.subheader("Sales by Category")
    create_sales_chart(sales_data)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Insights view (placeholder for future development)
    if st.session_state.current_view == 'insights':
        st.info("Insights view coming soon! This will include advanced analytics and predictive features.")

if __name__ == "__main__":
    main()
