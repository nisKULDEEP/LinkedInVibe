import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC_-VBcla1G0L15YE1Ar095aMtJrRCb0lg",
  authDomain: "linkedinvibe.firebaseapp.com",
  projectId: "linkedinvibe",
  storageBucket: "linkedinvibe.firebasestorage.app",
  messagingSenderId: "39230755346",
  appId: "1:39230755346:web:98e1ff106b4a67b3323ecb",
  measurementId: "G-YD58YLJTGF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const logAnalyticsEvent = (eventName, params) => {
  logEvent(analytics, eventName, params);
  console.log(`📊 Firebase Event: ${eventName}`, params);
};

export { analytics };
