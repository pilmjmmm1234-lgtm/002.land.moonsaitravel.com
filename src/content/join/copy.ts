/**
 * Join page (page 5) — Korean display strings.
 * URLs stay in links.ts; no i18n system yet.
 */

export const JOIN_COPY = {
  metaTitle: "여행을 시작하세요 — Moon's AI Travel",
  metaDescription:
    "MWR Life 회원 가입 전 필요한 내용을 확인하고, 준비가 되면 공식 가입 페이지에서 회원 가입을 진행하세요.",

  hero: {
    title: "여행을 시작하세요",
    subtitle:
      "MWR Life 회원 가입 전 필요한 내용을 확인하고 준비가 되면\n공식 가입 페이지에서 회원 가입을 진행하세요.",
    line: "알아보기 · 확인하기 · 준비하기 · 가입하기",
  },

  about: {
    number: "01",
    title: "MWR LIFE 알아보기",
    body: "MWR Life는 회원제 방식으로 여행 서비스를 제공하는 회사입니다. 가입하기 전에 MWR Life가 어떤 회사인지, 회원제 여행 서비스가 어떻게 운영되는지 먼저 확인해 보세요.",
    guideCta: "소개자료 보기",
    guideHint: "한국어 소개자료",
    videoCta: "설명영상 보기",
    videoHint: "한국어 설명영상",
  },

  why: {
    number: "02",
    title: "회원제 여행이란?",
    body: "회원제 여행은 회원에게 제공되는 여행 요금과 여행 관련 혜택을 이용하는 방식입니다. 가입하기 전에 현재 제공되는 회원 옵션과 서비스 내용을 충분히 확인하세요.",
    cta: "회원제 여행 자세히 알아보기",
  },

  before: {
    number: "03",
    title: "가입 전 확인사항",
    checks: [
      "MWR Life와 회원제 서비스 내용을 확인합니다.",
      "현재 제공되는 회원 옵션을 확인합니다.",
      "실제 가입 조건과 비용은 공식 등록 페이지에서 다시 확인합니다.",
    ] as const,
    note: "충분히 알아본 후 결정하세요. 이 페이지에서는 가입을 서두르도록 요구하지 않습니다.",
  },

  how: {
    number: "04",
    title: "가입 방법",
    expand: "자세히 보기 +",
    collapse: "접기 −",
    steps: [
      {
        step: "STEP 1",
        title: "공식 사이트 이동",
        detail:
          "Moon's AI Travel에서 회원제 여행에 대한 내용을 충분히 확인한 후 MWR Life 공식 회원가입 페이지로 이동합니다. 실제 회원가입은 Moon's AI Travel이 아닌 MWR Life의 공식 사이트에서 진행됩니다.",
      },
      {
        step: "STEP 2",
        title: "계정 만들기",
        detail:
          "공식 가입 페이지에서 안내에 따라 회원 계정을 만듭니다. 이름, 이메일 등 가입에 필요한 기본 정보를 직접 입력합니다. 비밀번호와 개인정보는 Moon's AI Travel에서 입력하거나 보관하지 않습니다.",
      },
      {
        step: "STEP 3",
        title: "회원 옵션 확인",
        detail:
          "가입 화면에 표시되는 현재 회원 옵션, 이용 조건 및 비용 등을 직접 확인합니다. 회원 옵션과 조건은 변경될 수 있으므로 가입 시점에 MWR Life 공식 페이지에 표시되는 내용을 기준으로 판단합니다. 충분히 확인한 후 본인에게 맞는 옵션을 선택합니다.",
      },
      {
        step: "STEP 4",
        title: "가입 완료",
        detail:
          "입력한 정보와 선택한 회원 옵션, 결제 조건 등을 마지막으로 확인합니다. 모든 내용을 이해하고 동의한 경우에만 본인의 판단으로 가입을 완료합니다. 가입 완료 후에는 MWR Life 회원 계정으로 공식 여행 서비스를 이용할 수 있습니다.",
      },
    ] as const,
  },

  official: {
    number: "05",
    title: "MWR Life 회원제 가입 안내",
    role: "Moon's AI Travel은 여행 정보와 회원제 여행을 이해할 수 있도록 안내하는 사이트입니다. 실제 회원가입, 개인정보 입력 및 결제 절차는 MWR Life 공식 등록 페이지에서 진행됩니다.",
    trust: [
      "가입은 본 홈페이지와 무관하며, 가입 희망자를 위한 MWR Life 외부사이트만 소개합니다.",
      "Moon's AI Travel은 비밀번호와 결제정보를 입력받거나 저장하지 않습니다.",
      "가입 조건과 비용은 MWR Life 등록 홈 페이지에서 본인이 직접 확인하세요.",
      "모든 내용을 확인한 뒤 본인의 판단 후에 직접 가입을 진행하세요.",
    ] as const,
    checkbox:
      "내용을 확인했으며, 새 창에서 MWR Life 외부 사이트로 이동하는 것에 동의합니다.",
    cta: "공식 MWR LIFE 가입 페이지로 이동",
    footerNote: "가입 전 공식 페이지의 주소와 내용을 다시 한번 확인하세요.",
  },

  nav: {
    back: "뒤로",
  },
} as const;

export type JoinCopy = typeof JOIN_COPY;
