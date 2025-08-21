# Servify Dashboard - Streamlit Deployment

This is the Streamlit version of the Servify Sales Dashboard, converted from the original Node.js/Express application.

## Features

- 🔐 **User Authentication**: Secure login system with database authentication
- 📊 **Interactive Dashboard**: Real-time sales metrics and visualizations
- 🔍 **Advanced Filtering**: Filter by brand, category, time period, and store
- 📈 **Data Visualization**: Interactive charts using Plotly
- 🎨 **Modern UI**: Responsive design with custom styling
- 🔄 **Real-time Updates**: Dynamic data loading and filtering

## Prerequisites

- Python 3.8 or higher
- MySQL database with the required tables
- Required Python packages (see `requirements.txt`)

## Installation

1. **Clone or download the project files**

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env`
   - Update the database configuration in `.env`:
   ```bash
   cp env.example .env
   ```

4. **Configure your database**:
   - Ensure your MySQL database is running
   - Update the database connection details in `.env`
   - Make sure you have the required tables (`users`, `sales_data`)

## Database Schema

The app expects the following database structure:

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sales Data Table
```sql
CREATE TABLE sales_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    brand VARCHAR(255),
    productSubcategory VARCHAR(255),
    store VARCHAR(255),
    sales INT,
    revenue DECIMAL(10,2),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Application

### Local Development
```bash
streamlit run streamlit_app.py
```

### Production Deployment
```bash
streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `` |
| `DB_NAME` | Database name | `servify_db` |
| `DB_PORT` | Database port | `3306` |

## Deployment Options

### Streamlit Cloud
1. Push your code to GitHub
2. Connect your repository to [Streamlit Cloud](https://streamlit.io/cloud)
3. Set environment variables in the Streamlit Cloud dashboard
4. Deploy

### Heroku
1. Create a `Procfile`:
   ```
   web: streamlit run streamlit_app.py --server.port=$PORT --server.address=0.0.0.0
   ```
2. Set environment variables in Heroku dashboard
3. Deploy using Heroku CLI or GitHub integration

### Docker
1. Create a `Dockerfile`:
   ```dockerfile
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   EXPOSE 8501
   CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
   ```
2. Build and run:
   ```bash
   docker build -t servify-dashboard .
   docker run -p 8501:8501 servify-dashboard
   ```

## Features Comparison

| Feature | Original (Node.js) | Streamlit Version |
|---------|-------------------|-------------------|
| Authentication | ✅ | ✅ |
| Dashboard Metrics | ✅ | ✅ |
| Interactive Charts | ✅ | ✅ |
| Filtering | ✅ | ✅ |
| Responsive Design | ✅ | ✅ |
| Real-time Updates | ✅ | ✅ |
| Insights View | 🔄 | 🔄 (Coming Soon) |

## Customization

### Styling
- Modify the CSS in the `st.markdown()` section of `streamlit_app.py`
- Update the theme colors in `.streamlit/config.toml`

### Charts
- The app uses Plotly for visualizations
- Modify the `create_sales_chart()` function to change chart types or styling

### Database Queries
- Update the SQL queries in the data functions to match your schema
- Add new metrics by modifying the `get_metrics()` function

## Troubleshooting

### Database Connection Issues
- Verify your database credentials in `.env`
- Ensure MySQL server is running
- Check if the database and tables exist

### Import Errors
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version compatibility

### Authentication Issues
- Verify the `users` table exists and has the correct schema
- Ensure passwords are hashed using SHA-256

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your database configuration
3. Ensure all dependencies are properly installed

## License

This project is part of the Servify Dashboard application.
