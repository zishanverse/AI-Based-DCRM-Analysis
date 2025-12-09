import React from 'react';
import { ReferenceArea } from 'recharts';

interface ShapWindow {
    start_ms: number;
    end_ms: number;
}

interface ShapOverlayProps {
    windows: ShapWindow[];
    scores: number[]; // 0-1 values
    color: string;
    visible: boolean;
}

export const ShapOverlay: React.FC<ShapOverlayProps> = ({ windows, scores, color, visible }) => {
    if (!visible || !windows || !scores) return null;

    return (
        <>
            {windows.map((win, idx) => {
                const rawScore = scores[idx] || 0;
                const opacity = rawScore * 0.8; // Increased max opacity to 0.8
                // console.log(`Overlay ${idx}: score=${rawScore}, opacity=${opacity}`); // Excessive logs commented out
                if (opacity < 0.01) return null; // Lowered threshold to 0.01

                return (
                    <ReferenceArea
                        key={`shap-${idx}`}
                        x1={win.start_ms}
                        x2={win.end_ms}
                        fill={color}
                        fillOpacity={opacity}
                        stroke="none"
                        ifOverflow="extendDomain"
                        isFront={false} // Render behind lines
                    />
                );
            })}
        </>
    );
};
