import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBm6n7ZqAPl_QaYSVE8nsJ9fKMUCGIgsfs",
  authDomain: "ubicate-d4856.firebaseapp.com",
  projectId: "ubicate-d4856",
  storageBucket: "ubicate-d4856.firebasestorage.app",
  messagingSenderId: "1049935204935",
  appId: "1:1049935204935:web:5397f73293ca15f3bad762",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
