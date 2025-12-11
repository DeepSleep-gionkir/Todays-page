# 오늘의 한 페이지 (Today's Page) - 상세 설정 가이드

가장 어려워 보이는 부분부터 하나씩 그림을 그리듯 설명해 드릴게요. 천천히 따라와 주세요.

## 1단계: 프로젝트 실행 준비 (터미널)

먼저, 이 파일들이 있는 컴퓨터의 터미널(검은 화면)에서 다음 명령어를 입력해서 필요한 도구들을 설치해야 합니다.
이미 제가 설치해 두었지만, 혹시 모르니 확인해 주세요.

```bash
npm install
```

## 2단계: Firebase 설정 (데이터베이스 & 로그인)

이 게임은 데이터(캐릭터, 배틀 기록)를 저장하고 구글 로그인을 하기 위해 **Firebase**라는 구글의 서비스를 사용합니다.

1. **Firebase 콘솔 접속**: [https://console.firebase.google.com/](https://console.firebase.google.com/) 에 접속하고 구글 아이디로 로그인하세요.
2. **프로젝트 만들기**:
   - `프로젝트 만들기` 버튼을 클릭하세요.
   - 프로젝트 이름에 `todays-page-game` (또는 원하는 이름)을 입력하고 `계속`을 누르세요.
   - 구글 애널리틱스는 `사용 안함`으로 설정해도 됩니다. `프로젝트 만들기`를 완료하세요.
3. **앱 등록 및 키 발급**:
   - 프로젝트 화면 중앙의 `</>` (웹) 아이콘을 클릭하세요.
   - 앱 닉네임을 입력하고 `앱 등록`을 누르세요.
   - **중요**: `const firebaseConfig = { ... }` 안에 있는 내용들이 보일 겁니다. 이 내용들을 메모장에 복사해 두세요. (apiKey, authDomain 등등)
4. **인증(로그인) 설정**:
   - 왼쪽 메뉴에서 `빌드` -> `Authentication`을 클릭하세요.
   - `시작하기`를 누르고, `로그인 방법` 탭에서 `Google`을 선택하세요.
   - `사용 설정` 스위치를 켜고, 지원 이메일을 선택한 뒤 `저장`하세요.
5. **데이터베이스(Firestore) 설정**:
   - 왼쪽 메뉴에서 `빌드` -> `Firestore Database`를 클릭하세요.
   - `데이터베이스 만들기`를 누르세요.
   - 위치는 `asia-northeast3` (서울)을 선택하면 가장 빠릅니다.
   - 보안 규칙은 `테스트 모드에서 시작`을 선택하고 만드세요. (나중에 실제 배포 시에는 규칙을 수정해야 하지만, 지금은 개발용이므로 괜찮습니다.)
6. **저장소(Storage) 설정** (이미지용):
   - 왼쪽 메뉴에서 `빌드` -> `Storage`를 클릭하세요.
   - `시작하기` -> `테스트 모드에서 시작` -> `완료`.

## 3단계: Gemini AI 설정 (AI 캐릭터/배틀 생성)

이 게임의 핵심인 AI를 사용하기 위한 키를 발급받아야 합니다.

1. **Google AI Studio 접속**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 에 접속하세요.
2. **API 키 만들기**:
   - `Create API key` 버튼을 누르세요.
   - 방금 만든 Firebase 프로젝트를 선택하거나, 새 프로젝트를 연결해서 키를 만드세요.
   - 생성된 `API Key` (영문과 숫자가 섞인 긴 문자열)를 복사해 두세요.

## 4단계: 키 입력하기 (가장 중요!)

이제 복사해 둔 키들을 프로젝트에 넣어줍니다.

1. 프로젝트 폴더(파일들이 있는 곳)에 `.env.local` 이라는 이름의 새 파일을 만드세요.
2. 아래 내용을 복사해서 붙여넣고, `따옴표("")` 안에 아까 복사한 값들을 채워 넣으세요.

```text
# Firebase 설정 값 (2단계에서 저장한 것들)
NEXT_PUBLIC_FIREBASE_API_KEY="복사한apiKey"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="복사한authDomain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="복사한projectId"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="복사한storageBucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="복사한messagingSenderId"
NEXT_PUBLIC_FIREBASE_APP_ID="복사한appId"

# Gemini 설정 값 (3단계에서 저장한 것)
GEMINI_API_KEY="복사한GeminiAPIKey"
```

## 5단계: 게임 실행

모든 설정이 끝났습니다! 이제 터미널에서 다음 명령어를 입력하세요.

```bash
npm run dev
```

그러면 터미널에 `http://localhost:3000` 같은 주소가 뜰 겁니다.
인터넷 브라우저(크롬 등)를 켜고 저 주소로 들어가면, 당신이 만든 게임이 실행됩니다!
