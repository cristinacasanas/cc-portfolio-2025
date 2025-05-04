import type React from "react";

export const Close: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Close"
			role="img"
			{...props}
		>
			<path
				d="M7.34229 20.3966L20.3966 7.34231"
				stroke="black"
				strokeWidth="0.5"
			/>
			<path
				d="M20.3965 20.6577L7.3422 7.6034"
				stroke="black"
				strokeWidth="0.5"
			/>
		</svg>
	);
};

export default Close;
