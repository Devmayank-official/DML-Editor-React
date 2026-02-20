export const previewCsp = [
  "default-src 'none'",
  "style-src 'unsafe-inline' https://cdn.jsdelivr.net",
  "script-src 'unsafe-inline' https://cdn.tailwindcss.com",
  "img-src data: https:",
  "font-src https: data:",
  "connect-src https:",
].join('; ');
