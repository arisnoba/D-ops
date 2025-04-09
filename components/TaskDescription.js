import { memo } from 'react';

const TaskDescription = memo(({ title, description }) => {
	return (
		<div className="w-full h-full flex flex-col">
			<div className="text-sm text-gray-900 dark:text-gray-100">{title}</div>
			{description && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1 group-hover:text-blue-500 dark:group-hover:text-blue-400">{description}</div>}
		</div>
	);
});

TaskDescription.displayName = 'TaskDescription';

export default TaskDescription;
