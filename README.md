# Project Land - Voice Chat

실시간 텍스트 및 음성 채팅 애플리케이션 (Vercel 배포용)

## 기능

- ✅ 실시간 텍스트 채팅 (Supabase Realtime)
- 🎤 음성 채팅 UI (준비됨)
- 📱 모바일 최적화 UI (MUI 다크 테마)
- 🚀 Vercel 배포 지원

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 설정

#### 2-1. Supabase 프로젝트 생성

1. [Supabase](https://app.supabase.com)에 가입/로그인
2. 새 프로젝트 생성
3. 프로젝트 설정 > API에서 다음 정보 확인:
   - Project URL
   - anon/public key

#### 2-2. 데이터베이스 테이블 생성

Supabase Dashboard > SQL Editor에서 `supabase-setup.sql` 파일의 내용을 실행하세요.

또는 직접 실행:

```sql
-- messages 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 실시간 기능 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS 정책 설정
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 메시지 읽기 가능"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "모든 사용자가 메시지 작성 가능"
  ON messages FOR INSERT
  WITH CHECK (true);
```

#### 2-3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Vercel 배포 시:**
Vercel Dashboard > 프로젝트 설정 > Environment Variables에서 위 두 변수를 추가하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에 로그인
3. 새 프로젝트 Import
4. Environment Variables에 Supabase 설정 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

## 기술 스택

- **React** + **Vite**
- **Material-UI (MUI)** - 다크 테마
- **Supabase** - 실시간 데이터베이스 및 Realtime
- **Vercel** - 배포 플랫폼

## 프로젝트 구조

```
src/
├── App.jsx              # 메인 앱 컴포넌트 (상태 관리, Supabase 연결)
├── lib/
│   └── supabase.js      # Supabase 클라이언트 설정
└── components/
    ├── EnterScreen.jsx  # 입장 화면
    ├── ChatScreen.jsx   # 채팅 화면 컨테이너
    ├── ChatHeader.jsx   # 상단 헤더
    ├── MessageList.jsx  # 메시지 목록
    ├── MessageInput.jsx # 메시지 입력창
    └── VoiceStatusBar.jsx # 음성 채팅 상태 표시
```
