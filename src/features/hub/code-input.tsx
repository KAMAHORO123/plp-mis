import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useRef, useState } from "react";
// Six one-digit boxes; typing or pasting fills forward, Backspace moves back.
export function CodeInput({ value, onChange, disabled, }: {
    value: string;
    onChange: (code: string) => void;
    disabled?: boolean;
}) {
    useSiteLanguage();
    const boxes = useRef<(HTMLInputElement | null)[]>([]);
    const focus = (i: number) => boxes.current[Math.max(0, Math.min(5, i))]?.focus();
    return (<div className="code-input" role="group" aria-label={translateUi("6-digit code")}>
      {translateUi(Array.from({ length: 6 }, (_, i) => (<input key={i} ref={(el) => {
                boxes.current[i] = el;
            }} aria-label={translateUi("Digit {p0}", { p0: translateUi(i + 1) })} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} disabled={disabled} value={value[i] || ""} onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (!digits)
                    return;
                const next = (value.slice(0, i) +
                    digits +
                    value.slice(i + digits.length)).slice(0, 6);
                onChange(next);
                focus(i + digits.length);
            }} onKeyDown={(e) => {
                if (e.key === "Backspace") {
                    e.preventDefault();
                    if (value[i])
                        onChange(value.slice(0, i) + value.slice(i + 1));
                    else if (i > 0) {
                        onChange(value.slice(0, i - 1) + value.slice(i));
                        focus(i - 1);
                    }
                }
                else if (e.key === "ArrowLeft")
                    focus(i - 1);
                else if (e.key === "ArrowRight")
                    focus(i + 1);
            }} onPaste={(e) => {
                e.preventDefault();
                const digits = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);
                if (digits) {
                    onChange(digits);
                    focus(digits.length);
                }
            }}/>)))}
    </div>);
}
export function useCountdown() {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        if (!seconds)
            return;
        const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [seconds]);
    const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    return { seconds, label, start: () => setSeconds(60) };
}
