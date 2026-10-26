import { useState } from "react";
import { PlayCircle, Trash2, UploadCloud, X, Youtube } from "lucide-react";
import { youtubeId, type LessonVideo } from "./teaching-types";

/** Responsive 16:9 player for a module's YouTube or uploaded video. */
export function LessonVideoPlayer({ video, caption }: { video: LessonVideo; caption?: string }) {
  return (
    <figure className="lv-player">
      <div className="lv-frame">
        {video.kind === "youtube"
          ? <iframe src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?rel=0&modestbranding=1`} title={video.title || caption || "Lesson video"} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          : <video controls preload="metadata" playsInline controlsList="nodownload" src={`/api/files/${video.file_id}`} />}
      </div>
      <figcaption>
        {video.kind === "youtube" ? <Youtube size={15} /> : <PlayCircle size={15} />}
        <span>{video.title || caption || (video.kind === "youtube" ? "YouTube video" : video.name)}</span>
      </figcaption>
    </figure>
  );
}

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
/** Uploads with progress (fetch cannot report upload progress). */
function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-file-name", file.name);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { let body: { id?: string; error?: string } = {}; try { body = JSON.parse(xhr.responseText); } catch { /* handled below */ } xhr.status === 201 && body.id ? resolve(body.id) : reject(new Error(body.error || "The video could not be uploaded.")); };
    xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    xhr.send(file);
  });
}

/** Lets a trainer attach a YouTube link or upload an MP4/WebM to a module, with a live preview. */
export function LessonVideoEditor({ video, onChange }: { video?: LessonVideo; onChange: (v: LessonVideo | undefined) => void }) {
  const [mode, setMode] = useState<"none" | "youtube" | "file">(video?.kind ?? "none");
  const [link, setLink] = useState(video?.kind === "youtube" ? `https://youtu.be/${video.youtube_id}` : "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const choose = (next: typeof mode) => { setMode(next); setError(""); if (next === "none") onChange(undefined); };
  const upload = async (file: File) => {
    setError("");
    if (!["video/mp4", "video/webm"].includes(file.type)) return setError("Choose an MP4 or WebM video.");
    if (file.size > MAX_VIDEO_BYTES) return setError("Videos must be 500 MB or smaller. Long recordings work best on YouTube.");
    setProgress(0);
    try { onChange({ kind: "file", file_id: await uploadWithProgress(file, setProgress), name: file.name }); }
    catch (e) { setError((e as Error).message); } finally { setProgress(null); }
  };
  return (
    <div className="lv-editor">
      <div className="lv-tabs" role="radiogroup" aria-label="Lesson video">
        {([["none", "No video"], ["youtube", "YouTube link"], ["file", "Upload video"]] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={mode === value} className={mode === value ? "on" : ""} onClick={() => choose(value)}>
            {value === "youtube" ? <Youtube size={14} /> : value === "file" ? <UploadCloud size={14} /> : <X size={14} />} {label}
          </button>
        ))}
      </div>
      {mode === "youtube" && (
        <div className="lv-field">
          <input value={link} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube link" maxLength={300} onChange={(e) => {
            setLink(e.target.value);
            const id = youtubeId(e.target.value);
            setError(e.target.value && !id ? "That doesn't look like a YouTube video link." : "");
            if (id) onChange({ kind: "youtube", youtube_id: id }); else if (video?.kind === "youtube") onChange(undefined);
          }} />
        </div>
      )}
      {mode === "file" && !(video?.kind === "file") && (
        <label className={`lv-drop ${progress !== null ? "busy" : ""}`}>
          <input type="file" accept="video/mp4,video/webm" hidden disabled={progress !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          <UploadCloud size={26} />
          <strong>{progress !== null ? `Uploading… ${progress}%` : "Choose a video to upload"}</strong>
          <small>MP4 or WebM, up to 500 MB</small>
          {progress !== null && <span className="lv-progress"><span style={{ width: `${progress}%` }} /></span>}
        </label>
      )}
      {error && <p className="lv-error" role="alert">{error}</p>}
      {video && mode === video.kind && (
        <div className="lv-preview">
          <LessonVideoPlayer video={video} />
          <button type="button" className="hub-button danger" onClick={() => { onChange(undefined); setLink(""); }}><Trash2 size={14} /> Remove video</button>
        </div>
      )}
    </div>
  );
}
