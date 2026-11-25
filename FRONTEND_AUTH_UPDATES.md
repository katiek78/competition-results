# Frontend Auth Updates - Backend Compatibility

## Summary
Updated frontend to work with new backend auth flow where:
- Backend generates password-reset and email-change tokens
- Frontend sends tokens as `Authorization: Bearer <token>`
- Login token becomes invalid after password or email change

## Changes Made

### 1. **Login.js** ✅
- **Line 71-93**: Removed frontend token generation
  - Deleted: `generateToken()`, `confirmationURL`, `createdAt`, `expiresAt`, `dynamic_link`, `token`
  - Now sends only: `{ email }` to `POST /initiate-password-change`

### 2. **Account.js** ✅
- **handleSubmitEmail (Lines 101-145)**: Email change initiation
  - Removed frontend token generation
  - Deleted: `generateToken()`, `confirmationURL`, `createdAt`, `expiresAt`, `dynamic_link`, `token`, `userId`
  - Now sends only: `{ to: newEmail }` with Bearer login token
  - Added error handling

- **handleSubmitPassword (Lines 183-210)**: Password reset request
  - Removed frontend token generation
  - Deleted: `generateToken()`, `confirmationURL`, `createdAt`, `expiresAt`, `dynamic_link`, `token`
  - Now sends only: `{ email }` with Bearer login token

### 3. **PasswordReset.js** ✅
- **Line 1-80**: Added comprehensive error handling
  - Added `errorMessage` state
  - Displays "Invalid or expired token" error (400 status)
  - Prevents form submission if token is missing
  - Shows errors in alert, success in message
  - Already correct format: `Authorization: Bearer <token>`

### 4. **EmailChange.js** ✅ (Recreated)
- **Complete rewrite** with improved error handling
  - Added `useNavigate` for redirect
  - Added `errorMessage` state
  - Displays "Invalid or expired token" error (404 status)
  - Shows success message and redirects to login after 3 seconds
  - User must log in again after email change (old token is invalid)
  - Proper error messages via Bootstrap alerts

### 5. **Users.js** ✅
- **saveUser function (Lines 213-278)**: User creation
  - No change to logic, already calls `send-verification-email` separately
  - Verified Authorization header uses Bearer token format
  - Backend now marks new emails as unverified and handles verification separately

## Behavior Changes

### Password Reset Flow
1. User enters email → Frontend sends to `POST /initiate-password-change` with email only
2. Backend generates token, emails reset link with token
3. User clicks link → arrives at `/password-reset?token=...`
4. Frontend sends token as `Authorization: Bearer <token>` to `PUT /password-reset`
5. ✅ Works correctly, error handling added for expired tokens

### Email Change Flow
1. User enters new email → Frontend sends `POST /initiate-email-change` with Bearer login token and `{ to: newEmail }`
2. Backend generates email-change token, marks email unverified, emails confirmation link
3. User clicks link → arrives at `/email-change?token=...&userId=...`
4. Frontend sends token in body `{ token }` to `PUT /email-update/:userId` (NO auth header needed)
5. Backend confirms change, old login token becomes invalid
6. ✅ User redirected to login with message after success

### Admin User Creation
1. Admin creates user via `POST /users` with Bearer token
2. Backend creates user, returns `userId`
3. Frontend calls `POST /send-verification-email` with Bearer token (admin's login token)
4. ✅ Verification email sent with new address marked unverified

## Testing Checklist
- [ ] Password reset: Generate valid flow end-to-end
- [ ] Password reset: Test expired token handling (400 error)
- [ ] Email change: Generate valid flow end-to-end
- [ ] Email change: Test expired token handling (404 error)
- [ ] Email change: Verify user forced to re-login
- [ ] Admin user creation: Verify verification email sent
- [ ] Admin email edit via PUT /user-update: Verify unverified email marked
- [ ] Profile updates: Verify Bearer token still works
- [ ] Competition operations: Verify Bearer token still works

## Token Format
- **Login token**: `Authorization: Bearer <token>` (from POST /login, stored in cookie)
- **Password-reset token**: `Authorization: Bearer <token>` (from email link, sent to PUT /password-reset)
- **Email-change token**: Body `{ token: "..." }` (from email link, sent to PUT /email-update/:userId, no auth header)

## Files Modified
1. ✅ `/src/Login.js`
2. ✅ `/src/Account.js`
3. ✅ `/src/PasswordReset.js`
4. ✅ `/src/EmailChange.js` (recreated)
5. ✅ `/src/Users.js`

## Dependencies
- No new dependencies added
- Uses existing: React, axios, react-router-dom, react-bootstrap
