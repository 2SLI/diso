# PartnerBase

기업 정보와 협업 수요를 기반으로 거래처를 탐색하는 B2B 플랫폼의 초기 프로젝트입니다.

## 설치와 실행

```bash
npm install
npm run dev
```

프로덕션 빌드는 `npm run build`로 확인합니다.

## Firebase 설정

`.env.example`을 복사해 `.env`를 만들고 Firebase 웹 앱 설정 값을 입력합니다. `.env`는 Git에서 제외됩니다.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

외부 기업 데이터는 공공데이터포털 등에서 발급받은 서비스 키를 Cloud Functions의 서버 환경변수로만 설정합니다. 브라우저에 키를 노출하는 `VITE_` 환경변수에는 넣지 않습니다.

설정값이 없는 경우 Firebase 인스턴스를 만들지 않으므로 앱 화면은 안전하게 열립니다. 인증이나 데이터 저장을 실행하면 설정 안내 오류를 보여줍니다.

## 구조

- `src/components`: 공통 UI와 기업 카드
- `src/pages`: 공개/보호 화면
- `src/layouts`: Main, Dashboard 레이아웃
- `src/contexts`: 인증 상태
- `src/services`: Firebase 및 도메인별 호출
- `src/types`: User, Company, RFQ, Quote, Connection 타입
- `src/routes`: React Router와 ProtectedRoute

## 현재 구현

- 이메일/비밀번호 Firebase Authentication 구조와 AuthContext
- 환경변수 기반 Firebase modular SDK 초기화
- 기업 목록·상세·검색 UI, 회사 프로필 태그 입력 폼
- 대시보드 및 RFQ/견적/거래처 기본 화면
- Firestore 저장 함수의 `serverTimestamp()` 사용
- 견적에 구매사·공급사 회사 ID를 명시해 향후 비공개 Security Rules 적용 가능

## 다음 개발 우선순위

1. 기업 가입 및 인증
2. 기업 검색
3. 협업 요청
4. RFQ 생성
5. 비공개 견적
6. 견적 비교
7. 거래처 관리
8. 기업 추천 알고리즘
