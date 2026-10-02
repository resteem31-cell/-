// video/ 안의 장면 HTML(기본 skin-5step.html)을 프레임 단위로 렌더링해 MP4로 저장한다.
// 사용법: node video/render.js [출력파일] [--page mist-30s.html] [--fps 30] [--stills 1,4,8]
//   --stills 를 주면 영상 대신 해당 시점(초)의 PNG만 저장한다.
const { spawn, execFileSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const pageFile = opt('--page', 'skin-5step.html');
const DEFAULT_OUT = { 'skin-5step.html': 'anado-skin-5step-15s.mp4', 'mist-30s.html': 'monolab-mist-30s.mp4' };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const out = path.resolve(positional[0] || path.join(__dirname, DEFAULT_OUT[pageFile] || pageFile.replace(/\.html$/, '.mp4')));
const fps = parseInt(opt('--fps', '30'), 10);
const stills = opt('--stills', null);

// 웹폰트: 헤드리스 브라우저에서 Google Fonts 를 직접 받으면 불안정하므로
// curl 로 TTF 를 한 번 받아 video/.fontcache 에 두고 로컬에서 제공한다
const FONT_CACHE = path.join(__dirname, '.fontcache');
function localFontCss(cssUrl, origin) {
  fs.mkdirSync(FONT_CACHE, { recursive: true });
  const css = execFileSync('curl', ['-sS', '-A', 'curl', cssUrl]).toString();
  return css.replace(/url\((https:\/\/[^)]+\.ttf)\)/g, (m, u) => {
    const file = path.join(FONT_CACHE, u.split('/').slice(-2).join('-'));
    if (!fs.existsSync(file)) execFileSync('curl', ['-sS', '-o', file, u]);
    return `url(${origin}/video/.fontcache/${path.basename(file)})`;
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/video/${pageFile}?render`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.route('https://fonts.googleapis.com/**', route =>
    route.fulfill({ contentType: 'text/css', body: localFontCss(route.request().url(), `http://localhost:${server.address().port}`) }));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  page.on('requestfailed', r => console.error('font/asset load failed:', r.url().slice(0, 100), r.failure().errorText));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.sceneReady);
  const frame = t => page.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);

  if (stills) {
    for (const t of stills.split(',').map(Number)) {
      const file = path.join(path.dirname(out), `still-${t.toFixed(2)}.png`);
      fs.writeFileSync(file, Buffer.from(await frame(t), 'base64'));
      console.log('saved', file);
    }
  } else {
    const duration = await page.evaluate(() => window.DURATION);
    const total = Math.round(duration * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < total; i++) {
      const buf = Buffer.from(await frame(i / fps), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % fps === 0) process.stdout.write(`\r${i}/${total}`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
    console.log(`\nsaved ${out}`);
  }
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
