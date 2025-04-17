import React from 'react';

export default function RadioGroup({ options, value, onChange, label, required, variant = 'dark', className = '', ...props }) {
	const variants = {
		dark: {
			container: 'grid grid-flow-col auto-cols-fr items-center self-stretch rounded-lg bg-neutral-800 p-1',
			button: isSelected => `
        flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out 
        border-none text-white px-3 h-10
        ${isSelected ? 'bg-neutral-950' : 'hover:bg-neutral-900'}
      `,
		},
		light: {
			container: 'grid grid-flow-col auto-cols-fr items-center self-stretch rounded-lg bg-gray-100 dark:bg-neutral-800 p-1',
			button: isSelected => `
        flex items-center justify-center gap-2 rounded-lg bg-clip-border duration-200 ease-out 
        border-none text-gray-700 dark:text-white px-3  
        ${isSelected ? 'bg-white dark:bg-neutral-950 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-neutral-900'}
      `,
		},
	};

	return (
		<div className={className}>
			{label && (
				<label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div className={variants[variant].container}>
				{options.map(option => (
					<button key={option.value} type="button" onClick={() => onChange(option.value)} className={variants[variant].button(value === option.value)} {...props}>
						<div className="flex items-center gap-2">
							{option.icon && <span className={option.iconClassName}>{option.icon}</span>}
							<p>{option.label}</p>
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
