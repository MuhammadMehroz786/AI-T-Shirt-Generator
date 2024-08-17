import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAKShRxAKoSC5d67S6KSXUrBiAJgPX9J10",
    authDomain: "newproject-e2d1a.firebaseapp.com",
    projectId: "newproject-e2d1a",
    storageBucket: "newproject-e2d1a.appspot.com",
    messagingSenderId: "148320456255",
    appId: "1:148320456255:web:d6b5383a01b238a473728a",
    measurementId: "G-N3V60LR1E1"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
