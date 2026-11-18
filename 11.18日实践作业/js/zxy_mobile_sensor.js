/* zxy_ 11.18 日实践作业 · 摇一摇抽今日菜谱：devicemotion + 冷却 + 不支持降级 */

// zxy_ 页面元素
var zxy_statusEl = document.getElementById('zxy_status');
var zxy_resultEl = document.getElementById('zxy_result');
var zxy_dishNameEl = document.getElementById('zxy_dishName');
var zxy_dishDescEl = document.getElementById('zxy_dishDesc');
var zxy_pickBtn = document.getElementById('zxy_pick');
var zxy_countEl = document.getElementById('zxy_count');

// zxy_ 参数常量
var zxy_THRESHOLD = 18;      // 合成加速度阈值（含重力，静止约 9.8）
var zxy_COOLDOWN = 1500;     // 冷却时间 1.5 秒，防止一次摇动重复触发
var zxy_DATA_WAIT = 1500;    // 等待有效传感器数据的时限，超时判定为不支持

// zxy_ 运行状态
var zxy_lastShakeAt = 0;     // 上次触发时间
var zxy_count = 0;           // 累计抽取次数
var zxy_hasData = false;     // 是否收到过有效的加速度数据
var zxy_motionBound = false; // 是否已绑定 devicemotion
var zxy_checkTimer = null;   // 数据检测定时器
var zxy_permState = 'unknown'; // iOS 授权状态：unknown / granted / denied
var zxy_currentIndex = -1;   // 当前菜品下标，用于避免连续抽到同一道

// zxy_ 菜谱数据
var zxy_dishes = [
  { name: '番茄炒蛋', desc: '酸甜开胃，公认的米饭杀手', bg: 'linear-gradient(135deg, #fb7185, #be123c)' },
  { name: '宫保鸡丁', desc: '糊辣荔枝味，花生脆得很', bg: 'linear-gradient(135deg, #f97316, #9a3412)' },
  { name: '麻婆豆腐', desc: '麻辣鲜香烫，一勺就能拌饭', bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)' },
  { name: '可乐鸡翅', desc: '甜咸浓汁，零失败的家常菜', bg: 'linear-gradient(135deg, #b45309, #78350f)' },
  { name: '清炒时蔬', desc: '清爽解腻，五分钟就能上桌', bg: 'linear-gradient(135deg, #22c55e, #15803d)' },
  { name: '酸辣土豆丝', desc: '脆爽带酸，成本不到五块钱', bg: 'linear-gradient(135deg, #eab308, #a16207)' }
];

// zxy_ 设置状态文字，zxy_type 取值 ok / warn / 空
function zxy_setStatus(zxy_text, zxy_type) {
  zxy_statusEl.textContent = zxy_text;
  zxy_statusEl.className = 'zxy_status' + (zxy_type ? ' zxy_' + zxy_type : '');
}

// zxy_ 判断是否为 iOS 13+ 需要用户手势授权的环境
function zxy_needPermission() {
  return typeof window.DeviceMotionEvent !== 'undefined' &&
    typeof window.DeviceMotionEvent.requestPermission === 'function';
}

// zxy_ 标记设备不支持体感，并保留手动按钮作为降级方案
function zxy_markUnsupported() {
  zxy_hasData = false;
  zxy_setStatus('当前设备不支持，请用手机打开', 'warn');
  zxy_pickBtn.textContent = '点我抽一次';
}

// zxy_ 绑定 devicemotion，并启动“数据是否真的会来”的检测
function zxy_bindMotion() {
  if (zxy_motionBound) {
    return;
  }
  zxy_motionBound = true;
  window.addEventListener('devicemotion', zxy_onMotion);

  // zxy_ 有些浏览器会派发事件但三轴都是 null，所以要按“有效数据”判断
  clearTimeout(zxy_checkTimer);
  zxy_checkTimer = setTimeout(function () {
    if (!zxy_hasData) {
      zxy_markUnsupported();
    }
  }, zxy_DATA_WAIT);
}

// zxy_ 计算合成加速度，超过阈值且不在冷却中才触发抽奖
function zxy_onMotion(zxy_e) {
  var zxy_acc = zxy_e.accelerationIncludingGravity;
  if (!zxy_acc) {
    return;
  }
  if (zxy_acc.x === null && zxy_acc.y === null && zxy_acc.z === null) {
    return;
  }

  // zxy_ 第一次拿到有效数据：说明传感器可用，清掉“不支持”的提示
  if (!zxy_hasData) {
    zxy_hasData = true;
    clearTimeout(zxy_checkTimer);
    zxy_setStatus('传感器就绪，用力摇一摇手机', 'ok');
  }

  // zxy_ 合成加速度：三轴平方和开方（含重力，静置约 9.8 m/s²）
  var zxy_x = zxy_acc.x || 0;
  var zxy_y = zxy_acc.y || 0;
  var zxy_z = zxy_acc.z || 0;
  var zxy_magnitude = Math.sqrt(zxy_x * zxy_x + zxy_y * zxy_y + zxy_z * zxy_z);

  if (zxy_magnitude > zxy_THRESHOLD) {
    zxy_onShake();
  }
}

// zxy_ 摇动触发：1.5 秒冷却内直接忽略，保证一次摇动只抽一次
function zxy_onShake() {
  var zxy_now = Date.now();
  if (zxy_now - zxy_lastShakeAt < zxy_COOLDOWN) {
    return;
  }
  zxy_lastShakeAt = zxy_now;
  zxy_draw();
  zxy_setStatus('摇到啦！1.5 秒后才能再摇一次', 'ok');
}

// zxy_ 随机抽一道菜并渲染，带弹出动画
function zxy_draw() {
  var zxy_next = Math.floor(Math.random() * zxy_dishes.length);
  // zxy_ 只有一道菜之外才去重，避免连续两次一样
  if (zxy_dishes.length > 1 && zxy_next === zxy_currentIndex) {
    zxy_next = (zxy_next + 1) % zxy_dishes.length;
  }
  zxy_currentIndex = zxy_next;

  var zxy_dish = zxy_dishes[zxy_next];
  zxy_dishNameEl.textContent = zxy_dish.name;
  zxy_dishDescEl.textContent = zxy_dish.desc;
  zxy_resultEl.style.background = zxy_dish.bg;

  // zxy_ 先移除动画类并强制重排，保证每次都能重新播放动画
  zxy_resultEl.classList.remove('zxy_pop');
  void zxy_resultEl.offsetWidth;
  zxy_resultEl.classList.add('zxy_pop');

  zxy_count++;
  zxy_countEl.textContent = '已抽 ' + zxy_count + ' 次';
}

// zxy_ iOS 13+ 申请体感权限，必须在用户手势（点击）里调用
function zxy_requestPermission() {
  zxy_setStatus('正在申请体感权限…', '');
  window.DeviceMotionEvent.requestPermission().then(function (zxy_res) {
    if (zxy_res === 'granted') {
      zxy_permState = 'granted';
      zxy_pickBtn.textContent = '点我抽一次';
      zxy_bindMotion();
      zxy_draw();
      zxy_setStatus('已授权，摇一摇手机试试', 'ok');
    } else {
      zxy_permState = 'denied';
      zxy_setStatus('未获得体感权限，可继续点按钮抽取', 'warn');
    }
  }).catch(function () {
    zxy_permState = 'denied';
    zxy_setStatus('授权失败，可继续点按钮抽取', 'warn');
  });
}

// zxy_ 按钮点击：iOS 先授权，其余情况作为降级方案直接抽一次
function zxy_onPickClick() {
  if (zxy_needPermission() && zxy_permState !== 'granted') {
    zxy_requestPermission();
    return;
  }
  zxy_draw();
  if (!zxy_hasData) {
    zxy_setStatus('当前设备不支持，请用手机打开', 'warn');
  }
}

// zxy_ 初始化：分三种情况——无事件、需要授权、直接监听
function zxy_init() {
  if (!('DeviceMotionEvent' in window)) {
    zxy_markUnsupported();
    return;
  }
  if (zxy_needPermission()) {
    zxy_pickBtn.textContent = '开启体感 · 点我授权';
    zxy_setStatus('iOS 需要先点按钮授权，才能使用摇一摇', 'warn');
    return;
  }
  zxy_bindMotion();
  zxy_setStatus('正在检测设备传感器…', '');
}

zxy_pickBtn.addEventListener('click', zxy_onPickClick);
zxy_init();
