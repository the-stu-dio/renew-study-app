import os
import ssl
from pathlib import Path
import whisper
import imageio_ffmpeg as ffmpeg

VIDEO_DIR = Path('static/videos')
SUB_DIR = VIDEO_DIR / 'subtitles'
MODEL_NAME = 'base.en'

os.makedirs(SUB_DIR, exist_ok=True)

# Whisper needs to download a model the first time. The workspace TLS chain is
# intercepted here, so temporarily disable certificate verification for the
# download step only.
ssl._create_default_https_context = ssl._create_unverified_context

ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
ffmpeg_bin_dir = Path('/tmp/renew_ffmpeg_bin')
ffmpeg_bin_dir.mkdir(parents=True, exist_ok=True)
ffmpeg_link = ffmpeg_bin_dir / 'ffmpeg'
if ffmpeg_link.exists() or ffmpeg_link.is_symlink():
    ffmpeg_link.unlink()
os.symlink(ffmpeg_exe, ffmpeg_link)
os.environ['PATH'] = f"{ffmpeg_bin_dir}:{os.environ.get('PATH', '')}"

model = whisper.load_model(MODEL_NAME)
print('Loaded whisper model', MODEL_NAME)

mp4_files = sorted(VIDEO_DIR.glob('*.mp4'))
if not mp4_files:
    print('No mp4 files found in', VIDEO_DIR)
    exit(0)

for mp4 in mp4_files:
    name = mp4.stem
    vtt_path = SUB_DIR / (name + '.vtt')

    print('\nProcessing', mp4)
    print('Transcribing audio to segments...')
    result = model.transcribe(str(mp4), language='en', fp16=False)

    # write vtt
    print('Writing VTT to', vtt_path)
    with open(vtt_path, 'w', encoding='utf-8') as out:
        out.write('WEBVTT\n\n')
        for i, seg in enumerate(result.get('segments', []), start=1):
            start = seg['start']
            end = seg['end']
            def fmt(t):
                h = int(t // 3600)
                m = int((t % 3600) // 60)
                s = int(t % 60)
                ms = int((t - int(t)) * 1000)
                return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"
            out.write(f"{fmt(start)} --> {fmt(end)}\n")
            text = seg['text'].strip()
            out.write(text + '\n\n')

print('\nDone generating VTT files.')
