use once_cell::sync::OnceCell;
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, source::Source};
use std::{
    ffi::CStr,
    fs::File,
    io::BufReader,
    os::raw::c_char,
    sync::mpsc::{self, Sender},
    thread,
};

static AUDIO_TX: OnceCell<Sender<String>> = OnceCell::new();

fn spawn_audio_thread() -> Sender<String> {
    let (tx, rx) = mpsc::channel::<String>();

    // Spawn a dedicated thread that owns the device sink and decodes/plays files.
    thread::spawn(move || {
        // Try to open the default device sink once.
        let mixer_sink: MixerDeviceSink = match DeviceSinkBuilder::open_default_sink() {
            Ok(s) => s,
            Err(e) => {
                eprintln!("audio: failed to open default sink: {}", e);
                return; // cannot play anything
            }
        };

        // Loop and handle file requests.
        for path in rx {
            // open file
            match File::open(&path) {
                Ok(f) => {
                    let reader = BufReader::new(f);

                    // Decode using rodio's Decoder (Symphonia backend).
                    match Decoder::try_from(reader) {
                        Ok(source) => {
                            // Add to the mixer; this is non-blocking.
                            mixer_sink.mixer().add(source);
                        }
                        Err(e) => {
                            eprintln!("audio: decode error for '{}': {}", path, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("audio: failed to open '{}': {}", path, e);
                }
            }
        }

        // channel closed -> thread exits
    });

    tx
}

fn get_audio_sender() -> &'static Sender<String> {
    AUDIO_TX.get_or_init(spawn_audio_thread)
}

/// Exported FFI function: enqueue the path and return immediately.
///
/// Returns 0 on success, 1 on invalid path, 2 on audio thread failure.
///
/// Safety: `path` must be a valid, null-terminated C string.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn play_audio(path: *const c_char) -> i32 {
    if path.is_null() {
        return 1;
    }

    // Convert C string -> Rust String. If conversion fails, just return.
    let cstr = unsafe { CStr::from_ptr(path) };
    let path_str = match cstr.to_str() {
        Ok(s) => s.to_owned(),
        Err(_) => {
            eprintln!("audio: invalid UTF-8 path passed");
            return 1;
        }
    };

    // Send to audio thread; ignore send failure (means thread exited).
    let sender = get_audio_sender();
    if sender.send(path_str).is_err() {
        eprintln!("audio: audio thread not available");
        return 2;
    }

    0
}
