# Qasas Practice

A practice app for students studying *Qasas un-Nabiyeen* (Book 1). The app provides four practice modes covering Arabic grammar and vocabulary from the textbook.

## Practice Modes

- **I'rab Identification** - Identify the grammatical case (raf', nasb, jarr) of highlighted words
- **Noun Features** - Tag definiteness, gender, and number of Arabic nouns
- **Grammatical Role** - Identify the grammatical role (fa'il, maf'ul, etc.) in sentences
- **Vocabulary** - Flashcard-based vocabulary practice

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file with your Firebase configuration (see Firebase Setup below).

3. Start the development server:
   ```
   npm run dev
   ```

## Firebase Setup

This app uses Firebase for authentication and user data. You'll need to:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Create a Firestore database in production mode
4. Add your Firebase config to `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Making Someone an Admin

Admin access is intentionally restricted. There is no way to become an admin through the app itself — this is a security feature to prevent students from accessing answer keys.

To grant admin access:

1. Have the person sign up normally through the app.
2. Open the Firebase Console → Firestore → `users` collection.
3. Find their document (search by username).
4. Edit the `role` field from `"student"` to `"admin"` and save.

They will have admin access the next time they load the app. There is no way to do this from within the app itself, by design. To revoke, change it back to `"student"`.

Admins can access the question bank viewer at `/admin` (type the URL directly — there is no link in the student UI).

## Deployment

The app is deployed via Vercel. Push to the main branch to trigger a deployment.

## License

MIT
