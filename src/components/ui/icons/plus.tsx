import type React from "react";

export const Plus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="17"
			height="17"
			viewBox="0 0 17 17"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Plus"
			role="img"
			{...props}
		>
			<path d="M8.625 2.34668V14.6533" stroke="black" stroke-width="0.333333" />
			<path
				d="M2.34766 8.37695H14.6543"
				stroke="black"
				stroke-width="0.333333"
			/>
		</svg>
	);
};

export default Plus;
