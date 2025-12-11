# 오늘의 한 페이지 (Today's Page) 개발 할 일 목록

## 1. 프로젝트 초기 설정

- [ ] Next.js 프로젝트 생성 (SSR 지원)
- [ ] Firebase 프로젝트 설정 (Console)
  - [ ] Firestore Database 생성 (asia-northeast3 서울 리전 권장)
  - [ ] Authentication 설정 (Google 로그인)
  - [ ] Hosting 설정
- [ ] 필요한 라이브러리 설치
  - [ ] firebase
  - [ ] google-generative-ai (Gemini API)
  - [ ] react-icons 또는 lucide-react
  - [ ] html2canvas (다운로드 기능용)
- [ ] 디자인 시스템 환경 구축 (CSS Variables 설정)
  - [ ] Color Palette (Warm Ivory, Sand Gray, Terracotta, etc.)
  - [ ] Typography (Serif: Tiempos/Noto Serif KR, Sans: Inter/Noto Sans KR)

## 2. 데이터베이스 모델링 (Firestore)

- [ ] Users 컬렉션 설게
  - [ ] UID, 이메일, 닉네임
  - [ ] 누적 스탯 (캐릭터 생성 횟수, 배틀 횟수, 승/패)
  - [ ] My Book 데이터 (서브 컬렉션 또는 배열: 날짜, 캐릭터 요약, 로그 요약)
- [ ] DailyCharacters 컬렉션 설계 (매일 자정 리셋 로직 필요 - 혹은 쿼리로 날짜 필터링)
  - [ ] 날짜 필드 (YYYY-MM-DD)
  - [ ] 캐릭터 정보 (이름, 설명, 이미지URL, 능력, 서사, 작성자UID)
- [ ] BattleLogs 컬렉션 설계
  - [ ] 참여 캐릭터 정보
  - [ ] 배틀 로그 텍스트
  - [ ] 승패 결과
  - [ ] 날짜

## 3. UI/UX 구현

### 3.1 공통 레이아웃

- [ ] Header: 로고 (Home 링크)
- [ ] Footer: React Icons/Lucide 활용
- [ ] Font 설정 (Google Fonts)

### 3.2 홈 화면 (비로그인/로그인)

- [ ] 구글 로그인 버튼
- [ ] 게임 타이틀 (영문, 디자인)
- [ ] (로그인 후) 오늘의 캐릭터 생성 버튼 또는 내 캐릭터 보기

### 3.3 캐릭터 생성 페이지

- [ ] 경고 문구 (차분한 UI)
- [ ] 입력 폼 (이름, 600자 설명, 이미지 업로드)
- [ ] 로딩 오버레이 (캐릭터 생성 중 모션, 문구 롤링)
- [ ] 결과 페이지 리다이렉트

### 3.4 캐릭터 상세 페이지

- [ ] 캐릭터 정보 표시 (이미지, 이름, 능력, 서사)
- [ ] '오늘의 배틀' 버튼 (10명 이상일 때만 활성)
- [ ] 다운로드 버튼 (카드 형태 이미지 저장)

### 3.5 배틀 매칭 및 로그 페이지

- [ ] 매칭 로직 (무작위 상대)
- [ ] 배틀 생성 AI 연동 (Gemini 2.5 Flash Lite)
- [ ] 로딩 오버레이 (로그 생성 중 모션, 문구 롤링)
- [ ] 배틀 로그 출력 (대사 박스, 하이라이트, 가독성)
- [ ] 다운로드 버튼

### 3.6 나의 책 (My Book) 페이지

- [ ] 책 모양 인터페이스 구현 (Turn.js 또는 CSS 3D)
- [ ] 페이지네이션 (데이터 넘칠 시 다음 페이지)
- [ ] 통계 표시 (첫 페이지)
- [ ] 기록 열람 (손글씨 폰트, 요약된 내용)

### 3.7 관리자 페이지

- [ ] 관리자 권한 확인
- [ ] 금일 생성된 캐릭터 리스트 (카드 형식)
- [ ] 캐릭터 삭제 기능

## 4. 로직 및 기능 구현

- [ ] Firebase Auth 연동 (Google Login)
- [ ] Gemini API 연동 (캐릭터 생성, 배틀 로그 생성)
- [ ] 이미지 업로드 처리 (Firebase Storage)
- [ ] 매일 자정 기준 데이터 처리 (실제 삭제 or 조회 필터링)
- [ ] 비동기 생성 처리 (서버 사이드 백그라운드 작업 또는 클라이언트 상태 복구)
      _참고: Next.js API Route(Serverless)는 타임아웃이 존재하므로 긴 작업 처리 고려 필요. 클라이언트에서 기다리거나, Firestore 리스너 활용._

## 5. 배포 및 최적화

- [ ] SEO 태그 설정 (Title, Meta description)
- [ ] Firebase Hosting 배포
