import type { Project } from "./types/project";

// 通信用URL（ご自身のサーバーのURLに置き換えてください）
const SERVER_URL = "http://hazukipasta.s223.xrea.com/save_sidekick.php"; 
const STORAGE_KEY = "sidekick_backup_data";

/**
 * データを保存する関数
 * localStorageに保存した後、自前サーバーへPOST送信します。
 */
export const saveData = async (projects: Project[]): Promise<void> => {
  // 1. localStorageにバックアップとして保存
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("LocalStorageへの保存に失敗しました:", e);
  }

  // 2. 自前サーバーにPOST送信
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projects }),
    });

    if (!response.ok) {
      throw new Error(`サーバー保存エラー: ${response.statusText}`);
    }
  } catch (error) {
    console.error("サーバーへの保存に失敗しました。ローカルには保存済みです:", error);
    throw error;
  }
};

/**
 * データを読み込む関数
 * サーバーからのGET取得を試み、失敗した場合はlocalStorageから読み込みます。
 */
export const loadData = async (): Promise<Project[]> => {
  // まずはlocalStorageからバックアップを読み込んでおく
  let localData: Project[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      localData = JSON.parse(saved);
    }
  } catch (e) {
    console.error("LocalStorageからの読み込みに失敗しました:", e);
  }

  // サーバーからのGET通信を試みる
  try {
    const response = await fetch(SERVER_URL, {
      method: "GET",
    });
    
    if (response.ok) {
      const data = await response.json();
      // サーバーから取得したデータを返す（データの構造に合わせて調整）
      return data.projects || localData;
    } else {
      console.warn("サーバーからの取得に失敗しました。ローカルデータを使用します。");
    }
  } catch (error) {
    console.error("通信エラーが発生しました。ローカルデータを使用します:", error);
  }

  // サーバー通信が失敗した、あるいは応答が空の場合はローカルデータを返す
  return localData;
};
