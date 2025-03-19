# D-ops: 디자인/개발/운영 업무 관리 시스템

D-ops는 디자인, 개발, 운영 업무량을 기록하고 그에 따른 가격을 산출하는 웹 애플리케이션입니다.

## 기능

-  업무 등록 (디자인/개발/운영 카테고리별)
-  업무 시간 기록
-  카테고리별 시간당 단가 설정
-  총 가격 자동 계산
-  업무 목록 조회

## 기술 스택

-  **Frontend**: Next.js, React, TailwindCSS
-  **Backend**: Supabase (PostgreSQL)
-  **인증**: Supabase Auth

## 설치 및 실행

1. 저장소 클론

   ```
   git clone https://github.com/yourusername/d-ops.git
   cd d-ops
   ```

2. 의존성 설치

   ```
   npm install
   ```

3. 환경 변수 설정
   `.env.local` 파일에 Supabase 키를 설정합니다:

   ```
   NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. 개발 서버 실행

   ```
   npm run dev
   ```

5. 브라우저에서 `http://localhost:3000` 접속

## Supabase 설정

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. 다음 SQL을 실행하여 필요한 테이블 생성:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  hours DECIMAL(10, 2) NOT NULL,
  price_per_hour INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 프로젝트 구조

```
d-ops/
├── components/       # 재사용 가능한 컴포넌트
├── lib/              # 유틸리티 함수 및 설정
├── pages/            # 애플리케이션 페이지
│   ├── index.js      # 홈페이지
│   ├── _app.js       # 앱 공통 설정
│   └── tasks/        # 업무 관련 페이지
│       └── new.js    # 새 업무 등록 페이지
├── public/           # 정적 파일
├── styles/           # 스타일 파일
└── README.md         # 프로젝트 설명
```
