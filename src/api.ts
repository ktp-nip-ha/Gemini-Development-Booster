import type { Project } from "./types/project";

// 通信用URL（ご自身のサーバーのURLに置き換えてください）
const SERVER_URL = "https://ss1.xrea.com/hazukipasta.s223.xrea.com/save_sidekick.php"; 
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
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        localData = parsed;
      }
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
      const text = await response.text();
      // PHP側でエラーが出力されている場合や空の場合を考慮
      if (text) {
        try {
          const data = JSON.parse(text);
          // projectsキーがある場合と、配列そのものが返ってくる場合の両方を考慮
          const serverProjects = data.projects || (Array.isArray(data) ? data : null);
          if (serverProjects) {
            return serverProjects;
          }
        } catch (parseError) {
          console.error("JSONの解析に失敗しました。サーバーの出力がJSON形式ではない可能性があります:", text);
        }
      }
    } else {
      console.warn("サーバーからの取得に失敗しました。ステータスコード:", response.status);
    }
  } catch (error) {
    console.error("通信エラーが発生しました。ローカルデータを確認します:", error);
  }

  // サーバー通信が失敗した、あるいは応答が不正な場合はローカルデータを返す
  // ローカルデータも空なら空配列 [] を返す
  return localData || [];
};
