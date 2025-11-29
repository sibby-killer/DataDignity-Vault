# SecureVault - Testing Guide

This file contains comprehensive tests to verify all fixes and features are working correctly.

## 🚀 Quick Start Test

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app should start at `http://localhost:3000`

## ✅ Issue Fixes Verification

### 1. React Router Future Flag Warnings (FIXED)
**Expected**: No more React Router future flag warnings in console
**Test**: 
- Open browser console
- Navigate between pages
- Should see NO warnings about `v7_startTransition` or `v7_relativeSplatPath`

### 2. Supabase Database Errors (FIXED)
**Expected**: No 406 errors from Supabase API
**Test**:
- Create account / Sign in
- Upload a file
- Try sharing a file
- Check Network tab - should see 200/201 responses instead of 406 errors

### 3. Gemini API Errors (FIXED)
**Expected**: AI features work with Gemini 2.0 Flash
**Test**:
- Go to Help section → Ask AI Assistant
- Ask any question (e.g., "How do I share a file?")
- Should get AI response instead of 403/404 errors
- Go to Security Monitor → Scan Files
- Should see AI-powered security analysis

### 4. Blockchain/MetaMask Integration (FIXED)
**Expected**: Proper MetaMask integration without "no such account" errors
**Test**:
- Connect MetaMask wallet
- Upload a file with wallet connected
- Should see blockchain registration success
- Header should show connected wallet address

## 🎯 New Features Testing

### 1. Mobile Responsive UI with Hamburger Menu
**Test**:
- Resize browser to mobile view (< 768px)
- Click hamburger menu icon (☰) in header
- Sidebar should slide in from left
- Navigate between sections
- UI should look clean like Gmail mobile

### 2. File Upload with Thumbnails
**Test**:
- Go to "My Files" section
- Click "Upload File" button
- Drag & drop an image file
- Should see thumbnail preview in upload modal
- Upload the file
- Should see thumbnail in file grid

### 3. Email Sharing with Prefilled Content
**Test**:
- Upload a file
- Click "Share" button on any file
- Enter an email address
- Click "Share File & Open Email"
- Should open email client with prefilled subject and body
- Email should include file preview and security instructions

### 4. AI-Powered Features
**Test Help System**:
- Go to Help & Support
- Click "Ask AI Assistant" tab
- Type: "How secure are my files?"
- Should get detailed AI response

**Test Security Scanning**:
- Go to Security Monitor
- Upload some files first (if none exist)
- Click "Scan Files"
- Should see AI security analysis for each file

### 5. User Profile Management
**Test**:
- Go to Profile section
- Edit your name and bio
- Click "Save Changes"
- Should see success toast notification
- Should show wallet status if connected

### 6. Dashboard Statistics
**Test**:
- Go to Dashboard
- Should see file statistics
- Should see recent files list
- Should see security status cards
- Should show wallet connection status

## 🔧 Technical Verification

### 1. Check Environment Variables
```bash
# Verify .env file exists and contains:
cat .env
```
Should see:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY  
- VITE_GEMINI_API_KEY (updated for Gemini 2.0)

### 2. Check Package Dependencies
```bash
# Verify all dependencies installed
npm list --depth=0
```
Should include:
- react-router-dom
- @supabase/supabase-js
- ethers

### 3. Check Build Process
```bash
# Test production build
npm run build
```
Should build without errors and create `dist` folder.

## 🎨 UI/UX Testing

### 1. App Icon and Favicon
**Test**:
- Check browser tab - should show custom lock icon
- Add to home screen on mobile - should use custom icon

### 2. Responsive Design
**Test Different Screen Sizes**:
- Mobile (< 768px): Hamburger menu, stacked layout
- Tablet (768-1024px): Collapsible sidebar
- Desktop (> 1024px): Full sidebar always visible

### 3. Loading States
**Test**:
- All buttons should show spinners during loading
- Pages should show loading spinners while fetching data
- Upload modal should show progress during file upload

### 4. Toast Notifications
**Test**:
- Successful actions should show green toast
- Errors should show red toast
- Warnings should show yellow/orange toast
- Toasts should auto-dismiss after 5 seconds

## 🔒 Security Features Testing

### 1. Authentication Flow
**Test**:
- Sign up with new email
- Sign in with existing account
- Sign out functionality
- Protected routes (can't access app without login)

### 2. File Encryption
**Test**:
- Upload file with password
- Upload file without password
- Both should be encrypted (check Supabase storage)

### 3. Blockchain Integration
**Test**:
- Connect MetaMask
- Upload file - should register on Polygon Amoy testnet
- Share file - should create blockchain permission
- Check transactions on Amoy scanner

## 🚨 Error Handling Testing

### 1. Network Errors
**Test**:
- Disconnect internet
- Try uploading file
- Should show appropriate error message

### 2. Invalid Data
**Test**:
- Try sharing with invalid email
- Try uploading file too large
- Should show validation errors

### 3. MetaMask Errors
**Test**:
- Reject MetaMask connection
- Should handle gracefully with error message

## 📊 Performance Testing

### 1. File Upload Performance
**Test**:
- Upload various file sizes (up to 50MB limit)
- Should show progress and handle large files

### 2. AI Response Time
**Test**:
- AI responses should come back within 10-30 seconds
- Should show loading indicators during AI processing

## ✅ Success Criteria

**All tests pass if**:
- ❌ No console errors about React Router
- ❌ No 406 Supabase errors
- ❌ No 403/404 Gemini API errors
- ❌ No "no such account" blockchain errors
- ✅ Mobile responsive design works
- ✅ File thumbnails display correctly
- ✅ Email sharing opens with prefilled content
- ✅ AI features respond correctly
- ✅ Profile editing works
- ✅ Dashboard shows statistics
- ✅ All UI components render properly

## 🔄 If Issues Found

1. Check browser console for specific errors
2. Verify all environment variables are set
3. Ensure MetaMask is installed and connected to Polygon Amoy
4. Check network connectivity
5. Verify API keys are valid and have proper permissions

## 📝 Manual Test Checklist

- [ ] App loads without console errors
- [ ] Can create account and sign in
- [ ] Mobile hamburger menu works
- [ ] Can upload files with thumbnails
- [ ] File sharing opens email client
- [ ] AI assistant responds to questions
- [ ] Security scanner analyzes files
- [ ] Profile can be edited
- [ ] Dashboard shows data
- [ ] MetaMask integration works
- [ ] All pages are responsive
- [ ] Toast notifications appear
- [ ] App icon displays correctly

---

**Expected Result**: All features working, no console errors, professional UI ready for production use.