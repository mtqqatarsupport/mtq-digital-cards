// Public Firebase web-app settings for the "Continue with Google" button.
// These are NOT secrets — Firebase sends them to every browser that loads the
// login page. Security comes from Authorized domains in Firebase, the server-side
// token check and the admin allow-list. Vercel env vars override them if set.
const DEFAULTS = {
  apiKey: "AIzaSyBQJySnOItdUPcUnQhekXVF1h_CdMrmRpI",
  authDomain: "mtqdigitalcard.firebaseapp.com",
  projectId: "mtqdigitalcard",
  appId: "1:1070976825942:web:6df8c7766ddb5a6e9159f7",
};

export function firebaseWebConfig() {
  return {
    apiKey: process.env.FIREBASE_WEB_API_KEY?.trim() || DEFAULTS.apiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN?.trim() || DEFAULTS.authDomain,
    projectId: process.env.FIREBASE_PROJECT_ID?.trim() || DEFAULTS.projectId,
    appId: process.env.FIREBASE_WEB_APP_ID?.trim() || DEFAULTS.appId,
  };
}
