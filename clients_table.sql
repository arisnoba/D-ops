-- 클라이언트 테이블 생성
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- tasks 테이블에 client_id 컬럼 추가
ALTER TABLE tasks ADD COLUMN client_id INTEGER REFERENCES clients(id); 