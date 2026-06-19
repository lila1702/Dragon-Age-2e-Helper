import { useCallback, useEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function resizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}

export function AutoResizeTextarea({
    value,
    onChange,
    rows = 1,
    ...props
}: AutoResizeTextareaProps) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const syncHeight = useCallback(() => {
        if (ref.current) resizeTextarea(ref.current);
    }, []);

    useEffect(() => {
        syncHeight();
    }, [value, syncHeight]);

    return (
        <textarea
            ref={ref}
            rows={rows}
            value={value}
            onChange={(event) => {
                onChange?.(event);
                resizeTextarea(event.currentTarget);
            }}
            {...props}
        />
    );
}
