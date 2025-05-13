import type React from "react";

export const Hamburger: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Menu"
			role="img"
			{...props}
		>
			<path
				d="M3 5H21.46M3 12.1H21.46M3 19.2H21.46"
				stroke="black"
				strokeWidth="0.5"
			/>
		</svg>
	);
};

export default Hamburger;
