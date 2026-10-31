import { facePosition } from "./face-position";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { Camera, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
export type Departure = "tab" | "fullscreen" | "camera";
/** Turns on the camera and full screen before an attempt starts. The camera feed stays on this device; nothing is recorded. */
export async function startProctoring(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("This browser can't use a camera. Use a laptop or phone with a camera to take assessments.");
    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 } }, audio: false });
    }
    catch (e) {
        throw new Error((e as DOMException).name === "NotAllowedError" ? "Allow camera access to take this assessment. Your camera must stay on until you submit." : "No working camera was found. A camera is required for quizzes and exams.");
    }
    if (document.fullscreenEnabled && !document.fullscreenElement)
        await document.documentElement.requestFullscreen().catch(() => { });
    return stream;
}
/**
 * Keeps an open attempt supervised: blocks leaving the page, reports camera loss and leaving full screen,
 * and releases the camera when the attempt ends.
 */
export function useProctoring(active: boolean, onDeparture: (reason: Departure) => void) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const ending = useRef(false);
    const report = useRef(onDeparture);
    report.current = onDeparture;
    const blocker = useBlocker(active);
    useEffect(() => {
        if (blocker.state !== "blocked")
            return;
        blocker.reset();
        if (!ending.current) report.current("tab");
    }, [blocker.state]);
    useEffect(() => {
        if (!active)
            return;
        const warn = () => { if (!ending.current) report.current("tab"); };
        const hidden = () => { if (document.visibilityState === "hidden" && !ending.current) report.current("tab"); };
        const fullscreen = () => { if (!ending.current && document.fullscreenEnabled && !document.fullscreenElement)
            report.current("fullscreen"); };
        window.addEventListener("beforeunload", warn);
        document.addEventListener("visibilitychange", hidden);
        document.addEventListener("fullscreenchange", fullscreen);
        return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("visibilitychange", hidden); document.removeEventListener("fullscreenchange", fullscreen); };
    }, [active]);
    useEffect(() => {
        const track = stream?.getVideoTracks()[0];
        if (!track)
            return;
        const lost = () => { if (ending.current)
            return; setStream(null); report.current("camera"); };
        track.addEventListener("ended", lost);
        return () => track.removeEventListener("ended", lost);
    }, [stream]);
    const release = (s: MediaStream | null) => { s?.getTracks().forEach((t) => t.stop()); if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => { }); };
    useEffect(() => { if (active)
        ending.current = false;
    else if (stream) {
        release(stream);
        setStream(null);
    } }, [active]);
    const current = useRef<MediaStream | null>(null);
    current.current = stream;
    useEffect(() => () => { ending.current = true; release(current.current); }, []);
    return {
        stream,
        attach: (s: MediaStream) => { ending.current = false; setStream(s); },
        /** Call before submitting so the camera and full-screen exit are not counted as departures. */
        end: () => { ending.current = true; release(stream); setStream(null); },
    };
}
export function ProctorCamera({ stream }: { stream: MediaStream }) {
    useSiteLanguage();
    const video = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState("Starting position check…");
    const [position, setPosition] = useState<{left: string; top: string; width: string; height: string} | null>(null);
    useEffect(() => {
        if (video.current) video.current.srcObject = stream;
        let stopped = false;
        let detector: import('@mediapipe/tasks-vision').FaceDetector | undefined;
        let timer: number | undefined;
        const unavailable = () => { setPosition(null); setStatus("Position check unavailable — keep your face visible"); };
        void (async () => {
            try {
                const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
                detector = await FaceDetector.createFromOptions(await FilesetResolver.forVisionTasks('/mediapipe'), {
                    baseOptions: { modelAssetPath: '/models/face-detector.tflite' },
                    runningMode: 'VIDEO', minDetectionConfidence: .6,
                });
                if (stopped) { detector.close(); return; }
                // Two small camera checks a second keep the preview useful without analysing every frame.
                timer = window.setInterval(() => {
                    const element = video.current;
                    if (!element || element.readyState < 2 || !detector) return;
                    try {
                        const boxes = detector.detectForVideo(element, performance.now()).detections.flatMap(d => d.boundingBox ? [d.boundingBox] : []);
                        setStatus(facePosition(boxes, element.videoWidth, element.videoHeight));
                        const b = boxes.length === 1 ? boxes[0] : null;
                        setPosition(b ? { left: `${100 - (b.originX + b.width) / element.videoWidth * 100}%`, top: `${b.originY / element.videoHeight * 100}%`, width: `${b.width / element.videoWidth * 100}%`, height: `${b.height / element.videoHeight * 100}%` } : null);
                    } catch { window.clearInterval(timer); unavailable(); }
                }, 500);
            } catch { if (!stopped) unavailable(); }
        })();
        return () => { stopped = true; window.clearInterval(timer); detector?.close(); };
    }, [stream]);
    return <div className={`pr-camera ${status === "Face in position" ? "in-position" : "adjust-position"}`} aria-label={translateUi("Assessment camera")}>
      <div className="pr-preview"><video ref={video} autoPlay muted playsInline/><div className="pr-face-guide" aria-hidden="true"/>{position && <div className="pr-face-position" style={position} aria-hidden="true"/>}</div>
      <span role="status">{translateUi(status)}</span>
      <small>{translateUi("On-device check · not recorded")}</small>
    </div>;
}
/** Shown when an attempt is open but the camera is off (for example after a reload); questions stay hidden. */
export function CameraRequired({ onEnable }: {
    onEnable: () => Promise<void>;
}) {
    useSiteLanguage();
    const [busy, setBusy] = useState(false);
    return (<div className="pr-required" role="alert">
      <ShieldAlert size={28}/>
      <h3>{translateUi("Turn your camera back on to continue")}</h3>
      <p>{translateUi("Your timer is still running. Questions are hidden until the camera is on and the assessment is in full screen.")}</p>
      <button className="hub-button" disabled={busy} onClick={async () => { setBusy(true); try {
        await onEnable();
    }
    catch (e) {
        toast.error(translateUi((e as Error).message));
    }
    finally {
        setBusy(false);
    } }}><Camera size={16}/>{translateUi(" Turn on camera")}</button>
    </div>);
}
export const departureLabel: Record<Departure, string> = { tab: "You left the assessment tab", fullscreen: "You left full screen", camera: "Your camera turned off" };
