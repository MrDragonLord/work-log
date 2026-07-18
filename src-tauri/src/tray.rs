use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, Runtime, State,
};

use crate::{
    domain::{CommandError, CommandResult},
    storage::Database,
};

pub const EXIT_CONFIRMATION_REQUESTED_EVENT: &str = "worklog://exit-confirmation-requested";

const HIDE_MENU_ID: &str = "hide";
const QUIT_MENU_ID: &str = "quit";
const SHOW_MENU_ID: &str = "show";

pub struct TrayMenuState {
    hide: MenuItem<tauri::Wry>,
    quit: MenuItem<tauri::Wry>,
    show: MenuItem<tauri::Wry>,
}

pub fn initialize(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let is_russian = sys_locale::get_locale()
        .map(|locale| locale.to_lowercase().starts_with("ru"))
        .unwrap_or(false);
    let labels = tray_labels(is_russian);
    let show = MenuItem::with_id(app, SHOW_MENU_ID, labels.show, true, None::<&str>)?;
    let hide = MenuItem::with_id(app, HIDE_MENU_ID, labels.hide, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, QUIT_MENU_ID, labels.quit, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

    TrayIconBuilder::new()
        .icon(
            app.default_window_icon()
                .ok_or("Application icon is missing")?
                .clone(),
        )
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            SHOW_MENU_ID => show_main_window(app),
            HIDE_MENU_ID => hide_main_window(app),
            QUIT_MENU_ID => request_application_exit(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    app.manage(TrayMenuState { hide, quit, show });
    Ok(())
}

#[tauri::command]
pub fn confirm_application_exit(
    app: AppHandle,
    database: State<'_, Database>,
) -> CommandResult<()> {
    database.stop_all_active_time_entries()?;
    app.exit(0);
    Ok(())
}

#[tauri::command]
pub fn set_tray_locale(
    locale: String,
    state: tauri::State<'_, TrayMenuState>,
) -> CommandResult<()> {
    let labels = tray_labels(locale.to_lowercase().starts_with("ru"));
    state
        .show
        .set_text(labels.show)
        .map_err(|error| CommandError::internal(error.to_string()))?;
    state
        .hide
        .set_text(labels.hide)
        .map_err(|error| CommandError::internal(error.to_string()))?;
    state
        .quit
        .set_text(labels.quit)
        .map_err(|error| CommandError::internal(error.to_string()))?;
    Ok(())
}

fn hide_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn request_application_exit(app: &AppHandle) {
    let database = app.state::<Database>();
    let active_timers = match database.list_active_time_entries() {
        Ok(active_timers) => active_timers,
        Err(_) => return,
    };

    if active_timers.is_empty() {
        app.exit(0);
        return;
    }

    show_main_window(app);
    let _ = app.emit(
        EXIT_CONFIRMATION_REQUESTED_EVENT,
        ExitConfirmationRequested {
            active_timer_count: active_timers.len(),
        },
    );
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

struct TrayLabels {
    hide: &'static str,
    quit: &'static str,
    show: &'static str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExitConfirmationRequested {
    active_timer_count: usize,
}

fn tray_labels(is_russian: bool) -> TrayLabels {
    if is_russian {
        TrayLabels {
            hide: "Скрыть",
            quit: "Выход",
            show: "Открыть",
        }
    } else {
        TrayLabels {
            hide: "Hide",
            quit: "Quit",
            show: "Open",
        }
    }
}
