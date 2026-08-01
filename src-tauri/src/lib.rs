use serde::Serialize;

#[cfg(desktop)]
use std::{path::PathBuf, sync::Mutex};
#[cfg(desktop)]
use tauri::{Emitter, Manager};
#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

#[cfg(desktop)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopUpdateMetadata {
  version: String,
  current_version: String,
  notes: String,
}

#[cfg(desktop)]
#[derive(Default)]
struct PendingCmixPaths(Mutex<Vec<String>>);

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MobileShellInfo {
  platform: &'static str,
  local_library: bool,
  fold_landscape: bool,
}

#[cfg(desktop)]
fn cmix_path_from_argument(argument: &str, cwd: &str) -> Option<String> {
  let value = argument.trim().trim_matches('"');
  let path = PathBuf::from(value);
  let is_cmix = path
    .extension()
    .and_then(|extension| extension.to_str())
    .map(|extension| extension.eq_ignore_ascii_case("cmix"))
    .unwrap_or(false);
  if !is_cmix {
    return None;
  }
  let resolved = if path.is_absolute() {
    path
  } else {
    PathBuf::from(cwd).join(path)
  };
  let canonical = resolved.canonicalize().ok()?;
  if !canonical.is_file() {
    return None;
  }
  Some(canonical.to_string_lossy().into_owned())
}

#[cfg(desktop)]
fn cmix_paths_from_args(args: impl IntoIterator<Item = String>, cwd: &str) -> Vec<String> {
  let mut paths = Vec::new();
  for argument in args {
    if let Some(path) = cmix_path_from_argument(&argument, cwd) {
      if !paths.contains(&path) {
        paths.push(path);
      }
    }
  }
  paths
}

#[cfg(desktop)]
fn queue_cmix_paths(app: &tauri::AppHandle, paths: &[String]) {
  let state = app.state::<PendingCmixPaths>();
  let mut pending = state.0.lock().unwrap_or_else(|error| error.into_inner());
  for path in paths {
    if !pending.contains(path) {
      pending.push(path.clone());
    }
  }
}

#[cfg(desktop)]
#[tauri::command]
fn take_desktop_cmix_paths(state: tauri::State<'_, PendingCmixPaths>) -> Vec<String> {
  let mut pending = state.0.lock().unwrap_or_else(|error| error.into_inner());
  std::mem::take(&mut *pending)
}

#[cfg(desktop)]
#[tauri::command]
fn read_desktop_cmix_file(path: String) -> Result<tauri::ipc::Response, String> {
  let cwd = std::env::current_dir()
    .map_err(|error| error.to_string())?
    .to_string_lossy()
    .into_owned();
  let resolved = cmix_path_from_argument(&path, &cwd)
    .ok_or_else(|| "유효한 .cmix 파일을 찾을 수 없습니다.".to_string())?;
  let bytes = std::fs::read(resolved).map_err(|error| error.to_string())?;
  Ok(tauri::ipc::Response::new(bytes))
}

#[cfg(desktop)]
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

#[cfg(desktop)]
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

#[cfg(mobile)]
#[tauri::command]
fn android_shell_info() -> MobileShellInfo {
  MobileShellInfo {
    platform: "android",
    local_library: true,
    fold_landscape: true,
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  #[cfg(desktop)]
  {
    let cwd = std::env::current_dir()
      .unwrap_or_default()
      .to_string_lossy()
      .into_owned();
    let initial_paths = cmix_paths_from_args(
      std::env::args_os()
        .skip(1)
        .map(|argument| argument.to_string_lossy().into_owned()),
      &cwd,
    );
    builder = builder
      .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
        let paths = cmix_paths_from_args(args, &cwd);
        if paths.is_empty() {
          return;
        }
        queue_cmix_paths(app, &paths);
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.unminimize();
          let _ = window.set_focus();
        }
        let _ = app.emit("circlemix-open-cmix", ());
      }))
      .manage(PendingCmixPaths(Mutex::new(initial_paths)));
  }

  let builder = builder.setup(|app| {
    #[cfg(desktop)]
    app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
    Ok(())
  });

  #[cfg(desktop)]
  let builder = builder.invoke_handler(tauri::generate_handler![
    check_desktop_update,
    install_desktop_update,
    take_desktop_cmix_paths,
    read_desktop_cmix_file
  ]);

  #[cfg(mobile)]
  let builder = builder.invoke_handler(tauri::generate_handler![android_shell_info]);

  builder
    .run(tauri::generate_context!())
    .expect("error while running CIRCLE MIX");
}
