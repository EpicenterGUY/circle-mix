use serde::Serialize;
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopUpdateMetadata {
  version: String,
  current_version: String,
  notes: String,
}

#[tauri::command]
async fn check_desktop_update(app: tauri::AppHandle) -> Result<Option<DesktopUpdateMetadata>, String> {
  let update = app
    .updater()
    .map_err(|error| error.to_string())?
    .check()
    .await
    .map_err(|error| error.to_string())?;
  Ok(update.map(|update| DesktopUpdateMetadata {
    version: update.version,
    current_version: update.current_version,
    notes: update.body.unwrap_or_default(),
  }))
}

#[tauri::command]
async fn install_desktop_update(app: tauri::AppHandle) -> Result<(), String> {
  let update = app
    .updater()
    .map_err(|error| error.to_string())?
    .check()
    .await
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "사용 가능한 업데이트가 없습니다.".to_string())?;
  update
    .download_and_install(|_, _| {}, || {})
    .await
    .map_err(|error| error.to_string())?;
  app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![check_desktop_update, install_desktop_update])
    .run(tauri::generate_context!())
    .expect("error while running CIRCLE MIX");
}
