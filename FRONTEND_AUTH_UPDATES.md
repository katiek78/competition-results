# Frontend Auth Updates - Backend Compatibility

## Summary

Updated frontend to work with new backend auth flow where:

- Backend generates password-reset and email-change tokens
- Backend generates activation tokens for new user account setup
- Frontend sends tokens as `Authorization: Bearer <token>` for authenticated requests
- Login token becomes invalid after password or email change

## Changes Made

### 1. **Users.js** ✅ (Updated)

- **saveUser function (Lines 213-250)**: User creation flow
  - Removed password generation (`generateStrongPassword()`)
  - Removed separate `/send-verification-email` call
  - Now sends only: `{ firstName, lastName, email, iamId, birthYear, country }` to `POST /users` with Bearer token
  - Backend automatically sends verification email
  - Properly merges backend response to preserve `verified: false` status
  - Shows success message to admin

### 2. **EmailVerification.js** ✅ (Updated for Activation)

- **Complete rewrite** to handle both verification and account activation
  - **Verification phase**: Calls `GET /verify-email?token=...`
  - **Response handling**: Checks `activationRequired` flag
  - **If `activationRequired: true`** (new user without password):
    - Stores activation token in state
    - Shows password-setup form with password and confirm-password fields
    - Validates password (min 8 chars, match confirmation)
    - Submits to `POST /user-activation` with `{ token, password }`
    - Redirects to login after success
  - **If `activationRequired: false`** (existing user, already has password):
    - Shows success message
    - Links to login
  - Proper error handling for each phase:
    - Verification errors (400=expired, 404=not found)
    - Activation errors (invalid token, password validation)

### 3. **Login.js** ✅ (Unchanged)

- Already correct: Password reset initiation sends only email to `POST /initiate-password-change`
- Backend generates and emails the token

### 4. **Account.js** ✅ (Unchanged)

- Already correct: Password and email change flows use backend tokens
- Null-checks for undefined emails in duplicate check

### 5. **PasswordReset.js** ✅ (Unchanged)

- Already correct: Error handling for expired/invalid tokens
- Sends token as `Authorization: Bearer <token>` to `PUT /password-reset`

### 6. **EmailChange.js** ✅ (Unchanged)

- Already correct: Separate from account activation flow
- Used only for existing users changing their email
- Sends token in request body to `PUT /email-update/:userId`
- Properly handles 404 for expired tokens

## Behavior Changes

### New User Account Creation (Admin Flow)

1. Admin creates user via `POST /users` with Bearer token, **no password field**
2. Backend creates user and **automatically sends verification email**
3. User receives email with `/verify-email?token=...` link
4. Frontend verifies email → Backend returns `{ success: true, activationRequired: true, activationToken: "..." }`
5. Frontend shows password-setup form
6. User enters password → Frontend sends to `POST /user-activation` with `{ token, password }`
7. Backend sets password, consumes activation token (single-use, short-lived)
8. User redirected to login
9. ✅ User logs in normally

### Existing User Email Verification (Email Change Confirmation)

1. User requests email change via Account page
2. User verifies new email → Backend returns `{ success: true, activationRequired: false }`
3. Frontend shows success message and links to login
4. ✅ Uses existing EmailChange.js flow for token verification

### Password Reset Flow (Unchanged)

1. User enters email → Frontend sends to `POST /initiate-password-change`
2. Backend emails reset link with token
3. User clicks link → arrives at `/password-reset?token=...`
4. Frontend sends token as Bearer to `PUT /password-reset` with new password
5. ✅ Works correctly with error handling for expired tokens

## Testing Checklist

### New User Activation (Admin Creation)

- [ ] Admin creates user without entering password
- [ ] User receives verification email
- [ ] User clicks email link → sees password setup form
- [ ] User enters password → account activated
- [ ] User logs in with email and password
- [ ] Test expired activation token → user can request new verification email
- [ ] Test password too short → shows validation error

### Email Verification for Existing Users

- [ ] Admin updates user's email via PUT /user-update
- [ ] User receives verification email
- [ ] User clicks email link → sees success message
- [ ] User redirected to login (old token invalidated)

### (Unchanged Flows)

- [ ] Password reset: Expired token shows error
- [ ] Email change: Expired token shows error
- [ ] Email change: User forced to re-login
- [ ] Profile updates: Bearer token still works
- [ ] Competition operations: Bearer token still works

## Token Format

- **Login token**: `Authorization: Bearer <token>` (from POST /login, stored in cookie)
- **Password-reset token**: `Authorization: Bearer <token>` (from email, sent to PUT /password-reset)
- **Email-change token**: Body `{ token: "..." }` (from email, sent to PUT /email-update/:userId, no auth header)
- **Activation token**: Body `{ token: "...", password: "..." }` (from email, sent to POST /user-activation, no auth header)

## Files Modified

1. ✅ `/src/Users.js` — Removed password generation and separate verification email call
2. ✅ `/src/EmailVerification.js` — Added account activation flow with password setup form
3. ⚫ `/src/Login.js` — No changes needed (already compatible)
4. ⚫ `/src/Account.js` — No changes needed (already compatible)
5. ⚫ `/src/PasswordReset.js` — No changes needed (already compatible)
6. ⚫ `/src/EmailChange.js` — No changes needed (already compatible)

## Dependencies

- No new dependencies added
- Uses existing: React, axios, react-router-dom, react-bootstrap
- Requires React 16.8+ for hooks

## Security Notes

- Activation tokens are single-use and short-lived
- Tokens are never logged or exposed in URLs (sent in request body)
- Password is set at activation time, not in verification email
- Backend enforces that activation doesn't overwrite existing passwords
- Backend tracks verification and activation separately
