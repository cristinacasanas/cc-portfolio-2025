import type React from "react";

interface DragIconProps extends React.SVGProps<SVGSVGElement> {
	isActive?: boolean;
}

export const Drag: React.FC<DragIconProps> = ({
	isActive = false,
	...props
}) => {
	return isActive ? (
		<svg
			width="25"
			height="24"
			viewBox="0 0 25 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Drag active"
			role="img"
			{...props}
		>
			<mask id="path-1-inside-1_433_2940" fill="white">
				<path d="M0.5 5.73913H19.2826V18.2609H0.5V5.73913Z" />
				<path d="M9.8913 0.521744H24.5V23.4783H9.8913V0.521744Z" />
			</mask>
			<path d="M0.5 5.73913H19.2826V18.2609H0.5V5.73913Z" fill="black" />
			<path
				d="M0.5 5.73913H19.2826V18.2609H0.5V5.73913Z"
				stroke="black"
				strokeWidth="1.04348"
				mask="url(#path-1-inside-1_433_2940)"
			/>
			<path
				d="M9.8913 0.521744H24.5V23.4783H9.8913V0.521744Z"
				stroke="black"
				strokeWidth="1.04348"
				mask="url(#path-1-inside-1_433_2940)"
			/>
		</svg>
	) : (
		<svg
			width="26"
			height="25"
			viewBox="0 0 26 25"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Drag inactive"
			role="img"
			{...props}
		>
			<g opacity="0.4">
				<path
					d="M10.3913 18.7609V23.9783H25V1.02173H10.3913V6.23912M10.3913 6.23912H19.7826V18.7609H1V6.23912H10.3913Z"
					stroke="black"
					strokeWidth="0.521739"
				/>
			</g>
		</svg>
	);
};

export default Drag;
