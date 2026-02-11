-- Supabase에서 이 SQL을 실행하여 messages 테이블을 생성하세요
-- Supabase Dashboard > SQL Editor에서 실행

-- users 테이블 생성 (회원 정보 저장)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- 로그인용 아이디
  password_hash TEXT NOT NULL,   -- 비밀번호 해시 (SHA-256 + salt)
  nickname TEXT NOT NULL UNIQUE, -- 채팅에 보여질 닉네임 (중복 불가)
  is_admin BOOLEAN NOT NULL DEFAULT FALSE, -- 관리자 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 password 컬럼이 있다면 password_hash로 변경
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
    ALTER TABLE users RENAME COLUMN password TO password_hash;
  END IF;
END $$;

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

-- room_participants 테이블 생성 (채팅방 참가자)
CREATE TABLE IF NOT EXISTS room_participants (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'creator' 또는 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동일한 유저가 같은 방에 중복으로 들어가지 않도록 제약
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_participants_unique
  ON room_participants(room_id, user_id);

-- room_notification_settings 테이블 생성 (방별 알림 설정)
CREATE TABLE IF NOT EXISTS room_notification_settings (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동일한 유저가 같은 방에 중복 설정을 가지지 않도록 제약
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_notification_settings_unique
  ON room_notification_settings(room_id, user_id);

-- messages 테이블에 mentions 컬럼 추가 (맨션된 사용자 닉네임 배열)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'mentions'
  ) THEN
    ALTER TABLE messages ADD COLUMN mentions TEXT[];
  END IF;
END $$;

-- messages 테이블에 file_url 컬럼 추가 (파일 URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- messages 테이블에 file_type 컬럼 추가 (파일 타입: 'image' 또는 'video')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_type TEXT;
  END IF;
END $$;

-- 실시간 기능 활성화 (Realtime) - 이미 추가된 테이블은 스킵
DO $$
BEGIN
  -- users 테이블
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;

  -- rooms 테이블
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;

  -- messages 테이블
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- room_participants 테이블
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
  END IF;

  -- room_notification_settings 테이블
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_notification_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_notification_settings;
  END IF;
END $$;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room_id, created_at DESC);

-- Row Level Security (RLS) 정책 설정 (데모용: 모두에게 열려 있음)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (이미 존재하는 정책은 스킵)
DO $$
BEGIN
  -- users 테이블 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = '모든 사용자가 유저 정보 읽기 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 유저 정보 읽기 가능"
      ON users FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = '모든 사용자가 유저 생성 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 유저 생성 가능"
      ON users FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = '모든 사용자가 유저 정보 업데이트 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 유저 정보 업데이트 가능"
      ON users FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  -- rooms 테이블 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = '모든 사용자가 방 읽기 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 방 읽기 가능"
      ON rooms FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = '모든 사용자가 방 생성 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 방 생성 가능"
      ON rooms FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = '모든 사용자가 방 삭제 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 방 삭제 가능"
      ON rooms FOR DELETE
      USING (true);
  END IF;

  -- messages 테이블 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = '모든 사용자가 메시지 읽기 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 메시지 읽기 가능"
      ON messages FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = '모든 사용자가 메시지 작성 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 메시지 작성 가능"
      ON messages FOR INSERT
      WITH CHECK (true);
  END IF;

  -- room_participants 테이블 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_participants' AND policyname = '모든 사용자가 참가자 읽기 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 참가자 읽기 가능"
      ON room_participants FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_participants' AND policyname = '모든 사용자가 참가자 추가 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 참가자 추가 가능"
      ON room_participants FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_participants' AND policyname = '모든 사용자가 참가자 업데이트 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 참가자 업데이트 가능"
      ON room_participants FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  -- room_notification_settings 테이블 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_notification_settings' AND policyname = '모든 사용자가 알림 설정 읽기 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 알림 설정 읽기 가능"
      ON room_notification_settings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_notification_settings' AND policyname = '모든 사용자가 알림 설정 추가 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 알림 설정 추가 가능"
      ON room_notification_settings FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'room_notification_settings' AND policyname = '모든 사용자가 알림 설정 업데이트 가능'
  ) THEN
    CREATE POLICY "모든 사용자가 알림 설정 업데이트 가능"
      ON room_notification_settings FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Supabase Storage 버킷 생성 (파일 업로드용)
-- Storage > Buckets에서 수동으로 생성하거나 아래 SQL 실행
-- 주의: Storage 버킷은 SQL로 직접 생성할 수 없으므로 Supabase Dashboard에서 수동 생성 필요
-- 버킷 이름: chat-files
-- Public: true (공개 접근 허용)
-- File size limit: 적절한 크기 설정 (예: 10MB)
-- Allowed MIME types: image/*, video/*

-- Storage 정책 설정 (RLS)
-- Storage > Policies에서 다음 정책 추가:
-- 1. SELECT 정책: "모든 사용자가 파일 읽기 가능"
--    - Policy name: "모든 사용자가 파일 읽기 가능"
--    - Allowed operation: SELECT
--    - Policy definition: true
-- 2. INSERT 정책: "모든 사용자가 파일 업로드 가능"
--    - Policy name: "모든 사용자가 파일 업로드 가능"
--    - Allowed operation: INSERT
--    - Policy definition: true
