/* ============================================================
 * zxy_tab.js —— 可复用 Tab 选项卡组件（zxy）
 * 作者：zxy
 * 创建时间：2026-11-04
 * 使用大模型：DeepSeek-V4.1-Flash
 * 功能名称：选项卡点击切换（监听事件 + 先清除全部选中态 + 再设置当前选中态）
 * 复用方式：
 *   1) 容器加 data-zxy-tabs="true"，data-zxy-default="索引" 可指定默认项；
 *   2) 按钮用 .zxy_tabItem + data-zxy-tab="名称"，面板用 .zxy_tabPanel + data-zxy-panel="同名"；
 *   3) 引入本文件即自动初始化，也可手动调用 window.zxy_initTabs(容器, 默认索引)。
 * ============================================================ */
(function () {
    "use strict";

    // zxy：切换选项卡 —— 先清除所有选项卡与面板的选中状态，再设置当前元素为选中状态
    function zxy_switchTab(zxy_root, zxy_index) {
        // zxy：优先在容器内查找，避免多个选项卡组件互相干扰
        var zxy_tabs = zxy_root.querySelectorAll(".zxy_tabItem");
        var zxy_panels = zxy_root.querySelectorAll(".zxy_tabPanel");
        var zxy_current = zxy_tabs[zxy_index];
        if (!zxy_current) return;

        var zxy_i;

        // zxy：① 先清除所有选项卡的选中状态
        for (zxy_i = 0; zxy_i < zxy_tabs.length; zxy_i++) {
            zxy_tabs[zxy_i].classList.remove("zxy_active");
            zxy_tabs[zxy_i].setAttribute("aria-selected", "false");
            zxy_tabs[zxy_i].setAttribute("tabindex", "-1");
        }

        // zxy：同时清除所有内容面板的显示状态
        for (zxy_i = 0; zxy_i < zxy_panels.length; zxy_i++) {
            zxy_panels[zxy_i].classList.remove("zxy_active");
            zxy_panels[zxy_i].hidden = true;
        }

        // zxy：② 再设置当前元素为选中状态
        zxy_current.classList.add("zxy_active");
        zxy_current.setAttribute("aria-selected", "true");
        zxy_current.setAttribute("tabindex", "0");

        // zxy：根据当前按钮的 data-zxy-tab 找到同名面板并显示
        var zxy_name = zxy_current.getAttribute("data-zxy-tab");
        var zxy_panel = zxy_root.querySelector('.zxy_tabPanel[data-zxy-panel="' + zxy_name + '"]');
        if (zxy_panel) {
            zxy_panel.classList.add("zxy_active");
            zxy_panel.hidden = false;
        }
    }

    // zxy：初始化选项卡容器 —— 为每个选项卡绑定点击监听，并设置默认选中项
    function zxy_initTabs(zxy_root, zxy_defaultIndex) {
        if (!zxy_root || zxy_root.getAttribute("data-zxy-ready") === "1") return;

        var zxy_tabs = zxy_root.querySelectorAll(".zxy_tabItem");
        var zxy_panels = zxy_root.querySelectorAll(".zxy_tabPanel");
        if (zxy_tabs.length === 0 || zxy_panels.length === 0) return;

        // zxy：循环为每个选项卡绑定点击监听事件（用闭包保存当前索引）
        for (var zxy_i = 0; zxy_i < zxy_tabs.length; zxy_i++) {
            (function (zxy_currentIndex) {
                zxy_tabs[zxy_currentIndex].addEventListener("click", function () {
                    zxy_switchTab(zxy_root, zxy_currentIndex);
                });
            })(zxy_i);
        }

        zxy_root.setAttribute("data-zxy-ready", "1");

        // zxy：默认选中项，未指定或非法时回退到第 0 项
        var zxy_default = typeof zxy_defaultIndex === "number" && !isNaN(zxy_defaultIndex)
            ? zxy_defaultIndex
            : 0;
        zxy_switchTab(zxy_root, zxy_default);
    }

    // zxy：自动初始化页面上所有带 data-zxy-tabs 的容器（实现组件复用）
    function zxy_autoInit() {
        var zxy_roots = document.querySelectorAll("[data-zxy-tabs]");
        for (var zxy_n = 0; zxy_n < zxy_roots.length; zxy_n++) {
            var zxy_def = parseInt(zxy_roots[zxy_n].getAttribute("data-zxy-default"), 10);
            zxy_initTabs(zxy_roots[zxy_n], zxy_def);
        }
    }

    // zxy：DOM 就绪后自动初始化（脚本放 head 或 body 末尾都可正常工作）
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", zxy_autoInit);
    } else {
        zxy_autoInit();
    }

    // zxy：暴露到全局，便于其他页面手动复用
    window.zxy_initTabs = zxy_initTabs;
})();
