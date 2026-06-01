type Row = { rank: string; name: string; desc: string; articles: string; earned: string };

const ROWS: Row[] = [
  { rank: "01", name: "Alex Fan", desc: "@lxdao · 公众号 · 链上治理 / RWA", articles: "1", earned: "$0.00" },
];

export function TopEarningAuthors() {
  return (
    <>
      <div className="lboard-head">
        <div>
          <h3>Top Earning Authors</h3>
          <p className="lboard-sub">Ranked by total earnings across paid unlocks · paid directly to wallets via x402.</p>
        </div>
        <span className="more">1 author</span>
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
