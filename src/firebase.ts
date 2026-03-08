// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Firebaseの設定（APIキーなどの機密情報）
const firebaseConfig = {
    apiKey: "AIzaSyDiMnqQT4ziLlPlosqRbBhocGZkXDhob4Q",
    authDomain: "sidekick-app-9144f.firebaseapp.com",
    projectId: "sidekick-app-9144f",
    storageBucket: "sidekick-app-9144f.firebasestorage.app",
    messagingSenderId: "290840820432",
    appId: "1:290840820432:web:ea6e62ebc85f0138c6bcd5"
};

// Firebaseを初期化（起動）
const app = initializeApp(firebaseConfig);

// Firestore（データベース）の準備
export const db = getFirestore(app);

// 【爆速化の鍵】オフライン永続性（キャッシュ機能）を有効にする
// これにより、ネットが遅くても端末内のデータを即座に表示でき、
// 変更内容を一時的に端末に保存して裏側で同期できるようになります。
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // 複数のタブでアプリを開いている場合に発生することがあります
        console.warn("Firestoreのキャッシュ有効化に失敗しました（複数タブの可能性）");
    } else if (err.code === 'unimplemented') {
        // ブラウザがサポートしていない場合
        console.warn("このブラウザはFirestoreのキャッシュをサポートしていません");
    }
});
