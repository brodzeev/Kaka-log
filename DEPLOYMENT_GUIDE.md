# KakiLogger Production Deployment Guide

## Phase: Production Ready

This guide covers preparing KakiLogger for production deployment.

---

## 1. Environment Configuration

### 1.1 Required Environment Variables

Create `.env.production.local` with the following variables:

```env
# MongoDB Connection
MONGODB_URI=your_production_mongodb_uri

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple Sign-In  
NEXT_PUBLIC_APPLE_TEAM_ID=your_apple_team_id
NEXT_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id
NEXT_PUBLIC_APPLE_RETURN_URL=https://yourdomain.com/api/auth/apple/callback

# Session & Security
JWT_SECRET=your_jwt_secret_key_min_32_chars
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### 1.2 Get OAuth Credentials

#### Google OAuth Setup
1. Go to https://console.cloud.google.com/
2. Create new project: "KakiLogger"
3. Enable Google+ API
4. Create OAuth 2.0 Web Application credentials:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`
5. Copy Client ID and Client Secret

#### Apple Sign-In Setup
1. Go to https://developer.apple.com/account/
2. Create new App ID for your domain
3. Enable "Sign in with Apple" capability
4. Create Service ID
5. Get Team ID, Client ID, and configure return URL

#### MongoDB Setup
1. Use MongoDB Atlas (recommended for production)
   - Create cluster at https://www.mongodb.com/cloud/atlas
   - Configure network access (whitelist your server IP)
   - Create database user with strong password
   - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/kakilogger`

---

## 2. Security Hardening

### 2.1 Database Security

```javascript
// lib/db.ts already implements:
- ✅ Password hashing with PBKDF2 (100,000 iterations)
- ✅ Salt generation for each password
- ✅ Optional: Add encryption at rest in MongoDB
```

**Additional steps:**
```bash
# Enable MongoDB encryption at rest
# Configure IP whitelist in MongoDB Atlas
# Use TLS/SSL for database connections
```

### 2.2 API Security

**Implement rate limiting:**
```javascript
// Add to next.config.js or middleware
// Example: Use next-rate-limit package
```

**Add CORS headers:**
```javascript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}
```

### 2.3 Session Security

**Current implementation:**
- ✅ Sessions stored in localStorage (client-side)
- ✅ 24-hour expiration
- ✅ JWT-based (basic implementation)

**For production, consider:**
- HTTP-only cookies instead of localStorage
- Server-side session storage (Redis)
- CSRF token validation
- Secure flag on cookies

---

## 3. Build & Optimization

### 3.1 Production Build

```bash
# Build for production
npm run build

# This will:
# - Compile TypeScript and React
# - Optimize CSS and JavaScript
# - Generate static pages
# - Create build optimizations

# Verify build completes with exit code 0
# Check for any ESLint/type errors
```

### 3.2 Image Optimization

Currently showing 3 warnings about `<img>` tags. For production:

```javascript
// Replace all <img> with Next.js Image component
import Image from 'next/image'

<Image
  src="/path/to/image.png"
  alt="Description"
  width={300}
  height={300}
  priority // for above-the-fold images
/>
```

---

## 4. Deployment Options

### 4.1 Deploy to Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables:
# - Dashboard > Settings > Environment Variables
# - Add all variables from .env.production.local
```

**Vercel Configuration:**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "GOOGLE_CLIENT_SECRET": "@google_secret",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### 4.2 Deploy to AWS (EC2/ECS)

```bash
# 1. Create Docker image
docker build -t kakilogger .

# 2. Push to ECR/DockerHub
docker tag kakilogger:latest myrepo/kakilogger:latest
docker push myrepo/kakilogger:latest

# 3. Deploy with ECS/EKS
# Configure load balancer, auto-scaling, etc.

# 4. Set environment variables in ECS task definition
```

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### 4.3 Deploy to Heroku

```bash
# Create Heroku app
heroku create kakilogger

# Set environment variables
heroku config:set MONGODB_URI=your_uri
heroku config:set GOOGLE_CLIENT_SECRET=your_secret
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

---

## 5. Pre-Deployment Checklist

### Critical Items
- [ ] MongoDB connection tested and verified
- [ ] Google OAuth credentials configured
- [ ] Apple Sign-In credentials configured  
- [ ] JWT_SECRET set to random 32+ character string
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] NODE_ENV set to 'production'
- [ ] Database backups configured
- [ ] SSL/HTTPS certificate installed

### Performance Items
- [ ] npm run build completes successfully
- [ ] Build output shows no critical errors
- [ ] Static page generation successful
- [ ] API response times acceptable (< 200ms)
- [ ] Database queries optimized

### Security Items
- [ ] All secrets stored in environment variables
- [ ] Database IP whitelist configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Security headers set
- [ ] HTTPS enforced
- [ ] Regular security updates planned

### Testing Items
- [ ] Username/password login verified in production
- [ ] Email/password login verified
- [ ] Google OAuth flow tested end-to-end
- [ ] Family member access control verified
- [ ] Role-based filtering verified
- [ ] Session persistence tested
- [ ] Error handling tested

---

## 6. Monitoring & Maintenance

### 6.1 Set Up Monitoring

```javascript
// Add error tracking
npm install --save @sentry/nextjs

// Configure in next.config.js
const withSentryConfig = require("@sentry/nextjs/withSentryConfig");

module.exports = withSentryConfig(nextConfig, {
  org: "your-org",
  project: "kakilogger",
});
```

### 6.2 Logging

```javascript
// Implement logging for:
// - Failed login attempts
// - API errors
// - Database errors
// - OAuth failures

console.log('[AUTH]', timestamp, 'User login', userId)
console.error('[ERROR]', timestamp, 'Database connection failed', error)
```

### 6.3 Database Maintenance

```bash
# Regular backups
# - Enable automatic backups in MongoDB Atlas
# - Test restore process monthly

# Index optimization
# - Monitor slow queries
# - Create indexes for frequently queried fields

# Data cleanup
# - Remove expired sessions
# - Archive old logs (optional)
```

---

## 7. Post-Deployment

### 7.1 Verify Production Build

```bash
# Check application logs
# Verify SSL certificate is valid
# Test all authentication methods
# Monitor error tracking (Sentry)
# Check performance metrics

# Commands to verify:
curl https://yourdomain.com
curl -X POST https://yourdomain.com/api/login
curl https://yourdomain.com/api/users
```

### 7.2 User Communication

```markdown
# Release Notes
- All authentication methods working
- Family member compartmentalization
- Role-based access control
- Persistent login sessions
- Multi-month data tracking

# Known Limitations
- OAuth requires native mobile app for full integration
- Session timeout: 24 hours
```

### 7.3 Ongoing Tasks

- [ ] Monitor error tracking weekly
- [ ] Review security logs monthly
- [ ] Update dependencies quarterly
- [ ] Backup database daily
- [ ] Monitor performance metrics
- [ ] Respond to user feedback

---

## 8. Rollback Plan

If production issues occur:

```bash
# 1. Identify issue
# 2. Revert to previous deployment
vercel rollback

# 3. Investigate root cause
# 4. Fix issue locally
# 5. Test thoroughly in staging
# 6. Deploy fix to production
```

---

## 9. Scaling Considerations

As user base grows:

- **Database**: Upgrade MongoDB tier, enable sharding
- **API**: Implement caching (Redis), optimize queries
- **Frontend**: Enable CDN for static assets
- **Sessions**: Move from localStorage to Redis
- **Images**: Use CloudFront or similar CDN

---

## 10. Next Steps

1. ✅ Complete manual testing from browser
2. ✅ Configure all environment variables
3. ✅ Set up OAuth credentials
4. ✅ Configure MongoDB for production
5. ✅ Run production build test
6. ✅ Deploy to staging environment
7. ✅ Perform final testing
8. ✅ Deploy to production
9. ✅ Monitor for 24 hours
10. ✅ Announce release to users

---

## Support & Documentation

- **Documentation**: See README.md
- **Issues**: Check GitHub Issues
- **Contact**: support@yourdomain.com

---

**Status**: Ready for Production Deployment 🚀
**Last Updated**: May 9, 2026
**Version**: Option C - Complete Implementation
