# Bob 지출 관리 시스템 PRD (Product Requirements Document)

## Next.js + Tailwind CSS + Supabase 마이그레이션 버전

### 📋 프로젝트 개요

**프로젝트명**: Bob 지출 관리 시스템  
**현재 상태**: Firebase + Vanilla JS + Bootstrap 기반 완성된 시스템  
**마이그레이션 목표**: Next.js + Tailwind CSS + Supabase 기반 현대적 웹 애플리케이션  
**사용자**: 5명의 고정 사용자 (유재욱, 신성원, 김정현, 김정민, 권순신)  
**목적**: 공동 지출 관리 및 정산 자동화

---

## 🎯 핵심 요구사항

### 1. 인증 시스템

-  **현재 구현**: Firebase Authentication
-  **마이그레이션 후**: Supabase Auth
-  **접근 제한**: 특정 이메일(bob@siwol.com)만 접근 가능
-  **기능**:
   -  이메일/비밀번호 로그인
   -  로그인 상태 유지 (Remember Me)
   -  자동 토큰 갱신 (55분마다)
   -  세션 관리 (LOCAL/SESSION persistence)

### 2. 지출 관리 시스템

#### 2.1 일반 지출 등록

-  **지출 유형**: 식대, 기타
-  **입력 필드**:
   -  날짜 (기본값: 오늘)
   -  지출 유형 (라디오 버튼)
   -  제목 (자동완성 기능)
   -  결제자 선택
   -  사용자별 개별 금액 입력
-  **더치페이 기능**:
   -  총액 입력 후 참여자 선택
   -  자동 금액 분배
   -  참여자별 체크박스 선택
-  **결제자 필드 처리**:
   -  결제자 선택 시 해당 필드 비활성화
   -  다른 사용자 금액 합계를 음수로 자동 입력
   -  실시간 총액 계산 및 표시

#### 2.2 고정비 관리

-  **표시 방식**: `고정(제목)` 형태
-  **등록**: 별도 모달을 통한 등록
-  **자동 처리**: 매월 1일 자동 등록
-  **특징**:
   -  사용자별 개별 금액 설정 가능
   -  월별 보기에서만 표시 (전체 기간에서는 숨김)
   -  목록 최상단 고정 표시
   -  수정/삭제 시 전체 반영
-  **데이터 구조**: recurring_expenses 컬렉션 별도 관리

#### 2.3 생일 축하금 자동 관리

-  **표시 방식**: `[사용자명] 생일축하금`
-  **설정 기능**:
   -  각 사용자별 생일 월/일 설정
   -  축하금 금액 설정 (공통 금액, 기본값: 50,000원)
-  **자동 처리**:
   -  매월 1일 자동 체크 및 생성
   -  생일자 제외한 나머지 사용자가 축하금 분담
   -  생일자는 전체 축하금을 음수로 받음
   -  이미 지난 생일은 현재 연도와 다음 연도 모두 생성
-  **정렬**: 고정비 다음, 일반 지출 이전에 표시

### 3. 데이터 표시 및 필터링

#### 3.1 월별 필터링

-  **필터 옵션**: 전체 기간, 월별 선택
-  **네비게이션**: 이전달/이번달/다음달 빠른 이동 버튼
-  **동적 옵션**: 데이터 존재하는 월만 드롭다운에 표시

#### 3.2 정렬 우선순위

1. **고정 지출** (월별 보기에서만)
2. **생일 축하금**
3. **식대**
4. **기타**

-  동일 유형 내에서는 최신순 정렬

#### 3.3 실시간 계산

-  **사용자별 총액**: 실시간 계산 및 표시
-  **음수 표시**: 빨간색으로 마이너스 금액 표시
-  **전체 총액**: 하단 총계 행에 표시

### 4. 고급 기능

#### 4.1 자동완성 시스템

-  **대상**: 지출 제목 입력 필드
-  **기능**:
   -  이전 입력 제목 기반 자동완성
   -  최대 10개 항목 표시
   -  대소문자 구분 없는 실시간 검색
   -  HTML datalist 활용

#### 4.2 지출 내역 수정/삭제

-  **수정 기능**:
   -  기존 데이터 자동 로드
   -  결제자 변경 시 필드 자동 조정
   -  실시간 총액 재계산
-  **삭제 기능**: 확인 후 즉시 삭제
-  **제한**: 생일 축하금은 수정/삭제 불가

---

## 🗄️ 데이터베이스 구조

### 현재 Firestore 구조

```javascript
// expenses 컬렉션
{
  date: Timestamp,
  type: String, // '식대', '고정', '생일', '기타'
  title: String,
  payer: String, // 결제자 (일반 지출만)
  expenses: {
    유재욱: Number,
    신성원: Number,
    김정현: Number,
    김정민: Number,
    권순신: Number
  },
  total: Number,
  timestamp: Timestamp
}

// recurring_expenses 컬렉션
{
  type: '고정',
  title: String,
  expenses: Object,
  total: Number,
  createdAt: Timestamp
}

// birthdays 컬렉션
{
  settings: {
    amount: Number,
    birthdays: [
      {
        user: String,
        month: Number,
        day: Number
      }
    ]
  }
}
```

### Supabase 마이그레이션 스키마

```sql
-- expenses 테이블
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('식대', '고정', '생일', '기타')),
  title VARCHAR(255) NOT NULL,
  payer VARCHAR(50),
  user_amounts JSONB NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- recurring_expenses 테이블
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  user_amounts JSONB NOT NULL,
  total INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- birthday_settings 테이블
CREATE TABLE birthday_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(50) NOT NULL,
  birth_month INTEGER NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day INTEGER NOT NULL CHECK (birth_day BETWEEN 1 AND 31),
  amount INTEGER NOT NULL DEFAULT 50000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
```

---

## 🎨 UI/UX 개선 요구사항

### 현재 문제점 및 개선사항

#### 1. 반응형 디자인 개선

-  **현재**: Bootstrap 기반, 모바일 최적화 부족
-  **개선**: Tailwind CSS 기반 완전 반응형 디자인
-  **요구사항**:
   -  모바일 퍼스트 접근법
   -  태블릿/데스크톱 최적화
   -  터치 친화적 인터페이스

#### 2. 사용자 경험 향상

-  **로딩 상태**: 스켈레톤 UI 또는 로딩 스피너
-  **에러 처리**: 사용자 친화적 에러 메시지
-  **성공 피드백**: 토스트 알림 시스템
-  **폼 검증**: 실시간 입력 검증 및 피드백

#### 3. 시각적 개선

-  **다크 모드**: 시스템 설정 기반 자동 전환
-  **컬러 시스템**: 일관된 브랜드 컬러 적용
-  **타이포그래피**: 가독성 향상된 폰트 시스템
-  **아이콘**: 일관된 아이콘 시스템 (Heroicons 추천)

#### 4. 접근성 개선

-  **키보드 네비게이션**: 완전한 키보드 접근성
-  **스크린 리더**: ARIA 라벨 및 역할 정의
-  **색상 대비**: WCAG 2.1 AA 준수
-  **포커스 관리**: 명확한 포커스 표시

#### 5. 성능 최적화

-  **코드 분할**: 페이지별 코드 스플리팅
-  **이미지 최적화**: Next.js Image 컴포넌트 활용
-  **캐싱**: 적절한 캐싱 전략
-  **번들 크기**: 최소화된 JavaScript 번들

---

## 🏗️ 기술 스택 마이그레이션

### 현재 기술 스택

-  **Frontend**: Vanilla JavaScript, Bootstrap 5, HTML/CSS
-  **Backend**: Firebase (Auth, Firestore, Hosting)
-  **빌드 도구**: 없음 (정적 파일)

### 마이그레이션 후 기술 스택

-  **Framework**: Next.js 14+ (App Router)
-  **Language**: TypeScript
-  **Styling**: Tailwind CSS
-  **Backend**: Supabase (Auth, Database, Real-time)
-  **State Management**: Zustand 또는 React Context
-  **Form Handling**: React Hook Form + Zod
-  **UI Components**: Headless UI 또는 Radix UI
-  **Icons**: Heroicons
-  **Deployment**: Vercel

---

## 📱 컴포넌트 구조 설계

### 페이지 구조

```
app/
├── layout.tsx              # 루트 레이아웃
├── page.tsx               # 메인 대시보드
├── login/
│   └── page.tsx           # 로그인 페이지
└── settings/
    └── page.tsx           # 설정 페이지 (생일 설정 등)
```

### 주요 컴포넌트

```
components/
├── ui/                    # 기본 UI 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Select.tsx
│   └── Table.tsx
├── forms/                 # 폼 컴포넌트
│   ├── ExpenseForm.tsx
│   ├── FixedExpenseForm.tsx
│   └── BirthdaySettingsForm.tsx
├── expense/               # 지출 관련 컴포넌트
│   ├── ExpenseList.tsx
│   ├── ExpenseItem.tsx
│   ├── ExpenseFilters.tsx
│   └── ExpenseSummary.tsx
├── auth/                  # 인증 관련 컴포넌트
│   ├── LoginForm.tsx
│   └── AuthProvider.tsx
└── layout/                # 레이아웃 컴포넌트
    ├── Header.tsx
    ├── Navigation.tsx
    └── Footer.tsx
```

---

## 🔄 마이그레이션 단계별 계획

### Phase 1: 기반 설정 (1-2일)

-  [ ] Next.js 프로젝트 초기 설정
-  [ ] TypeScript 설정
-  [ ] Tailwind CSS 설정
-  [ ] Supabase 프로젝트 생성 및 설정
-  [ ] 기본 폴더 구조 생성

### Phase 2: 인증 시스템 (2-3일)

-  [ ] Supabase Auth 설정
-  [ ] 로그인 페이지 구현
-  [ ] 인증 상태 관리
-  [ ] 보호된 라우트 구현

### Phase 3: 데이터베이스 마이그레이션 (2-3일)

-  [ ] Supabase 테이블 생성
-  [ ] Firebase 데이터 마이그레이션 스크립트
-  [ ] 데이터 검증 및 테스트

### Phase 4: 핵심 기능 구현 (5-7일)

-  [ ] 지출 목록 표시
-  [ ] 일반 지출 등록/수정/삭제
-  [ ] 고정비 관리
-  [ ] 생일 축하금 자동 처리
-  [ ] 월별 필터링

### Phase 5: UI/UX 개선 (3-4일)

-  [ ] 반응형 디자인 적용
-  [ ] 다크 모드 구현
-  [ ] 로딩 상태 및 에러 처리
-  [ ] 접근성 개선

### Phase 6: 테스트 및 배포 (2-3일)

-  [ ] 단위 테스트 작성
-  [ ] E2E 테스트 구현
-  [ ] 성능 최적화
-  [ ] Vercel 배포 설정

---

## 🔐 보안 요구사항

### 인증 및 권한

-  **이메일 제한**: bob@siwol.com만 접근 허용
-  **세션 관리**: 자동 로그아웃 및 토큰 갱신
-  **API 보안**: Supabase RLS (Row Level Security) 활용

### 데이터 보안

-  **입력 검증**: 클라이언트 및 서버 사이드 검증
-  **XSS 방지**: 입력값 이스케이프 처리
-  **CSRF 방지**: Next.js 기본 보안 기능 활용

---

## 📊 성능 요구사항

### 로딩 성능

-  **초기 로딩**: 3초 이내
-  **페이지 전환**: 1초 이내
-  **데이터 로딩**: 2초 이내

### 사용자 경험

-  **반응성**: 모든 인터랙션 100ms 이내 반응
-  **오프라인**: 기본적인 읽기 기능 오프라인 지원
-  **실시간**: 데이터 변경 시 실시간 업데이트

---

## 🧪 테스트 요구사항

### 단위 테스트

-  **컴포넌트 테스트**: React Testing Library
-  **유틸리티 함수**: Jest
-  **커버리지**: 80% 이상

### 통합 테스트

-  **API 테스트**: Supabase 연동 테스트
-  **폼 테스트**: 전체 플로우 테스트

### E2E 테스트

-  **주요 플로우**: Playwright 또는 Cypress
-  **크로스 브라우저**: Chrome, Firefox, Safari

---

## 📈 모니터링 및 분석

### 에러 추적

-  **에러 모니터링**: Vercel Analytics 또는 Sentry
-  **성능 모니터링**: Web Vitals 추적

### 사용자 분석

-  **사용 패턴**: 기본적인 사용량 추적
-  **성능 메트릭**: 로딩 시간, 상호작용 지연

---

## 🚀 배포 및 DevOps

### 배포 환경

-  **개발**: Vercel Preview
-  **스테이징**: Vercel Production Branch
-  **프로덕션**: Vercel Main Branch

### CI/CD

-  **자동 배포**: GitHub Actions 또는 Vercel Git 연동
-  **테스트 자동화**: PR 시 자동 테스트 실행
-  **코드 품질**: ESLint, Prettier, TypeScript 검사

---

## 📋 체크리스트

### 개발 완료 기준

-  [ ] 모든 기존 기능 동일하게 작동
-  [ ] 반응형 디자인 완성
-  [ ] 접근성 요구사항 충족
-  [ ] 성능 요구사항 달성
-  [ ] 테스트 커버리지 80% 이상
-  [ ] 보안 요구사항 충족
-  [ ] 문서화 완료

### 런칭 준비 체크리스트

-  [ ] 데이터 마이그레이션 완료 및 검증
-  [ ] 사용자 교육 자료 준비
-  [ ] 롤백 계획 수립
-  [ ] 모니터링 설정 완료
-  [ ] 성능 벤치마크 완료

---

## 📞 개발자 가이드

### 시작하기

1. 현재 Firebase 프로젝트 분석 및 데이터 구조 파악
2. Supabase 프로젝트 생성 및 스키마 설계
3. Next.js 프로젝트 초기 설정
4. 기존 기능 우선순위별 마이그레이션

### 주의사항

-  기존 데이터 무결성 보장 필수
-  사용자별 금액 계산 로직 정확성 검증
-  생일 축하금 자동 생성 로직 철저한 테스트
-  월별 필터링 및 정렬 로직 정확성 확인

### 참고 자료

-  현재 구현된 script.js 파일 (1,232줄)
-  현재 HTML 구조 (503줄)
-  Firebase 데이터 구조 및 보안 규칙
-  기존 사용자 플로우 및 비즈니스 로직
