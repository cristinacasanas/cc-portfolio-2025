import type React from "react";

interface ListIconProps extends React.SVGProps<SVGSVGElement> {
	isActive?: boolean;
}

export const List: React.FC<ListIconProps> = ({
	isActive = false,
	...props
}) => {
	return isActive ? (
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
			<mask id="path-1-inside-1_438_98" fill="white">
				<path d="M24 22.0476V22.5931H0V22.0476H24ZM24 15.3339V15.8793H0V15.3339H24Z" />
				<path d="M0 0.0611725H24V8.78845H0V0.0611725Z" />
			</mask>
			<path
				d="M24 22.0476V22.5931H0V22.0476H24ZM24 15.3339V15.8793H0V15.3339H24Z"
				fill="black"
			/>
			<path d="M0 0.0611725H24V8.78845H0V0.0611725Z" fill="black" />
			<path
				d="M24 22.0476V22.5931H0V22.0476H24ZM24 15.3339V15.8793H0V15.3339H24Z"
				stroke="black"
				stroke-width="1.09091"
				mask="url(#path-1-inside-1_438_98)"
			/>
			<path
				d="M0 0.0611725H24V8.78845H0V0.0611725Z"
				stroke="black"
				stroke-width="1.09091"
				mask="url(#path-1-inside-1_438_98)"
			/>
		</svg>
	) : (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="List inactive"
			role="img"
			{...props}
		>
			<mask id="path-1-inside-1_438_99" fill="white">
				<path d="M24 22.7019V23.2473H0V22.7019H24ZM24 15.9881V16.5336H0V15.9881H24Z" />
				<path d="M0 0.715408H24V9.44268H0V0.715408Z" />
			</mask>
			<path
				d="M24 22.7019V23.2473H0V22.7019H24ZM24 15.9881V16.5336H0V15.9881H24Z"
				fill="black"
			/>
			<path
				d="M24 22.7019V23.2473H0V22.7019H24ZM24 15.9881V16.5336H0V15.9881H24Z"
				stroke="black"
				stroke-width="1.09091"
				mask="url(#path-1-inside-1_438_99)"
			/>
			<path
				d="M0 0.715408H24V9.44268H0V0.715408Z"
				stroke="black"
				stroke-width="1.09091"
				mask="url(#path-1-inside-1_438_99)"
			/>
		</svg>
	);
};

export default List;
