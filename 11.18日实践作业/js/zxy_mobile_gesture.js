/* zxy_ 11.18 日实践作业 · 任务三 手势卡片：左右滑动切换逻辑 */

// zxy_ 四道中华美食（名称、简介、渐变背景）
var zxy_dishes = [
  {
    name: '宫保鸡丁',
    desc: '鸡丁、花生与干辣椒同炒，糊辣荔枝味，川菜代表。',
    bg: 'linear-gradient(135deg, #f97316, #b91c1c)'
  },
  {
    name: '麻婆豆腐',
    desc: '麻辣鲜香烫，一勺入口即见川味精髓。',
    bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)'
  },
  {
    name: '北京烤鸭',
    desc: '皮脆肉嫩，片鸭卷饼配甜面酱与葱丝。',
    bg: 'linear-gradient(135deg, #d97706, #78350f)'
  },
  {
    name: '兰州拉面',
    desc: '一清二白三红四绿五黄，牛肉清汤配手工拉面。',
    bg: 'linear-gradient(135deg, #10b981, #065f46)'
  }
];

var zxy_swipeArea = document.getElementById('zxy_swipeArea');
var zxy_card = document.getElementById('zxy_card');
var zxy_pageNum = document.getElementById('zxy_pageNum');
var zxy_dishName = document.getElementById('zxy_dishName');
var zxy_dishDesc = document.getElementById('zxy_dishDesc');
var zxy_toast = document.getElementById('zxy_toast');

var zxy_pageIndex = 0;        // zxy_ 当前卡片下标（从 0 开始）
var zxy_startX = 0;           // zxy_ 手指按下时的横坐标
var zxy_startY = 0;           // zxy_ 手指按下时的纵坐标
var zxy_lastSwitchAt = 0;     // zxy_ 上一次切换的时间戳，用于冷却判断
var zxy_toastTimer = null;    // zxy_ 提示文字定时器

var zxy_THRESHOLD = 40;       // zxy_ 横向位移阈值 40px
var zxy_COOLDOWN = 300;       // zxy_ 连滑冷却 300ms

// zxy_ 按当前下标渲染卡片内容、背景与页码
function zxy_render() {
  var zxy_dish = zxy_dishes[zxy_pageIndex];
  zxy_card.style.background = zxy_dish.bg;
  zxy_dishName.textContent = zxy_dish.name;
  zxy_dishDesc.textContent = zxy_dish.desc;
  zxy_pageNum.textContent = '第 ' + (zxy_pageIndex + 1) + ' / ' + zxy_dishes.length + ' 张';
}

// zxy_ 播放 0.3s 切换动画（dir 为 'left' 左滑、'right' 右滑）
function zxy_playSwap(zxy_dir) {
  zxy_card.classList.remove('zxy_swapLeft', 'zxy_swapRight');
  // zxy_ 强制浏览器重排，保证连续切换时动画能重新播放
  void zxy_card.offsetWidth;
  zxy_card.classList.add(zxy_dir === 'left' ? 'zxy_swapLeft' : 'zxy_swapRight');
}

// zxy_ 显示边界提示文字，1.2s 后自动淡出
function zxy_showToast(zxy_msg) {
  zxy_toast.textContent = zxy_msg;
  zxy_toast.classList.add('zxy_toastShow');
  clearTimeout(zxy_toastTimer);
  zxy_toastTimer = setTimeout(function () {
    zxy_toast.classList.remove('zxy_toastShow');
  }, 1200);
}

// zxy_ 切换卡片：越界时只给提示，不改变下标
function zxy_switchTo(zxy_target, zxy_dir) {
  if (zxy_target < 0) {
    zxy_showToast('已经是第一张了');
    return;
  }
  if (zxy_target > zxy_dishes.length - 1) {
    zxy_showToast('已经是最后一张了');
    return;
  }
  zxy_pageIndex = zxy_target;
  zxy_render();
  zxy_playSwap(zxy_dir);
}

// zxy_ 记录手指按下时的坐标
function zxy_onTouchStart(zxy_e) {
  var zxy_touch = zxy_e.changedTouches[0];
  zxy_startX = zxy_touch.clientX;
  zxy_startY = zxy_touch.clientY;
}

// zxy_ 手指抬起时计算横向位移：过阈值才切换，并带 300ms 冷却
function zxy_onTouchEnd(zxy_e) {
  var zxy_touch = zxy_e.changedTouches[0];
  var zxy_dx = zxy_touch.clientX - zxy_startX;
  var zxy_dy = zxy_touch.clientY - zxy_startY;

  // zxy_ 阈值判断：不足 40px 视为误触，不切换
  if (Math.abs(zxy_dx) < zxy_THRESHOLD) {
    return;
  }
  // zxy_ 纵向位移更大说明是在上下滚动页面，不切换
  if (Math.abs(zxy_dx) < Math.abs(zxy_dy)) {
    return;
  }
  // zxy_ 冷却判断：300ms 内的第二次滑动忽略，避免一次连滑跳两张
  var zxy_now = Date.now();
  if (zxy_now - zxy_lastSwitchAt < zxy_COOLDOWN) {
    return;
  }
  zxy_lastSwitchAt = zxy_now;

  if (zxy_dx < 0) {
    zxy_switchTo(zxy_pageIndex + 1, 'left');   // zxy_ 左滑 → 下一张
  } else {
    zxy_switchTo(zxy_pageIndex - 1, 'right');  // zxy_ 右滑 → 上一张
  }
}

// zxy_ 绑定触摸事件
zxy_swipeArea.addEventListener('touchstart', zxy_onTouchStart, { passive: true });
zxy_swipeArea.addEventListener('touchend', zxy_onTouchEnd, { passive: true });

// zxy_ 首屏渲染第一张卡片
zxy_render();
