# Quick Check: .env File Setup

## Required Steps:

1. **Create `.env` file in the `backend` folder**
   - File name should be exactly `.env` (no extension)
   - Location: `backend/.env`

2. **Required Environment Variables:**

```env
PORT=3000
FIREBASE_PROJECT_ID=amen-608e7
FIREBASE_PRIVATE_KEY_ID=your-key-id-here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@amen-608e7.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
JWT_SECRET=generate-random-secret-here
NODE_ENV=development
```

## How to Get These Values:

1. Go to Firebase Console: https://console.firebase.google.com/project/amen-608e7/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file
4. Open the JSON file and copy these values:
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters!)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`
   - `project_id` → `FIREBASE_PROJECT_ID` (should be "amen-608e7")

5. Generate JWT_SECRET:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

## Important Notes:

- The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes
- Keep the `\n` characters as literal `\n` (backslash-n), don't convert to actual newlines
- The entire private key should be on ONE line in the .env file
- Make sure there are no spaces before/after the `=` sign

## Test:

After creating `.env`, run:
```bash
npm start
```

You should see:
```
Firebase Admin initialized successfully
Project ID: amen-608e7
Server running on port 3000
```

If you see errors, check that all values are filled in correctly!

