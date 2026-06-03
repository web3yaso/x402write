export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-l">
          <a href="/">home</a>
          <a href="/reports">reports</a>
          <a href="/openapi.json" target="_blank" rel="noreferrer">openapi</a>
          <a href="/SKILL.md" target="_blank" rel="noreferrer">skill</a>
          <a href="/llms.txt" target="_blank" rel="noreferrer">llms</a>
        </div>
        <div className="foot-mark" aria-hidden="true"></div>
        <div className="foot-r">
          <a href="https://x402scan.com" target="_blank" rel="noreferrer">x402scan</a>
        </div>
      </div>
    </footer>
  );
}
