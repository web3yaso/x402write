type Row = { rank: string; name: string; desc: string; articles: string; earned: string };

const ROWS: Row[] = [
  { rank: "01", name: "币圈合规观察", desc: "@cryptolaw_cn · 公众号 · 大陆司法实践", articles: "156", earned: "$8,420.30" },
  { rank: "02", name: "SG MAS Watcher", desc: "@sgmas_watcher · Substack · 新加坡监管", articles: "89", earned: "$5,210.50" },
  { rank: "03", name: "Lex Web3", desc: "@lex_web3 · Mirror · 香港 VATP / VASP", articles: "72", earned: "$4,892.10" },
  { rank: "04", name: "ChainLaw HK", desc: "@chainlaw_hk · 公众号 · 跨境支付/合规", articles: "94", earned: "$4,201.85" },
  { rank: "05", name: "OTC 法律日记", desc: "@otc_legal_diary · 公众号 · 帮信罪/掩饰隐瞒", articles: "128", earned: "$3,950.40" },
  { rank: "06", name: "Paige Zhao", desc: "@paige_zhao · Mirror · 稳定币立法", articles: "41", earned: "$3,012.00" },
  { rank: "07", name: "CN Crypto Court", desc: "@cn_crypto_court · Substack · 判例分析", articles: "66", earned: "$2,710.75" },
  { rank: "08", name: "Web3 合规小组", desc: "@web3_compliance · 飞书 · 制裁筛查/反洗钱", articles: "38", earned: "$1,820.90" },
  { rank: "09", name: "链上侦查笔记", desc: "@onchain_detective · 公众号 · 链上取证", articles: "52", earned: "$1,510.20" },
  { rank: "10", name: "RWA Watch CN", desc: "@rwa_watch · Mirror · 现实资产代币化", articles: "29", earned: "$1,140.50" },
];

export function TopEarningAuthors() {
  return (
    <>
      <div className="lboard-head">
        <div>
          <h3>Top Earning Authors</h3>
          <p className="lboard-sub">Ranked by total earnings across paid unlocks · paid directly to wallets via x402.</p>
        </div>
        <span className="more">Top 10 of 47</span>
      </div>

      <div className="lboard">
        <div className="lboard-cols">
          <span>#</span>
          <span>AUTHOR</span>
          <span className="r-r c-art">ARTICLES</span>
          <span className="r-r">EARNED</span>
        </div>
        {ROWS.map((r) => (
          <div className="lboard-row" key={r.rank}>
            <span className="rank">{r.rank}</span>
            <div className="pub"><div className="name">{r.name}</div><div className="desc">{r.desc}</div></div>
            <span className="col-r c-art">{r.articles}</span>
            <span className="col-r acc">{r.earned}</span>
          </div>
        ))}
      </div>

      <p className="lboard-foot"><strong>0 platform fee on the article side</strong> · settlement: real-time via x402 on Base · Coinbase CDP facilitator</p>
    </>
  );
}
