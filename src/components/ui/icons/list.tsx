import type React from "react";

export const List: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="24"
			height="23"
			viewBox="0 0 24 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="List"
			role="img"
			{...props}
		>
			<path
				d="M23.7275 0.506531V8.68817H0.272461V0.506531H23.7275Z"
				fill="black"
				stroke="black"
				stroke-width="0.545455"
			/>
		</svg>
	);
};

export default List;
