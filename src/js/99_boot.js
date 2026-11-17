/* ═════════════════════ 9. BOOT ═════════════════════ */
VIEW={name:'loading'}; render();
BOOT.timer=setTimeout(bootStart,3500);
initSync().finally(bootStart); initAI();
