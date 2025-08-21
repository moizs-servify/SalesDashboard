# Servify Login System

A modern, responsive login page with authentication functionality for the Servify service management platform.

## Features

### Login Page (`index.html`)
- **Modern Design**: Clean, professional interface with gradient backgrounds and glassmorphism effects
- **Form Validation**: Real-time email and password validation
- **Password Toggle**: Show/hide password functionality
- **Remember Me**: Option to stay logged in
- **Social Login**: Placeholder buttons for Google and GitHub authentication
- **Sign Up Modal**: User registration form with validation
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### Dashboard (`dashboard.html`)
- **Protected Route**: Only accessible after successful authentication
- **User Welcome**: Displays personalized welcome message
- **Service Management**: Sample dashboard with key metrics
- **Interactive Elements**: Hover effects and animations
- **Logout Functionality**: Secure logout with session clearing

## Demo Credentials

You can test the login system with these pre-configured accounts:

### Admin Account
- **Email**: `admin@servify.com`
- **Password**: `admin123`

### Demo Account
- **Email**: `demo@servify.com`
- **Password**: `demo123`

## How to Use

1. **Open the Login Page**: Open `index.html` in your web browser
2. **Login**: Use one of the demo credentials above
3. **Dashboard**: After successful login, you'll be redirected to the dashboard
4. **Logout**: Click the logout button in the dashboard header

## File Structure

```
SalesDashboard/
├── index.html          # Login page
├── styles.css          # Login page styles
├── script.js           # Login page functionality
├── dashboard.html      # Dashboard page
├── dashboard.css       # Dashboard styles
├── dashboard.js        # Dashboard functionality
├── assets/             # Image assets
└── README.md           # This file
```

## Technical Details

### Authentication
- **Client-side Authentication**: Uses localStorage/sessionStorage for token management
- **Mock Database**: In-memory user database for demonstration
- **Token Generation**: Simple base64 encoding for demo purposes
- **Session Management**: Supports both persistent (localStorage) and session (sessionStorage) storage

### Security Features
- **Input Validation**: Email format and password strength validation
- **Error Handling**: User-friendly error messages
- **Session Protection**: Dashboard redirects to login if not authenticated
- **Secure Logout**: Clears all authentication data

### UI/UX Features
- **Loading States**: Visual feedback during authentication
- **Success Notifications**: Toast-style success messages
- **Error States**: Clear error indication with auto-dismiss
- **Keyboard Shortcuts**: Ctrl/Cmd + Enter to submit forms
- **Accessibility**: Proper labels and semantic HTML

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Customization

### Adding New Users
Edit the `users` array in `script.js`:

```javascript
const users = [
    {
        email: 'your-email@example.com',
        password: 'your-password',
        name: 'Your Name'
    }
    // ... existing users
];
```

### Styling
- Modify `styles.css` for login page styling
- Modify `dashboard.css` for dashboard styling
- Color scheme uses CSS custom properties for easy theming

### Backend Integration
To integrate with a real backend:

1. Replace the mock authentication in `script.js` with actual API calls
2. Implement proper JWT token handling
3. Add server-side session management
4. Implement proper password hashing and security measures

## Development

This is a frontend-only implementation for demonstration purposes. In a production environment, you would need:

- Backend API for authentication
- Database for user management
- Proper security measures (HTTPS, CSRF protection, etc.)
- Password hashing and salting
- Rate limiting and brute force protection

## License

This project is for educational and demonstration purposes.