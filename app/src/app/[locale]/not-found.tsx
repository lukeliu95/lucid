// Required when [locale] segment is missing — middleware should always redirect first.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: 48 }}>
        <h1>404 · Not found</h1>
        <p>
          <a href="/zh">→ 看懂世界(中文)</a>
        </p>
        <p>
          <a href="/en">→ kdsj-world (English)</a>
        </p>
      </body>
    </html>
  );
}
