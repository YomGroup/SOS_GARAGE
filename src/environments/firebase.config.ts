import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBKmwyn0T6NwXsXC9ugcWBFmAwnRDZJiXs",
  authDomain: "sosmongarage-b8a55.firebaseapp.com",
  projectId: "sosmongarage-b8a55",
  storageBucket: "sosmongarage-b8a55.firebasestorage.app",
  messagingSenderId: "497587401882",
  appId: "1:497587401882:web:77916104ceadb13cd85b23",
  measurementId: "G-W7KCQBMFQE"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);