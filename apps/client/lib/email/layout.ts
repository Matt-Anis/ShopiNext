const COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#fdc700",
  primaryForeground: "#733e0a",
  mutedForeground: "#737373",
  border: "#e5e5e5",
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      default:
        return "&#39;"
    }
  })
}

export function renderEmail({
  heading,
  body,
  action,
  footer,
}: {
  heading: string
  body: string
  action?: { label: string; url: string }
  footer: string
}) {
  return `
    <div style="background-color:${COLORS.background};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:420px;margin:0 auto;text-align:center;">
        <div style="margin-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:${COLORS.foreground};">ShopiNext</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:${COLORS.foreground};margin:0 0 12px;">${escapeHtml(heading)}</h1>
        <p style="font-size:14px;line-height:1.6;color:${COLORS.mutedForeground};margin:0 0 28px;">${escapeHtml(body)}</p>
        ${
          action
            ? `
        <a href="${escapeHtml(action.url)}" style="display:inline-block;background-color:${COLORS.primary};color:${COLORS.primaryForeground};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">${escapeHtml(action.label)}</a>
        <p style="font-size:12px;line-height:1.6;color:${COLORS.mutedForeground};margin:28px 0 0;">
          Or copy and paste this link into your browser:<br />
          <a href="${escapeHtml(action.url)}" style="color:${COLORS.mutedForeground};word-break:break-all;">${escapeHtml(action.url)}</a>
        </p>`
            : ""
        }
        <p style="font-size:12px;color:${COLORS.mutedForeground};border-top:1px solid ${COLORS.border};margin-top:32px;padding-top:20px;">
          ${escapeHtml(footer)}
        </p>
      </div>
    </div>
  `
}
