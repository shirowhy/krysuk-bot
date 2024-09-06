import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADBr0mkExTa-VKv-niwVqPQiaiwgKfy8A",
  authDomain: "krysuk-bot.firebaseapp.com",
  projectId: "krysuk-bot",
  storageBucket: "krysuk-bot.appspot.com",
  messagingSenderId: "801896618946",
  appId: "1:801896618946:web:fd62d695acb2482551945b",
  measurementId: "G-DEE2JYJQ14"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };