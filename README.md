# Daymark

A personal task list built with React, Firebase Authentication, and Firebase Realtime Database. Anyone with a Google account can sign in; each account can read and change only its own tasks.

## Connect Firebase

1. Create a Firebase project, add a web app, enable **Google** under Authentication providers, and create a Realtime Database.
2. Copy `.env.example` to `.env.local` and fill in the web app's API key, auth domain, database URL, project ID, and app ID.
3. Add `http://localhost:5173` to Authentication's authorized domains in the Firebase console.
4. Deploy the database rules with the Firebase CLI: `firebase deploy --only database`.
5. Start the app with `npm run dev`.

The app keeps sign-in disabled until all required Firebase values are set. Firebase web API keys identify the project; Authentication and `database.rules.json` control data access.

## Commands

- `npm run dev` starts the local development server.
- `npm run build` type-checks and builds the app.
- `npm run lint` checks the source with Oxlint.
