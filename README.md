# Welcome to your project

## Project info

**URL**: REPLACE_WITH_YOUR_PROJECT_URL

## How can I edit this code?

There are a few common ways to work on this application.

### Local development

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   ```
2. Enter the project folder:
   ```sh
   cd <YOUR_PROJECT_NAME>
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the dev server:
   ```sh
   npm run dev
   ```

Changes can be committed and pushed normally; any deployment pipeline you
have configured will pick them up.

### Editing on GitHub

- Open the file in the GitHub UI.
- Click the pencil icon to edit.
- Commit your changes directly or create a branch/PR.

### Codespaces

1. Click the green **Code** button on your repository page.
2. Choose **Codespaces** and create a new environment.
3. Edit files inside the codespace and push when ready.

## Technologies used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

Build the production bundle:

```sh
npm run build
```

Then upload the `dist` output to your hosting provider (Netlify, Vercel, GitHub
Pages, etc.) and follow their documentation to publish.

## Custom domain

Most hosting platforms allow you to configure a custom domain via their
settings page. Refer to your provider's docs for specific steps.

---
n
## Firebase Setup

This project now uses Firebase for authentication and Firestore for user
profiles. To get started:

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password and Google providers) and create a **Firestore** database.
3. Copy your configuration values (apiKey, authDomain, projectId, etc.) from the project settings.
4. Add them to your environment file (e.g. `.env`) using the `VITE_` prefix so Vite can access them:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. Restart the dev server after updating the env variables.

The helper file `src/lib/firebase.ts` will read these vars and initialize the SDK.

---

## MongoDB Setup (server)

The backend uses an Atlas cluster for persisting users. You must provide a
connection string in an environment variable named `MONGODB_URI`.

1. Create an [Atlas](https://www.mongodb.com/cloud/atlas) project and cluster.
2. Add your IP address to the **Network Access** whitelist (or use `0.0.0.0/0` for testing).
3. Create a database user (e.g. `shipitadmin`) and note the password.
4. Click **Connect → Connect your application** and copy the connection string.
   It will look like:
   ```text
   mongodb+srv://<user>:<password>@cluster0.79thk0e.mongodb.net/shipit?retryWrites=true&w=majority
   ```
   Paste that into `server/.env` (or the project root `.env`) replacing `<password>`.

5. If you run into DNS errors (`querySrv ECONNREFUSED`) the server now overrides the resolver and logs a helpful hint. You can also replace the SRV form with an explicit non‑SRV URI from Atlas (it’s listed just below the snippet above).

6. Start the backend:
   ```sh
   cd server
   npm install
   npm start
   ```

The code in `server/index.js` sets DNS servers to 8.8.8.8/1.1.1.1 automatically which usually fixes connection problems on restrictive networks.
