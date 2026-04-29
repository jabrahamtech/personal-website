<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title><xsl:value-of select="rss/channel/title"/> — RSS</title>
  <link rel="icon" href="data:image/svg+xml;utf8,&lt;svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'&gt;&lt;rect width='16' height='16' fill='%230b0e0c'/&gt;&lt;g fill='%237dff8a'&gt;&lt;rect x='3' y='3' width='2' height='2'/&gt;&lt;rect x='7' y='3' width='2' height='2'/&gt;&lt;rect x='11' y='3' width='2' height='2'/&gt;&lt;rect x='3' y='7' width='10' height='2'/&gt;&lt;rect x='3' y='11' width='2' height='2'/&gt;&lt;rect x='11' y='11' width='2' height='2'/&gt;&lt;/g&gt;&lt;/svg&gt;" />
  <style>
    :root{--bg:#0b0e0c;--ink:#ecebe4;--ink-dim:#c7c6bc;--ink-mute:#8b9286;--green:#7dff8a;--green-2:#46c463;--line:#1d2820;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace;--sans:'Inter',system-ui,sans-serif;}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
    .wrap{max-width:780px;margin:0 auto;padding:48px 28px 64px}
    .prompt{font-family:var(--mono);color:var(--green);font-size:18px;display:flex;align-items:center;gap:9px;margin:0 0 18px}
    .prompt::before{content:"";width:7px;height:7px;background:var(--green);box-shadow:0 0 8px var(--green)}
    h1{font-family:var(--mono);font-size:clamp(22px,3vw,28px);font-weight:600;margin:0 0 6px;letter-spacing:-0.005em}
    .lede{color:var(--ink-dim);margin:0 0 8px;max-width:62ch}
    .sub{color:var(--ink-mute);font-family:var(--mono);font-size:13px;margin:0 0 28px}
    .sub code{background:rgba(125,255,138,0.06);border:1px solid var(--line);padding:2px 6px;font-size:12.5px;color:var(--ink-dim)}
    .item{padding:18px 0;border-top:1px solid var(--line)}
    .item:last-child{border-bottom:1px solid var(--line)}
    .item h2{margin:0 0 6px;font-size:18px;font-weight:600}
    .item h2 a{color:var(--ink);text-decoration:none;border-bottom:1px solid transparent}
    .item h2 a:hover{color:var(--green);border-color:var(--green-2)}
    .item p{margin:0 0 10px;color:var(--ink-dim)}
    .meta{font-family:var(--mono);font-size:12px;color:var(--ink-mute)}
    .meta .sep{margin:0 8px;opacity:.5}
    .back{display:inline-block;margin-top:32px;font-family:var(--mono);font-size:13px;color:var(--ink-dim);border:1px solid var(--line);padding:8px 12px}
    .back:hover{color:var(--green);border-color:var(--green-2)}
    a{color:inherit}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="prompt">&gt; ./rss.xml</div>
    <h1><xsl:value-of select="rss/channel/title"/></h1>
    <p class="lede"><xsl:value-of select="rss/channel/description"/></p>
    <p class="sub">This is an RSS feed. Paste the URL of this page into a feed reader (NetNewsWire, Feedly, Reeder, Inoreader) to subscribe: <code><xsl:value-of select="rss/channel/atom:link/@href"/></code></p>

    <xsl:for-each select="rss/channel/item">
      <article class="item">
        <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
        <p><xsl:value-of select="description"/></p>
        <div class="meta">
          <xsl:value-of select="substring(pubDate, 1, 16)"/>
          <xsl:if test="category"><span class="sep">·</span><xsl:for-each select="category"><xsl:if test="position() > 1"> · </xsl:if><xsl:value-of select="."/></xsl:for-each></xsl:if>
        </div>
      </article>
    </xsl:for-each>

    <a class="back"><xsl:attribute name="href"><xsl:value-of select="rss/channel/link"/></xsl:attribute>← back to the site</a>
  </main>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
