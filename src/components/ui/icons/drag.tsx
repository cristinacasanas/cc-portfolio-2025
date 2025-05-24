import type React from "react";

export const Drag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="26"
			height="25"
			viewBox="0 0 26 25"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Drag"
			role="img"
			{...props}
		>
			<g opacity="0.4">
				<path
					d="M10.3913 18.7609V23.9783H25V1.02173H10.3913V6.23912M10.3913 6.23912H19.7826V18.7609H1V6.23912H10.3913Z"
					stroke="black"
					stroke-width="0.521739"
				/>
			</g>
		</svg>
	);
};

export default Drag;
