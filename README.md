# 🏗️ Crane Inspection Management System

A modern web application for managing crane inspections and tracking expiration dates.

## ✨ Features

- 📊 Excel file upload and data processing
- 🎨 Modern, responsive UI with gradient backgrounds
- 📅 Expiration date tracking with color coding
- 📧 Email alerts for expiring cranes
- 🔍 Search and filter functionality
- 📱 Mobile-responsive design
- 🌐 Network-independent (works on any host/port)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crane-inspection-frontend
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   Create `.env` file in the backend directory:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Start backend only
   npm start
   
   # Start both frontend and backend (development)
   npm run dev
   ```

## 🌐 Deployment

### Local Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Production Deployment

#### Vercel (Frontend)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

#### Railway/Render (Backend)
1. Push your code to GitHub
2. Connect your repository to Railway/Render
3. Set environment variables
4. Deploy

#### Heroku
1. Create a `Procfile` in the root directory:
   ```
   web: cd backend && npm start
   ```
2. Set environment variables in Heroku dashboard
3. Deploy

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com
```

#### Backend (.env)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-url.com
PORT=5000
MONGODB_URI=your-mongodb-connection-string
```

## 📁 Project Structure

```
crane-inspection-frontend/
├── src/
│   ├── components/
│   │   ├── CraneTable.js
│   │   ├── CraneTable.css
│   │   └── ExcelUpload.js
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── HomePage.css
│   │   ├── SupervisorDashboard.jsx
│   │   └── SupervisorDashboard.css
│   └── config.js
├── backend/
│   ├── routes/
│   ├── models/
│   └── server.js
└── README.md
```

## 🎨 UI Features

- **Gradient Backgrounds**: Beautiful purple-blue gradients
- **Responsive Design**: Works on all screen sizes
- **Modern Buttons**: Hover effects and animations
- **Color-coded Status**: Red (expired), Orange (near expiry), Green (OK)
- **Professional Table Design**: Clean, modern table styling

## 🔧 Configuration

The application automatically detects the environment and configures API URLs accordingly:

- **Development**: Uses localhost URLs
- **Production**: Uses environment variables or auto-detects hostname
- **Any Port**: Works on ports 3000, 3001, 3002, etc.

## 📧 Email Configuration

To enable email alerts, configure your Gmail account:

1. Enable 2-factor authentication
2. Generate an App Password
3. Set `EMAIL_USER` and `EMAIL_PASS` in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Support

If you encounter any issues:
1. Check the console logs
2. Verify environment variables
3. Ensure MongoDB is running
4. Check network connectivity

---

**Made with ❤️ for efficient crane inspection management**
