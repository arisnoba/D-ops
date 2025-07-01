-- Bob 지출 관리 시스템 테이블 생성

-- 지출 내역 테이블
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

-- 고정비 설정 테이블
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  user_amounts JSONB NOT NULL,
  total INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생일 설정 테이블
CREATE TABLE birthday_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(50) NOT NULL,
  birth_month INTEGER NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day INTEGER NOT NULL CHECK (birth_day BETWEEN 1 AND 31),
  amount INTEGER NOT NULL DEFAULT 50000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_name)
);

-- 인덱스 생성
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_birthday_settings_birth_month ON birthday_settings(birth_month);

-- RLS 활성화
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (인증된 사용자만 접근)
CREATE POLICY "인증된 사용자만 지출 조회 가능" ON expenses
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 지출 추가 가능" ON expenses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 지출 수정 가능" ON expenses
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 지출 삭제 가능" ON expenses
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 고정비 조회 가능" ON recurring_expenses
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 고정비 추가 가능" ON recurring_expenses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 고정비 수정 가능" ON recurring_expenses
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 고정비 삭제 가능" ON recurring_expenses
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 생일설정 조회 가능" ON birthday_settings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 생일설정 추가 가능" ON birthday_settings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 생일설정 수정 가능" ON birthday_settings
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 생일설정 삭제 가능" ON birthday_settings
FOR DELETE USING (auth.role() = 'authenticated');

-- 기본 생일 설정 데이터 삽입
INSERT INTO birthday_settings (user_name, birth_month, birth_day, amount) VALUES
('유재욱', 1, 1, 50000),
('신성원', 1, 1, 50000),
('김정현', 1, 1, 50000),
('김정민', 1, 1, 50000),
('권순신', 1, 1, 50000); 