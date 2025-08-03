import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // イベント受信
    const unlisten = listen<string>("yt-dlp-progress", (event) => {
      setOutput((prev) => [...prev, event.payload]);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleClick = async () => {
    if (!url.trim()) {
      alert("URLを入力してください");
      return;
    }
    setOutput([]);
    setDownloading(true);

    try {
      await invoke("run_yt_dlp_realtime", { url });
      setOutput((prev) => [...prev, "✅ 完了"]);
    } catch (e) {
      setOutput((prev) => [...prev, "❌ エラー: " + String(e)]);
    } finally {
      setDownloading(false);
    }
  };

  const handleClick_update = async () => {
    try {
      const result = await invoke<string>("run_update");
      console.log("update.bat 実行結果: ", result);
    } catch (error) {
      alert("update.bat 実行中にエラーが発生しました: " + String(error));
    }
  };

  return (
    <div style={{ marginTop: "3%", textAlign: "center" }}>
      <h1>N624 Downloader</h1>
      <button
        onClick={handleClick_update}
        className=" bg-blue-500 text-white px-4 py-2 rounded"
        style={{ position: "fixed", top: "calc(3% + 0.67em)", height: "48px" }}
      >
        アップデート
      </button>
      <input
        type="text"
        value={url}
        placeholder="動画のURL"
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "90%", marginTop: "1rem" }}
      />
      <br />
      <button onClick={handleClick} disabled={downloading} style={{ alignItems: "center", marginTop: "1rem", textAlign: "center", display: "block", marginLeft: "auto", marginRight: "auto" }}>
        {downloading ? "ダウンロード中..." : "ダウンロード開始"}
      </button>
      <pre style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        {output.join("\n")}
      </pre>
    </div>
  );
}

export default App;
