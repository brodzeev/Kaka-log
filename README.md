# 🚽 KakiLogger - Family Stool Tracking Application

A modern, full-featured family health tracking application with role-based access control, multiple authentication methods, and comprehensive data analysis.

## ✨ Features

- **Multiple Authentication Methods**: Username/Password, Email/Password, Google OAuth, Apple Sign-In
- **Family Compartmentalization**: Separate accounts with role-based access (Adult/Child)
- **Calendar Tracking**: Click any date to add stool health logs
- **Data Visualization**: Charts, trends, and statistics with month navigation
- **Role-Based Permissions**: Adults see all family logs; Children see only their own
- **Persistent Sessions**: Auto-login with 24-hour expiration
- **Theme System**: 6 themes available (Light, Dark, Slate, Ocean, Forest, Sunset)
- **Responsive Design**: Mobile-friendly interface

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

## 🔐 Authentication

Supports 4 authentication methods:
1. **Username/Password (Legacy)** - Traditional username login
2. **Email/Password (Modern)** - Email-based registration
3. **Google OAuth** - Sign-in with Google account
4. **Apple Sign-In** - Sign-in with Apple ID

## 👨‍👩‍👧‍👦 Family Management

- Create family members with different roles (Adult/Child)
- Switch between family members in dropdown
- Adults see all family logs
- Children see only their own logs

## 📅 Logging

- Click any date to add a stool log
- Select type, time, and quantity
- Add multiple logs per day
- View existing logs and delete individual entries
- Navigate calendar month by month

## 📊 Analytics

- Scatter plot charts with month navigation
- Statistics: total logs, average time, common types
- Visual patterns and trends
- Role-based data filtering

## 🧪 Testing

All 7 API tests passing (100% success rate):
```bash
node test.js
```

Manual testing checklist available with 100+ test cases.

## 📁 Documentation

- **Full Guide**: [README_FULL.md](README_FULL.md)
- **Testing Plan**: [TESTING_PLAN.md](TESTING_PLAN.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Config**: [.env.example](.env.example)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 + React 18
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **Authentication**: Custom + OAuth 2.0

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🚀 Status

**Phase**: Production Ready ✅
**Version**: 1.0.0 (Option C - Complete Implementation)
**Tests**: 7/7 Passing ✅

## 📚 See Also

- [Full Documentation](README_FULL.md) - Complete feature overview
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production setup
- [Testing Plan](TESTING_PLAN.md) - Comprehensive test cases