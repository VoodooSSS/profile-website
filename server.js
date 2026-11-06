// 개인 프로필 웹사이트용 정적 파일 서버 (Node.js 내장 모듈만 사용)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';
const ROOT = __dirname;

// 웹사이트에 필요한 파일만 공개합니다 (폴더 안의 다른 수업 자료는 공개하지 않음).
const PUBLIC_FILES = new Set(['/index.html', '/style.css', '/script.js']);
const PUBLIC_DIRS = ['/images/'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(res, 405, '405 Method Not Allowed');
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  } catch {
    return send(res, 400, '400 Bad Request');
  }
  if (urlPath === '/') urlPath = '/index.html';

  // 경로를 정규화해서 ../ 같은 상위 폴더 접근을 막습니다.
  const normalized = path.posix.normalize(urlPath);
  const allowed =
    PUBLIC_FILES.has(normalized) || PUBLIC_DIRS.some((dir) => normalized.startsWith(dir));
  if (!allowed || normalized.includes('\0')) {
    return send(res, 404, '404 Not Found');
  }

  const filePath = path.join(ROOT, normalized);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') return send(res, 404, '404 Not Found');
      console.error(err);
      return send(res, 500, '500 Internal Server Error');
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`${PORT}번 포트가 이미 사용 중입니다. 다른 포트로 실행하려면: PORT=3001 npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
