import { motion } from "framer-motion";
import type React from "react";

interface PlusProps extends React.SVGProps<SVGSVGElement> {
	isOpen?: boolean;
}

export const Plus: React.FC<PlusProps> = ({ isOpen = false, ...props }) => {
	return (
		<svg
			width="17"
			height="17"
			viewBox="0 0 17 17"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label={isOpen ? "Minus" : "Plus"}
			role="img"
			{...props}
		>
			<path
				d="M2.34766 8.37695H14.6543"
				stroke="black"
				strokeWidth="0.333333"
			/>

			<motion.path
				d="M8.625 2.34668V14.6533"
				stroke="black"
				strokeWidth="0.333333"
				initial={false}
				animate={{
					scaleY: isOpen ? 0 : 1,
				}}
				transition={{ duration: 0.3 }}
				style={{ transformOrigin: "center" }}
			/>
		</svg>
	);
};

export default Plus;
