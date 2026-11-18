/* zxy_ 11.18 日实践作业 · 移动端图片查看器：双指缩放 + 单指拖动 + 双击切换 */

// zxy_ 页面元素
var zxy_viewer = document.getElementById('zxy_viewer');
var zxy_img = document.getElementById('zxy_img');
var zxy_tip = document.getElementById('zxy_tip');
var zxy_hud = document.getElementById('zxy_hud');

// zxy_ 当前变换状态（缩放倍数 + 位移，单位 px，transform-origin 为左上角）
var zxy_scale = 1;
var zxy_tx = 0;
var zxy_ty = 0;

// zxy_ 常量
var zxy_MIN_SCALE = 1;      // 最小 1 倍
var zxy_MAX_SCALE = 4;      // 最大 4 倍
var zxy_TAP_DELAY = 300;    // 双击判定的最大间隔（ms）
var zxy_TAP_MOVE = 10;      // 单次点击允许的最大位移（px）
var zxy_ANIM_MS = 250;      // 过渡动画时长 0.25s

// zxy_ 容器尺寸（旋转屏幕后需要重新读取）
var zxy_viewW = 0;
var zxy_viewH = 0;

// zxy_ 双指缩放过程状态
var zxy_pinchActive = false;    // 是否处于双指缩放中
var zxy_pinchStartDist = 0;     // 双指初始间距
var zxy_pinchStartScale = 1;    // 双指按下时的倍数
var zxy_pinchMidX = 0;          // 双指中点（容器坐标）
var zxy_pinchMidY = 0;
var zxy_pinchStartTx = 0;       // 双指按下时的位移
var zxy_pinchStartTy = 0;

// zxy_ 单指拖动过程状态
var zxy_dragStartX = 0;         // 拖动起点（屏幕坐标）
var zxy_dragStartY = 0;
var zxy_dragStartTx = 0;        // 拖动开始时的位移
var zxy_dragStartTy = 0;
var zxy_dragMoved = 0;          // 本次手势累计位移，用于区分点击与拖动

// zxy_ 双击识别状态
var zxy_lastTapTime = 0;
var zxy_lastTapX = 0;
var zxy_lastTapY = 0;

var zxy_animTimer = null;       // 过渡类移除定时器

// zxy_ 读取容器宽高，用于边界计算
function zxy_readSize() {
  var zxy_rect = zxy_viewer.getBoundingClientRect();
  zxy_viewW = zxy_rect.width;
  zxy_viewH = zxy_rect.height;
}

// zxy_ 把当前倍数与位移写入 transform，并更新倍数显示
function zxy_apply() {
  zxy_img.style.transform =
    'translate3d(' + zxy_tx + 'px,' + zxy_ty + 'px,0) scale(' + zxy_scale + ')';
  zxy_hud.textContent = zxy_scale.toFixed(2) + 'x';
}

// zxy_ 根据当前倍数计算位移允许范围（图片以左上角为原点铺满容器）
function zxy_bounds() {
  return {
    minX: -(zxy_scale - 1) * zxy_viewW,
    maxX: 0,
    minY: -(zxy_scale - 1) * zxy_viewH,
    maxY: 0
  };
}

// zxy_ 越界阻尼：超出边界时只保留 35% 的溢出量，形成橡胶拉伸感
function zxy_damp(zxy_v, zxy_min, zxy_max) {
  if (zxy_v < zxy_min) {
    return zxy_min + (zxy_v - zxy_min) * 0.35;
  }
  if (zxy_v > zxy_max) {
    return zxy_max + (zxy_v - zxy_max) * 0.35;
  }
  return zxy_v;
}

// zxy_ 把位移严格夹回边界内（松手后调用）
function zxy_clamp() {
  var zxy_b = zxy_bounds();
  zxy_tx = Math.min(zxy_b.maxX, Math.max(zxy_b.minX, zxy_tx));
  zxy_ty = Math.min(zxy_b.maxY, Math.max(zxy_b.minY, zxy_ty));
}

// zxy_ 临时开启 0.25s 过渡，动画结束后移除（手势过程中不加，保证跟手）
function zxy_animate() {
  zxy_img.classList.add('zxy_anim');
  clearTimeout(zxy_animTimer);
  zxy_animTimer = setTimeout(function () {
    zxy_img.classList.remove('zxy_anim');
  }, zxy_ANIM_MS + 10);
}

// zxy_ 计算两个触点之间的距离
function zxy_distance(zxy_t1, zxy_t2) {
  var zxy_dx = zxy_t1.clientX - zxy_t2.clientX;
  var zxy_dy = zxy_t1.clientY - zxy_t2.clientY;
  return Math.sqrt(zxy_dx * zxy_dx + zxy_dy * zxy_dy) || 1;
}

// zxy_ 计算两指中点并换算成容器内坐标
function zxy_mid(zxy_t1, zxy_t2) {
  var zxy_rect = zxy_viewer.getBoundingClientRect();
  return {
    x: (zxy_t1.clientX + zxy_t2.clientX) / 2 - zxy_rect.left,
    y: (zxy_t1.clientY + zxy_t2.clientY) / 2 - zxy_rect.top
  };
}

// zxy_ 开始双指缩放：记录初始间距、倍数、中点与当时的位移
function zxy_startPinch(zxy_touches) {
  var zxy_m = zxy_mid(zxy_touches[0], zxy_touches[1]);
  zxy_pinchActive = true;
  zxy_pinchStartDist = zxy_distance(zxy_touches[0], zxy_touches[1]);
  zxy_pinchStartScale = zxy_scale;
  zxy_pinchMidX = zxy_m.x;
  zxy_pinchMidY = zxy_m.y;
  zxy_pinchStartTx = zxy_tx;
  zxy_pinchStartTy = zxy_ty;
  // zxy_ 双指手势不参与双击判定
  zxy_dragMoved = 99;
}

// zxy_ 手指按下：区分单指与双指，分别记录起点
function zxy_onTouchStart(zxy_e) {
  zxy_readSize();
  if (zxy_e.touches.length >= 2) {
    zxy_startPinch(zxy_e.touches);
    return;
  }
  if (zxy_e.touches.length === 1) {
    var zxy_t = zxy_e.touches[0];
    zxy_pinchActive = false;
    zxy_dragStartX = zxy_t.clientX;
    zxy_dragStartY = zxy_t.clientY;
    zxy_dragStartTx = zxy_tx;
    zxy_dragStartTy = zxy_ty;
    zxy_dragMoved = 0;
  }
}

// zxy_ 手指移动：双指按距离缩放、单指在放大后拖动
function zxy_onTouchMove(zxy_e) {
  if (zxy_e.touches.length >= 2) {
    zxy_e.preventDefault();
    if (!zxy_pinchActive) {
      zxy_startPinch(zxy_e.touches);
    }

    // zxy_ 新的倍数 = 初始倍数 × (当前间距 / 初始间距)，并限制在 1～4 倍
    var zxy_ratio = zxy_distance(zxy_e.touches[0], zxy_e.touches[1]) / zxy_pinchStartDist;
    var zxy_nextScale = zxy_pinchStartScale * zxy_ratio;
    zxy_nextScale = Math.min(zxy_MAX_SCALE, Math.max(zxy_MIN_SCALE, zxy_nextScale));

    // zxy_ 以两指中点为缩放基准：中点下方的图像点始终跟着中点走，画面不会跳
    var zxy_m = zxy_mid(zxy_e.touches[0], zxy_e.touches[1]);
    var zxy_k = zxy_nextScale / zxy_pinchStartScale;
    zxy_scale = zxy_nextScale;
    zxy_tx = zxy_m.x - zxy_k * (zxy_pinchMidX - zxy_pinchStartTx);
    zxy_ty = zxy_m.y - zxy_k * (zxy_pinchMidY - zxy_pinchStartTy);

    // zxy_ 缩放过程中的位移越界只做阻尼，松手后再严格夹紧
    var zxy_b = zxy_bounds();
    zxy_tx = zxy_damp(zxy_tx, zxy_b.minX, zxy_b.maxX);
    zxy_ty = zxy_damp(zxy_ty, zxy_b.minY, zxy_b.maxY);

    zxy_apply();
    return;
  }

  // zxy_ 单指：只有放大后才允许拖动，1x 时不能拖出边界
  if (zxy_e.touches.length === 1 && zxy_scale > 1) {
    zxy_e.preventDefault();
    var zxy_touch = zxy_e.touches[0];
    var zxy_dx = zxy_touch.clientX - zxy_dragStartX;
    var zxy_dy = zxy_touch.clientY - zxy_dragStartY;
    zxy_dragMoved = Math.max(zxy_dragMoved, Math.abs(zxy_dx) + Math.abs(zxy_dy));

    zxy_tx = zxy_dragStartTx + zxy_dx;
    zxy_ty = zxy_dragStartTy + zxy_dy;

    var zxy_bb = zxy_bounds();
    zxy_tx = zxy_damp(zxy_tx, zxy_bb.minX, zxy_bb.maxX);
    zxy_ty = zxy_damp(zxy_ty, zxy_bb.minY, zxy_bb.maxY);

    zxy_apply();
  }
}

// zxy_ 手指抬起：双指变单指时重设拖动起点，全部离开时回弹并判断双击
function zxy_onTouchEnd(zxy_e) {
  // zxy_ 还剩一根手指：以它为新的拖动起点，画面不会因为手指数量变化而跳一下
  if (zxy_e.touches.length === 1) {
    var zxy_t = zxy_e.touches[0];
    zxy_pinchActive = false;
    zxy_dragStartX = zxy_t.clientX;
    zxy_dragStartY = zxy_t.clientY;
    zxy_dragStartTx = zxy_tx;
    zxy_dragStartTy = zxy_ty;
    zxy_dragMoved = 99;
    return;
  }
  if (zxy_e.touches.length > 0) {
    return;
  }

  // zxy_ 全部手指离开：回到 1x 时归零位移，放大状态则严格限制在边界内
  zxy_pinchActive = false;
  zxy_animate();
  if (zxy_scale <= 1.001) {
    zxy_scale = 1;
    zxy_tx = 0;
    zxy_ty = 0;
  } else {
    zxy_clamp();
  }
  zxy_apply();

  // zxy_ 双击判定：本次几乎没位移，且与上一次点击间隔在 300ms 内
  if (zxy_dragMoved < zxy_TAP_MOVE) {
    var zxy_now = Date.now();
    var zxy_touch = zxy_e.changedTouches[0];
    var zxy_nearLast =
      Math.abs(zxy_touch.clientX - zxy_lastTapX) < 30 &&
      Math.abs(zxy_touch.clientY - zxy_lastTapY) < 30;

    if (zxy_now - zxy_lastTapTime < zxy_TAP_DELAY && zxy_nearLast) {
      zxy_toggleZoom(zxy_touch);
      zxy_lastTapTime = 0;   // zxy_ 重置，避免三连击再次触发
    } else {
      zxy_lastTapTime = zxy_now;
      zxy_lastTapX = zxy_touch.clientX;
      zxy_lastTapY = zxy_touch.clientY;
    }
  }
}

// zxy_ 触摸被系统中断：同样把位移夹回边界并播放回弹
function zxy_onTouchCancel() {
  zxy_pinchActive = false;
  zxy_animate();
  if (zxy_scale <= 1.001) {
    zxy_scale = 1;
    zxy_tx = 0;
    zxy_ty = 0;
  } else {
    zxy_clamp();
  }
  zxy_apply();
}

// zxy_ 双击在 1x 与 2x 之间切换，以点击位置为缩放基准
function zxy_toggleZoom(zxy_touch) {
  var zxy_rect = zxy_viewer.getBoundingClientRect();
  var zxy_px = zxy_touch.clientX - zxy_rect.left;
  var zxy_py = zxy_touch.clientY - zxy_rect.top;

  zxy_animate();

  if (zxy_scale > 1.05) {
    // zxy_ 已放大：回到 1 倍并清零位移
    zxy_scale = 1;
    zxy_tx = 0;
    zxy_ty = 0;
  } else {
    // zxy_ 放大到 2 倍：让点击处的图像点保持不动（tx = p - 2p）
    zxy_scale = 2;
    zxy_tx = zxy_px - zxy_scale * zxy_px;
    zxy_ty = zxy_py - zxy_scale * zxy_py;
    zxy_clamp();
  }
  zxy_apply();
}

// zxy_ 旋转屏幕或改变窗口：按比例换算位移并重新夹紧，倍数保持不变
function zxy_onResize() {
  var zxy_oldW = zxy_viewW || 1;
  var zxy_oldH = zxy_viewH || 1;

  // zxy_ 旧尺寸为 0 说明还没初始化过，直接读取即可
  zxy_readSize();

  if (zxy_scale > 1) {
    zxy_tx = zxy_tx * (zxy_viewW / zxy_oldW);
    zxy_ty = zxy_ty * (zxy_viewH / zxy_oldH);
    zxy_clamp();
  } else {
    zxy_tx = 0;
    zxy_ty = 0;
  }

  zxy_animate();
  zxy_apply();
}

// zxy_ 打开页面时显示「双指缩放请用手机打开」，3 秒后淡出
function zxy_showTip() {
  zxy_tip.classList.add('zxy_tipShow');
  setTimeout(function () {
    zxy_tip.classList.remove('zxy_tipShow');
  }, 3000);
}

// zxy_ 绑定触摸事件（必须 passive:false，才能阻止浏览器默认缩放与滚动）
zxy_viewer.addEventListener('touchstart', zxy_onTouchStart, { passive: false });
zxy_viewer.addEventListener('touchmove', zxy_onTouchMove, { passive: false });
zxy_viewer.addEventListener('touchend', zxy_onTouchEnd, { passive: false });
zxy_viewer.addEventListener('touchcancel', zxy_onTouchCancel, { passive: false });

// zxy_ 旋转屏幕时保留缩放状态
window.addEventListener('resize', zxy_onResize);
window.addEventListener('orientationchange', zxy_onResize);

// zxy_ 初始化：读取尺寸、渲染初始状态、显示提示
zxy_readSize();
zxy_apply();
zxy_showTip();
