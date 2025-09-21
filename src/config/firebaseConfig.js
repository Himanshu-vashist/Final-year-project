// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUY4TsjqkkVHmr3VxFxWJYf-h5-yixNGs",
  authDomain: "startwise-d5323.firebaseapp.com",
  databaseURL: "https://startwise-d5323-default-rtdb.firebaseio.com",
  projectId: "startwise-d5323",
  storageBucket: "startwise-d5323.firebasestorage.app",
  messagingSenderId: "375962867914",
  appId: "1:375962867914:web:d840f17b60dbafaeffbc33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { auth, db, storage, functions };