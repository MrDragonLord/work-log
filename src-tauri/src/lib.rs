mod commands;
mod domain;
mod storage;
mod tray;

use tauri::{Manager, WindowEvent};

use storage::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Database::initialize(app.handle())?);
            tray::initialize(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_project,
            commands::create_workspace,
            commands::delete_project,
            commands::delete_time_entry,
            commands::delete_workspace,
            commands::list_active_time_entries,
            commands::list_project_time_entries,
            commands::list_projects,
            commands::list_time_entries_between,
            commands::list_workspaces,
            commands::resume_time_entry,
            commands::start_time_entry,
            commands::stop_time_entry,
            commands::update_project,
            commands::update_time_entry,
            commands::update_workspace,
            tray::confirm_application_exit,
            tray::set_tray_locale,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
