#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::AppHandle;
use tauri::Emitter;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};

#[tauri::command]
async fn run_yt_dlp_realtime(app: AppHandle, url: String) -> Result<(), String> {
    if url.trim().is_empty() {
        return Err("URLが空です".into());
    }

    let mut child = Command::new("yt-dlp")
        .arg("-f")
        .arg("bv*+ba/best")
        .arg("--merge-output-format")
        .arg("mp4")
        .arg(&url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("yt-dlp起動エラー: {}", e))?;

    let stderr = child.stderr.take().ok_or("stderr取得失敗")?;
    let reader = BufReader::new(stderr);

    for line in reader.lines() {
        if let Ok(line) = line {
            let _ = app.emit("yt-dlp-progress", Some(line));
        }
    }

    let status = child.wait().map_err(|e| format!("終了エラー: {}", e))?;
    if status.success() {
        Ok(())
    } else {
        Err("yt-dlp がエラー終了しました".into())
    }
}

#[tauri::command]
fn run_update() -> Result<String, String> {
    // 実行するバッチファイルのパス（相対パス or 絶対パス）
    let bat_path = "update.bat";

    // コマンドを実行
    let output = Command::new("cmd")
        .args(&["/C", bat_path])
        .output()
        .map_err(|e| e.to_string())?;

    // 実行結果を文字列で返す（必要に応じて変更）
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout)
}

fn main() {
    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        run_yt_dlp_realtime, // 既存のコマンド
        run_update           // 新しく追加するコマンド
    ])
    .run(tauri::generate_context!())
    .expect("tauri 起動失敗");

}
