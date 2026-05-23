# KakiLogger Phase 3: Testing Plan

## 1. USERNAME/PASSWORD (Legacy) AUTHENTICATION

### 1.1 Registration
- [ ] Register new user with username only
- [ ] Verify user created in database
- [ ] Verify password is hashed (not plaintext)
- [ ] Verify error when username already exists
- [ ] Verify error when username or password missing
- [ ] Verify session saved to localStorage after registration
- [ ] Verify auto-login after registration

### 1.2 Login
- [ ] Login with correct username/password
- [ ] Verify session restored from localStorage on page reload
- [ ] Login with incorrect password shows error
- [ ] Login with non-existent username shows error
- [ ] Verify user data loaded (name, familyMembers, role)
- [ ] Verify theme preference restored
- [ ] Verify default theme 'light' if not set

### 1.3 Logout
- [ ] Logout clears localStorage session
- [ ] Logout requires re-login on next visit
- [ ] Verify all user data cleared from state

---

## 2. EMAIL/PASSWORD (Modern) AUTHENTICATION

### 2.1 Registration
- [ ] Register new user with email
- [ ] Verify email is stored in user record
- [ ] Verify password is hashed
- [ ] Verify error when email already exists
- [ ] Verify error when any field missing
- [ ] Verify session saved and auto-login works
- [ ] Login with email (not username) works

### 2.2 Login
- [ ] Login with email + password
- [ ] Verify session restored on page reload
- [ ] Incorrect email shows error
- [ ] Incorrect password shows error
- [ ] Tab switching between username/email works

---

## 3. GOOGLE OAUTH AUTHENTICATION

### 3.1 Setup
- [ ] Configure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
- [ ] Verify Google Sign-In button appears
- [ ] Verify button styling matches login form

### 3.2 Sign-In Flow
- [ ] Click Google Sign-In button
- [ ] Google consent popup appears
- [ ] After consent, user is logged in
- [ ] New account created if first sign-in
- [ ] Session saved to localStorage
- [ ] Subsequent logins recognize existing account

### 3.3 Error Handling
- [ ] Cancel Google popup shows appropriate error
- [ ] Network error handled gracefully
- [ ] Verify error messages are user-friendly

---

## 4. APPLE SIGN-IN AUTHENTICATION

### 4.1 Setup (Manual Testing)
- [ ] Click Apple Sign-In button
- [ ] Manual entry dialog appears
- [ ] Can enter Apple ID identifier
- [ ] Can enter email address
- [ ] Submitting creates new account

### 4.2 Account Linking (Future)
- [ ] Apple can link to existing account
- [ ] Duplicate email handled correctly

---

## 5. ROLE-BASED ACCESS CONTROL

### 5.1 Adult User
- [ ] Adult can see all family members in selector
- [ ] Adult can add new family member
- [ ] Adult can remove family members
- [ ] Adult can see all logs from all family members
- [ ] Adult can manage family settings

### 5.2 Child User
- [ ] Child only sees themselves in member selector
- [ ] Child cannot add/remove members (buttons hidden)
- [ ] Child only sees their own logs
- [ ] Child receives error if trying to manage family

### 5.3 Family Member Switching
- [ ] Adult can switch between family members
- [ ] Logs update when member changes
- [ ] Charts reflect selected member's data
- [ ] Theme preference persists across switches

---

## 6. SESSION PERSISTENCE

### 6.1 localStorage
- [ ] Session saved to localStorage on login
- [ ] Session loaded on page reload
- [ ] Session cleared on logout
- [ ] Expired sessions (24h) are cleared

### 6.2 Refresh & Reload
- [ ] User stays logged in after F5 refresh
- [ ] User stays logged in after close/reopen
- [ ] All user preferences restored (theme, member selection)

---

## 7. FAMILY & DATA ACCESS

### 7.1 Multiple Family Members
- [ ] Create account with 2+ family members
- [ ] Switch member selector
- [ ] Each member has separate logs
- [ ] Charts update correctly per member

### 7.2 Multi-Login
- [ ] Adult user logs in
- [ ] Create 2 child members
- [ ] Log entries for each child
- [ ] Adult sees all child logs
- [ ] Child only sees own logs

---

## 8. THEME & PREFERENCES

### 8.1 Theme Persistence
- [ ] Change theme in settings
- [ ] Theme persists after logout/login
- [ ] Theme preference saved per user

### 8.2 Theme Switching
- [ ] All 6 themes load correctly
- [ ] CSS variables applied correctly
- [ ] Mobile responsive with themes

---

## 9. ERROR HANDLING & EDGE CASES

### 9.1 Network Errors
- [ ] Timeout on login shows error
- [ ] Invalid credentials show specific error
- [ ] Registration failures show reason

### 9.2 Browser Issues
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Works on mobile browsers
- [ ] localStorage works on all browsers

### 9.3 Edge Cases
- [ ] Very long usernames/emails handled
- [ ] Special characters in passwords work
- [ ] Unicode in display names work
- [ ] Missing database shows appropriate error

---

## 10. CALENDAR & LOGGING FUNCTIONALITY

### 10.1 Basic Logging
- [ ] Click calendar date opens modal
- [ ] Can select stool type
- [ ] Can set time
- [ ] Can set quantity
- [ ] Log saves to database
- [ ] Log appears in calendar view

### 10.2 Multiple Logs Per Day
- [ ] Add 2+ logs for same day
- [ ] Both logs visible in modal
- [ ] Each log has unique ID
- [ ] Can delete individual logs
- [ ] Chart includes all logs

### 10.3 Month Navigation
- [ ] Navigate months in chart
- [ ] Chart data updates by month
- [ ] Cannot navigate beyond current month

---

## Testing Command Checklist

Run these tests manually:
```bash
# 1. Start dev server
npm run dev

# 2. Test username/password login at http://localhost:3000
# 3. Test email login
# 4. Test Google OAuth (after configuring Client ID)
# 5. Test Apple OAuth
# 6. Test family member access
# 7. Test logging functionality
# 8. Test persistence (F5 refresh)
# 9. Test logout & re-login
```

---

## Pass/Fail Criteria

### MUST PASS (Critical)
- ✅ All 4 auth methods work
- ✅ Session persists across reload
- ✅ Role-based access enforced
- ✅ Logging functionality works
- ✅ No console errors

### SHOULD PASS (Important)
- ✅ Error messages are clear
- ✅ Mobile responsive
- ✅ Theme switching works
- ✅ Family member selector works

### NICE TO HAVE (Optional)
- ✅ OAuth buttons styled perfectly
- ✅ Smooth loading animations
- ✅ All accessibility features

---

## Bugs Found & Fixed

(To be updated as testing progresses)

---

## Sign-Off

**Tested By:** _________________
**Date:** _________________
**All Tests Passed:** Yes / No
