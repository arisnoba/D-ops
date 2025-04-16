import React from 'react';
import { memo } from 'react';

const TaskDescription = memo(({ title, description }) => {
	const hasDollarSign = description?.includes('$');

	return (
		<div className="w-full h-full flex flex-col">
			<div className="text-sm text-gray-900 dark:text-gray-100">{title}</div>
			{description && (
				<div
					className={`mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1 ${
						hasDollarSign ? 'text-yellow-600 dark:text-green-700 font-medium' : ''
					} group-hover:text-blue-500 dark:group-hover:text-blue-400`}>
					{description}
				</div>
			)}
		</div>
	);
});

TaskDescription.displayName = 'TaskDescription';

export default TaskDescription;
