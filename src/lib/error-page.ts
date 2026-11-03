export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This Page Didn't Load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #050606; color: #f5f7f8; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid rgba(210,225,220,.12); border-radius: 24px; background: #0c1010; box-shadow: 0 24px 80px rgba(0,0,0,.45); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #aab4b0; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #dce7e2; color: #080b0a; }
      .secondary { background: #151b19; color: #eef4f0; border-color: #34413b; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This Page Didn't Load</h1>
      <p>Cinema Couldn't Open This Page Right Now. Refresh Or Return To The Home Screen.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try Again</button>
        <a class="secondary" href="/">Go Home</a>
      </div>
    </div>
  </body>
</html>`;
}
