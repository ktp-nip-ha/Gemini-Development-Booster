// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebaseの設定（APIキーなどの機密情報）
const firebaseConfig = {
    apiKey: "AIzaSyDiMnqQT4ziLlPlosqRbBhocGZkXDhob4Q",
    authDomain: "sidekick-app-9144f.firebaseapp.com",
    projectId: "sidekick-app-9144f",
    storageBucket: "sidekick-app-9144f.firebasestorage.app",
    messagingSenderId: "290840820432",
    appId: "1:290840820432:web:ea6e62ebc85f0138c6bcd5"
};

// Firebaseを初期化する
const app = initializeApp(firebaseConfig);

// 最も標準的で軽量なFirestoreデータベースのインスタンスを取得して公開
export const db = getFirestore(app);
