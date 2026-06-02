interface Props {
  priceUsd: string;
  authorName: string;
}

export function Paywall({ priceUsd, authorName }: Props) {
  return (
    <>
      <div className="teaser-fade"></div>
      <div className="pw">
        <span className="pw-lock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          付费阅读 · 已读 24%
        </span>
        <p className="pw-h">解锁后读完全文</p>
        <p className="pw-meta">真人与 Agent 同价 · 一次付费永久可读</p>
        <div className="pw-price-row">
          <span className="pw-price">{priceUsd}</span>
          <span className="pw-price-note">USDC on Base · 一次付费永久可读</span>
        </div>
        <p className="pw-fine">
          付费后 100% 直达 {authorName} 钱包 · 平台 0 抽成 · 钱包不变可永久重读
        </p>
      </div>
    </>
  );
}
