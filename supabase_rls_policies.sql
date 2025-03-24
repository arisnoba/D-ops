-- tasks 테이블에 RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- tasks 테이블 정책: 인증된 사용자만 조회 가능
CREATE POLICY "인증된 사용자만 모든 작업 조회 가능" ON tasks
FOR SELECT USING (auth.role() = 'authenticated');

-- tasks 테이블 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "인증된 사용자만 작업 추가 가능" ON tasks
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- tasks 테이블 정책: 인증된 사용자만 수정/삭제 가능
CREATE POLICY "인증된 사용자만 작업 수정 가능" ON tasks
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 작업 삭제 가능" ON tasks
FOR DELETE USING (auth.role() = 'authenticated');

-- clients 테이블에 RLS 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- clients 테이블 정책: 인증된 사용자만 조회 가능
CREATE POLICY "인증된 사용자만 모든 클라이언트 조회 가능" ON clients
FOR SELECT USING (auth.role() = 'authenticated');

-- clients 테이블 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "인증된 사용자만 클라이언트 추가 가능" ON clients
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- clients 테이블 정책: 인증된 사용자만 수정/삭제 가능
CREATE POLICY "인증된 사용자만 클라이언트 수정 가능" ON clients
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 클라이언트 삭제 가능" ON clients
FOR DELETE USING (auth.role() = 'authenticated');

-- 주의: Supabase 콘솔에서 이 SQL 쿼리를 실행하여 정책을 적용하세요. 