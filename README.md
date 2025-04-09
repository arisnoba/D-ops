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
   git clone https://github.com/arisnoba/d-ops.git
   cd d-ops
   ```

2. 의존성 설치

   ```
   npm install
   ```

3. 환경 변수 설정
   `.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Supabase 키를 설정합니다:

   ```
   cp .env.example .env.local
   ```

   그리고 `.env.local` 파일을 편집하여 실제 Supabase URL과 익명 키를 입력하세요:

   ```
   NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

   **주의: `.env.local` 파일은 절대 Git 저장소에 커밋하지 마세요!**

4. 개발 서버 실행

   ```
   npm run dev
   ```

5. 브라우저에서 `http://localhost:3000` 접속

## Supabase 설정

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. 테이블 생성을 위한 SQL 실행:
   -  `clients_table.sql` 파일의 SQL을 실행하여 클라이언트 테이블 생성
   -  다음 SQL을 실행하여 업무 테이블 생성:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  hours DECIMAL(10, 2) NOT NULL,
  price_per_hour INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id INTEGER REFERENCES clients(id)
);
```

3. 보안 설정을 위한 Row Level Security 적용:
   -  `supabase_rls_policies.sql` 파일의 SQL을 실행하여 인증된 사용자만 데이터에 접근할 수 있도록 설정

## 보안 모범 사례

1. 환경 변수 관리

   -  `.env.local` 파일은 `.gitignore`에 포함하여 Git에 커밋되지 않도록 합니다
   -  민감한 키나 비밀번호는 환경 변수로 관리하고 코드에 하드코딩하지 않습니다

2. Supabase 보안

   -  Row Level Security(RLS) 정책을 사용하여 데이터 접근을 제한합니다
   -  `service_role` 키는 절대 클라이언트 측 코드에 노출하지 않습니다
   -  Supabase 익명 키는 주기적으로 교체합니다

3. 입력 유효성 검사
   -  모든 사용자 입력은 서버 측과 클라이언트 측 모두에서 검증합니다
   -  SQL 인젝션 및 XSS 공격을 방지하기 위해 입력을 항상 검증합니다

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
├── .env.example      # 환경 변수 예시 파일
├── supabase_rls_policies.sql # Supabase RLS 정책
└── README.md         # 프로젝트 설명
```
