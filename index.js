const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'servify_db',
    port: process.env.DB_PORT || 3306
};

// Create database connection
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// JWT Secret (in production, use a strong secret from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve dashboard page (protected)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Login API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Query user from database
        const query = 'SELECT * FROM users WHERE email = ?';
        connection.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get filter options API
app.get('/api/filter-options', authenticateToken, (req, res) => {
    try {
        // Get brands
        connection.query('SELECT DISTINCT brand FROM sales_data WHERE brand IS NOT NULL ORDER BY brand', (err, brandResults) => {
            if (err) {
                console.error('Brand query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get product subcategories
            connection.query('SELECT DISTINCT productSubcategory FROM sales_data WHERE productSubcategory IS NOT NULL ORDER BY productSubcategory', (err, subcategoryResults) => {
                if (err) {
                    console.error('Subcategory query error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Get stores
                connection.query('SELECT DISTINCT store FROM sales_data WHERE store IS NOT NULL ORDER BY store', (err, storeResults) => {
                    if (err) {
                        console.error('Store query error:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                        brands: brandResults.map(row => row.brand),
                        productSubcategories: subcategoryResults.map(row => row.productSubcategory),
                        stores: storeResults.map(row => row.store)
                    });
                });
            });
        });
    } catch (error) {
        console.error('Filter options error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales data API
app.get('/api/sales-data', authenticateToken, (req, res) => {
    try {
        const { brand, productSubcategory, timePeriod, store } = req.query;

        let whereConditions = [];
        let params = [];

        if (brand && brand !== 'all') {
            whereConditions.push('brand = ?');
            params.push(brand);
        }

        if (productSubcategory && productSubcategory !== 'all') {
            whereConditions.push('productSubcategory = ?');
            params.push(productSubcategory);
        }

        if (store && store !== 'all') {
            whereConditions.push('store = ?');
            params.push(store);
        }

        if (timePeriod && timePeriod !== 'indefinite') {
            switch (timePeriod) {
                case 'daily':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)');
                    break;
                case 'weekly':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
                    break;
                case 'monthly':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
            SELECT 
                productSubcategory,
                SUM(sales) as sales,
                SUM(revenue) as revenue,
                COUNT(*) as orderCount
            FROM sales_data 
            ${whereClause}
            GROUP BY productSubcategory
            ORDER BY sales DESC
        `;

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('Sales data query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(results);
        });
    } catch (error) {
        console.error('Sales data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get metrics API
app.get('/api/metrics', authenticateToken, (req, res) => {
    try {
        const { brand, productSubcategory, timePeriod, store } = req.query;

        let whereConditions = [];
        let params = [];

        if (brand && brand !== 'all') {
            whereConditions.push('brand = ?');
            params.push(brand);
        }

        if (productSubcategory && productSubcategory !== 'all') {
            whereConditions.push('productSubcategory = ?');
            params.push(productSubcategory);
        }

        if (store && store !== 'all') {
            whereConditions.push('store = ?');
            params.push(store);
        }

        if (timePeriod && timePeriod !== 'indefinite') {
            switch (timePeriod) {
                case 'daily':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)');
                    break;
                case 'weekly':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
                    break;
                case 'monthly':
                    whereConditions.push('date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
            SELECT 
                SUM(sales) as totalSales,
                SUM(revenue) as totalRevenue,
                COUNT(*) as totalOrders,
                AVG(revenue) as averageOrderValue
            FROM sales_data 
            ${whereClause}
        `;

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('Metrics query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const metrics = results[0];
            
            // Calculate trends (placeholder - you can implement actual trend calculation)
            const trends = {
                salesTrend: 0,
                revenueTrend: 0,
                aovTrend: 0,
                ordersTrend: 0
            };

            res.json({
                totalSales: metrics.totalSales || 0,
                totalRevenue: metrics.totalRevenue || 0,
                totalOrders: metrics.totalOrders || 0,
                averageOrderValue: metrics.averageOrderValue || 0,
                trends
            });
        });
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout API
app.post('/api/logout', authenticateToken, (req, res) => {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({ message: 'Logged out successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    connection.end((err) => {
        if (err) {
            console.error('Error closing database connection:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
