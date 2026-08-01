export default function RootNotFound() {
  return (
    <html lang="zh">
      <body style={{ margin: 0, fontFamily: "monospace", background: "#0a0a0a", color: "#f5f5f5" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "6rem", fontWeight: 700, opacity: 0.2 }}>404</div>
          <p>找不到页面 · Page not found</p>
          <a href="/zh" style={{ color: "#c9a96e" }}>
            ← 返回首页 · Back to home
          </a>
        </main>
      </body>
    </html>
  );
}
