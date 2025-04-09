import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// 포털 컴포넌트를 클라이언트 사이드에서만 렌더링
const TooltipPortal = ({ children }) => {
	const [mounted, setMounted] = useState(false);
	const portalRoot = useRef(null);

	useEffect(() => {
		// 서버 사이드 렌더링에서는 document가 없음
		if (typeof document !== 'undefined') {
			// 기존 포털 노드 확인
			let portalNode = document.getElementById('tooltip-portal');

			// 없으면 생성
			if (!portalNode) {
				portalNode = document.createElement('div');
				portalNode.id = 'tooltip-portal';
				document.body.appendChild(portalNode);
			}

			portalRoot.current = portalNode;
			setMounted(true);
		}

		// 클린업 (컴포넌트 언마운트 시에는 노드를 제거하지 않음)
		return () => {
			// 포털 자체는 유지 (여러 툴팁이 공유할 수 있음)
		};
	}, []);

	// 마운트된 경우에만 포털 렌더링
	return mounted && portalRoot.current ? createPortal(children, portalRoot.current) : null;
};

const TaskTooltip = memo(({ content, position, isVisible }) => {
	// CSS 변수를 위한 DOM 참조
	const tooltipRef = useRef(null);

	// 툴팁 스타일 - 간소화
	const tooltipStyle = {
		position: 'fixed',
		zIndex: 9999,
		left: `${position.x}px`,
		top: `${position.y}px`,
		display: isVisible ? 'block' : 'none',
		maxWidth: '260px',
		backgroundColor: 'var(--tooltip-bg, white)',
		border: '1px solid var(--tooltip-border, #e2e8f0)',
		borderRadius: '0.375rem',
		boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
		padding: '0.75rem',
		pointerEvents: 'none', // 툴팁이 마우스 이벤트를 차단하지 않음
	};

	// 다크 모드 감지 및 CSS 변수 설정
	useEffect(() => {
		if (!tooltipRef.current || typeof document === 'undefined') return;

		const isDarkMode = document.documentElement.classList.contains('dark');
		tooltipRef.current.style.setProperty('--tooltip-bg', isDarkMode ? '#1e1e1e' : 'white');
		tooltipRef.current.style.setProperty('--tooltip-border', isDarkMode ? '#333' : '#e2e8f0');
	}, [isVisible]);

	// 포털 없이 직접 렌더링 (디버깅을 위해)
	return (
		<div ref={tooltipRef} style={tooltipStyle} className="tooltip" aria-hidden={!isVisible}>
			<div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{content}</div>
		</div>
	);
});

TaskTooltip.displayName = 'TaskTooltip';

export default TaskTooltip;
