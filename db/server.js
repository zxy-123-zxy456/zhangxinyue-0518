/*
 * zxy 诗歌数据服务器
 * 启动命令：node db/server.js
 * 访问地址：http://localhost:3005/poems-0518-zxy.html
 * 数据接口：http://localhost:3005/poems         （返回 poems 数组）
 * 作者接口：http://localhost:3005/api/authors   （返回作者列表）
 * 原始数据：http://localhost:3005/db/db.json
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// zxy_ 端口号（题目要求）
const zxy_PORT = 3005;

// zxy_ 项目根目录：db/server.js 的上一级
const zxy_ROOT = path.resolve(__dirname, '..');

// zxy_ 静态文件 MIME 映射表
const zxy_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// zxy_ 读取 db.json 中的 poems 数组，并把图片地址改写为本地 db/img/ 路径
//      （gitee.com/.../raw/... 会 302 跳转到 raw.giteeusercontent.com，
//       重定向响应的 Content-Type 是 text/html，会被浏览器 ORB 拦截，
//       所以统一改为从本地服务器读取图片。）
function zxy_getPoems() {
  const zxy_file = path.join(zxy_ROOT, 'db', 'db.json');
  const zxy_raw = fs.readFileSync(zxy_file, 'utf-8');
  const zxy_list = JSON.parse(zxy_raw).poems || [];
  return zxy_list.map(function (zxy_p) {
    const zxy_name = path.basename(zxy_p.pic || '');
    // zxy_ 返回完整绝对地址，保证 file:// 和 http:// 两种打开方式都能加载图片
    return Object.assign({}, zxy_p, { pic: 'http://localhost:' + zxy_PORT + '/db/img/' + zxy_name });
  });
}

const zxy_server = http.createServer((req, res) => {
  // zxy_ 允许跨域（方便直接双击 html 也能 fetch 数据）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // zxy_ 接口一：/poems，返回 poems 数组
  if (req.url === '/poems') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(zxy_getPoems()));
    return;
  }

  // zxy_ 接口二：/api/authors，返回作者列表（按作者去重并统计作品数）
  if (req.url === '/api/authors') {
    const zxy_poems = zxy_getPoems();
    const zxy_map = {};
    zxy_poems.forEach(function (zxy_p) {
      const zxy_a = zxy_p.author || '佚名';
      zxy_map[zxy_a] = (zxy_map[zxy_a] || 0) + 1;
    });
    const zxy_authors = Object.keys(zxy_map).map(function (zxy_name) {
      return { name: zxy_name, count: zxy_map[zxy_name] };
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(zxy_authors));
    return;
  }

  // zxy_ 接口三：/db/db.json，原样返回
  if (req.url === '/db/db.json') {
    const zxy_db = path.join(zxy_ROOT, 'db', 'db.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(fs.readFileSync(zxy_db, 'utf-8'));
    return;
  }

  // zxy_ 静态文件服务
  let zxy_path = decodeURIComponent(req.url.split('?')[0]);
  if (zxy_path === '/') zxy_path = '/poems-0518-zxy.html'; // 默认页

  // zxy_ 防止路径穿越
  const zxy_file = path.normalize(path.join(zxy_ROOT, zxy_path));
  if (!zxy_file.startsWith(zxy_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const zxy_ext0 = path.extname(zxy_file).toLowerCase();
  const zxy_isVideo = zxy_ext0 === '.mp4' || zxy_ext0 === '.webm';
  const zxy_range = req.headers.range;

  // zxy_ 视频请求需要支持 Range（206 分段响应），否则 iOS Safari 无法播放 / 无法拖动进度条
  if (zxy_isVideo && zxy_range) {
    fs.stat(zxy_file, (zxy_err, zxy_stat) => {
      if (zxy_err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + zxy_path);
        return;
      }
      const zxy_m = /bytes=(\d*)-(\d*)/.exec(zxy_range);
      const zxy_start = zxy_m && zxy_m[1] ? parseInt(zxy_m[1], 10) : 0;
      const zxy_end = zxy_m && zxy_m[2] ? parseInt(zxy_m[2], 10) : zxy_stat.size - 1;
      res.writeHead(206, {
        'Content-Type': zxy_TYPES[zxy_ext0],
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes ' + zxy_start + '-' + zxy_end + '/' + zxy_stat.size,
        'Content-Length': zxy_end - zxy_start + 1
      });
      fs.createReadStream(zxy_file, { start: zxy_start, end: zxy_end }).pipe(res);
    });
    return;
  }

  fs.readFile(zxy_file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + zxy_path);
      return;
    }
    const zxy_ext = path.extname(zxy_file).toLowerCase();
    const zxy_head = { 'Content-Type': zxy_TYPES[zxy_ext] || 'application/octet-stream' };
    if (zxy_isVideo) zxy_head['Accept-Ranges'] = 'bytes';
    res.writeHead(200, zxy_head);
    res.end(data);
  });
});

zxy_server.listen(zxy_PORT, () => {
  console.log('====================================================');
  console.log('  zxy 诗歌服务器已启动');
  console.log('  页面：http://localhost:' + zxy_PORT + '/poems-0518-zxy.html');
  console.log('  数据：http://localhost:' + zxy_PORT + '/poems');
  console.log('  按 Ctrl + C 停止');
  console.log('====================================================');
});
