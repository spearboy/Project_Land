-- Supabase에서 이 SQL을 실행하여 messages 테이블을 생성하세요
-- Supabase Dashboard > SQL Editor에서 실행

-- users 테이블 생성 (회원 정보 저장)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- 로그인용 아이디
  password TEXT NOT NULL,       -- 데모용: 실제 서비스에서는 반드시 해시 사용
  nickname TEXT NOT NULL,       -- 채팅에 보여질 닉네임
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- rooms 테이블 생성 (채팅방 정보)
CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  creator_nickname TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  invite_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- messages 테이블 생성 (채팅 메시지)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 실시간 기능 활성화 (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room_id, created_at DESC);

-- Row Level Security (RLS) 정책 설정 (데모용: 모두에게 열려 있음)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 유저 정보를 읽을 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 유저 정보 읽기 가능"
  ON users FOR SELECT
  USING (true);

-- 모든 사용자가 유저를 생성할 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 유저 생성 가능"
  ON users FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 방 목록을 읽을 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 방 읽기 가능"
  ON rooms FOR SELECT
  USING (true);

-- 모든 사용자가 방을 생성할 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 방 생성 가능"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 메시지를 읽을 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 메시지 읽기 가능"
  ON messages FOR SELECT
  USING (true);

-- 모든 사용자가 메시지를 작성할 수 있도록 설정 (데모용)
CREATE POLICY "모든 사용자가 메시지 작성 가능"
  ON messages FOR INSERT
  WITH CHECK (true);
