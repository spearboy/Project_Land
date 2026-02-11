# Project Land - Voice Chat

실시간 텍스트 및 음성 채팅 애플리케이션 (Vercel 배포용)

## 기능

- ✅ 실시간 텍스트 채팅 (Supabase Realtime)
- 🤖 AI 챗봇 (OpenAI GPT, 비공개방 전용)
- 📎 파일 첨부 (이미지/영상만, 다운로드 방지)
- 🔗 링크 자동 감지 및 새창 열기
- 📝 줄바꿈 유지 (엔터로 작성한 그대로 표시)
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

#### 2-3. Storage 버킷 생성 (파일 첨부 기능용)

1. Supabase Dashboard > Storage로 이동
2. "New bucket" 클릭
3. 버킷 설정:
   - **Name**: `chat-files`
   - **Public bucket**: ✅ 체크 (공개 접근 허용)
   - **File size limit**: 적절한 크기 설정 (예: 10MB)
   - **Allowed MIME types**: `image/*, video/*`
4. "Create bucket" 클릭
5. Storage > Policies에서 다음 정책 추가:
   - **SELECT 정책**:
     - Policy name: "모든 사용자가 파일 읽기 가능"
     - Allowed operation: SELECT
     - Policy definition: `true`
   - **INSERT 정책**:
     - Policy name: "모든 사용자가 파일 업로드 가능"
     - Allowed operation: INSERT
     - Policy definition: `true`

#### 2-4. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Vercel 배포 시:**
Vercel Dashboard > 프로젝트 설정 > Environment Variables에서 위 세 변수를 추가하세요.

**⚠️ 보안 주의사항:**
API 키는 클라이언트에 노출되므로, 프로덕션 환경에서는 서버 사이드 API를 통해 호출하는 것을 권장합니다.

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
- **Google Gemini** - AI 챗봇 (비공개방 전용, 무료 티어 제공)
- **Vercel** - 배포 플랫폼

## AI 챗봇 설정

### Google Gemini API 키 발급 (무료)

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭하여 새 API 키 생성
4. 생성된 키를 `.env` 파일의 `VITE_GEMINI_API_KEY`에 추가

**Gemini 무료 티어:**
- 분당 60회 요청 (RPM)
- 일일 무료 사용량 제공
- 유료 플랜 없이도 사용 가능

### 사용 방법

1. 채팅방 생성 시 "비밀방으로 만들기" 체크
2. "AI 챗봇 활성화" 토글 켜기
3. 비공개방에서 메시지를 보내면 AI가 자동으로 응답

**참고:** API 키가 없어도 기본 응답으로 동작하지만, 실제 AI 기능을 사용하려면 Gemini API 키가 필요합니다.

## 프로젝트 구조

```
src/
├── App.jsx              # 메인 앱 컴포넌트 (상태 관리, Supabase 연결)
├── lib/
│   └── supabase.js      # Supabase 클라이언트 설정
├── constants/
│   └── errorCodes.js    # 에러 코드 상수
└── components/
    ├── EnterScreen.jsx  # 입장 화면
    ├── ChatScreen.jsx   # 채팅 화면 컨테이너
    ├── ChatHeader.jsx   # 상단 헤더
    ├── MessageList.jsx  # 메시지 목록
    ├── MessageInput.jsx # 메시지 입력창
    ├── VoiceStatusBar.jsx # 음성 채팅 상태 표시
    ├── AlertModal.jsx   # 알림 모달
    ├── ConfirmModal.jsx # 확인 모달
    └── PromptModal.jsx  # 입력 모달
```

## 에러 코드

애플리케이션에서 발생하는 오류는 에러 코드로 관리됩니다. 오류 발생 시 에러 코드와 함께 관리자에게 문의해주세요.

### 인증 관련 (10001-10010)

- **10001**: 로그인 실패
- **10002**: 회원가입 실패
- **10003**: 비밀번호 재설정 실패
- **10004**: 사용자 정보를 찾을 수 없음
- **10005**: 잘못된 인증 정보
- **10006**: 중복된 사용자 아이디
- **10007**: 중복된 닉네임

### 채팅방 관련 (10011-10020)

- **10011**: 채팅방 목록 로드 실패
- **10012**: 채팅방 생성 실패
- **10013**: 채팅방 삭제 실패
- **10014**: 채팅방 입장 실패
- **10015**: 채팅방을 찾을 수 없음
- **10016**: 이미 삭제된 채팅방
- **10017**: 잘못된 초대코드

### 메시지 관련 (10021-10030)

- **10021**: 메시지 전송 실패
- **10022**: 메시지 로드 실패
- **10023**: 메시지 외래키 오류 (삭제된 방 참조)

### 파일 관련 (10031-10040)

- **10031**: 파일 업로드 실패
- **10032**: 파일 저장소를 찾을 수 없음
- **10033**: 파일 업로드 권한 없음
- **10034**: 잘못된 파일 형식
- **10035**: 파일 URL 가져오기 실패

### 알림 설정 관련 (10041-10050)

- **10041**: 알림 설정 로드 실패
- **10042**: 알림 설정 업데이트 실패

### 참가자 관련 (10051-10060)

- **10051**: 참가자 목록 로드 실패
- **10052**: 참가자 추가 실패

### 버전 관련 (10061-10070)

- **10061**: 앱 버전 불일치
- **10062**: 버전 확인 실패

### AI 관련 (10081-10090)

- **10081**: AI 응답 생성 실패
- **10082**: AI API 키 없음
- **10083**: AI API 오류

### 네트워크 관련 (10071-10099)

- **10071**: 네트워크 오류
- **10099**: 알 수 없는 오류
