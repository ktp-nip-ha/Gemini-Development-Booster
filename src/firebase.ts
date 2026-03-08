// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 先ほどコピーした「合鍵（firebaseConfig）」をここに貼り付けます
const firebaseConfig = {
    apiKey: "AIzaSyDiMnqQT4ziLlPlosqRbBhocGZkXDhob4Q",
    authDomain: "sidekick-app-9144f.firebaseapp.com",
    projectId: "sidekick-app-9144f",
    storageBucket: "sidekick-app-9144f.firebasestorage.app",
    messagingSenderId: "290840820432",
    appId: "1:290840820432:web:ea6e62ebc85f0138c6bcd5"
  
};

// Firebaseを起動
const app = initializeApp(firebaseConfig);

// 金庫（データベース）を使えるようにして、外に公開する
export const db = getFirestore(app);