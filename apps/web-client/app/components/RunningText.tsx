'use client';

interface RunningTextProps {
    texts?: string[];
    color?: string;
    bgColor?: string;
    speed?: number; // 1 to 20
}

export const RunningText = ({ texts = [], color, bgColor, speed = 10 }: RunningTextProps) => {
    const content = texts.length > 0
        ? texts.join(' | ')
        : "Mohon luruskan dan rapatkan shaf. | Matikan alat komunikasi.";

    // Speed factor: default is 10. 1 is very slow, 20 is very fast.
    const baseDuration = Math.max(20, content.length / 5);
    const speedFactor = speed / 10;
    const duration = baseDuration / speedFactor;

    return (
        <div
            className="overflow-hidden whitespace-nowrap w-full h-full flex items-center"
            style={{ backgroundColor: bgColor, color: color }}
            role="marquee"
            aria-label={`Pengumuman masjid: ${content}`}
        >
            <div
                className="inline-block will-change-transform"
                style={{
                    animation: `marquee-scroll ${duration}s linear infinite`,
                }}
            >
                <span className="text-xl font-bold px-4 tracking-wider uppercase">
                    {content}
                </span>
            </div>
        </div>
    );
};
