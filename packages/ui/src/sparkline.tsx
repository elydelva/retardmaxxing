import React, { useMemo } from "react";

interface SparklineProps {
	data: number[];
	color?: string;
	width?: number;
	height?: number;
}

export const Sparkline = React.memo(
	({ data, color = "#78716c", width = 100, height = 30 }: SparklineProps) => {
		const points = useMemo(() => {
			const max = Math.max(...data);
			const min = Math.min(...data);
			const range = max - min || 1;

			return data
				.map((val, i) => {
					const x = (i / (data.length - 1)) * width;
					const y = height - ((val - min) / range) * height;
					return `${x},${y}`;
				})
				.join(" ");
		}, [data, width, height]);

		return (
			<svg
				width={width}
				height={height}
				className="overflow-visible"
				aria-hidden="true"
			>
				<polyline
					fill="none"
					stroke={color}
					strokeWidth="2"
					points={points}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		);
	},
);

Sparkline.displayName = "Sparkline";
