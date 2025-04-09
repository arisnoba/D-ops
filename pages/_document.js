import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="ko">
			<Head>
				<meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
				<meta key="description" name="description" content="디자인, 개발, 운영 업무를 효율적으로 관리하는 시스템" />
				<link key="favicon" rel="icon" href="/favicon.ico" />
				<script key="fontawesome" src="https://kit.fontawesome.com/ce8ef58cad.js" crossOrigin="anonymous"></script>
				<meta key="charset" charSet="utf-8" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
