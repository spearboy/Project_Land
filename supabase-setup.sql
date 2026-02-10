-- Supabase에서 이 SQL을 실행하여 messages 테이블을 생성하세요
-- Supabase Dashboard > SQL Editor에서 실행

-- messages 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 실시간 기능 활성화 (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Row Level Security (RLS) 정책 설정
-- 모든 사용자가 메시지를 읽을 수 있도록 설정
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 메시지 읽기 가능"
  ON messages FOR SELECT
  USING (true);

-- 모든 사용자가 메시지를 작성할 수 있도록 설정
CREATE POLICY "모든 사용자가 메시지 작성 가능"
  ON messages FOR INSERT
  WITH CHECK (true);
