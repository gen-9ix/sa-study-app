'use strict';
/* ═════════════════════ 0. VERSION ═════════════════════ */
const CONTENT_VERSION = 6;
const CHANGELOG = [
  {v:1, date:'2026-11-12', note:'初版：Shell、Shell Programming、網路、開機關機、使用者、Process、cron、檔案系統、LVM、Btrfs、Docker、HW2，加上歷屆考古題延伸（共 14 章）'},
  {v:2, date:'2026-11-15', note:'新增 56 張實作卡：find、grep、journalctl、systemd 除錯、LUKS 與 initramfs 救援、ACL、fstab 驗證、LVM 縮容與 RAID、Btrfs rollback、sshd 設定陷阱、SFTP 驗收與 chroot log、sftp_watchd 測試等。新卡排在各章最後，會自然混進每日新題。'},
  {v:3, date:'2026-11-16', note:'新增 3 章、65 張卡、239 題：systemd 深入（cgroups v2、資源控制、unit 依賴與順序、Type 與 Restart、timer、template）、Docker 進階（Dockerfile、layer cache、multi-stage、network driver、Compose、healthcheck、restart policy）、HW3 實戰觀念（PKI、NGINX、OIDC、PostgreSQL TLS、CI/CD、sandbox 網路與 syscall 監控、Prometheus、OpenTelemetry）。每章都有新魔王與房間家具。'},
  {v:4, date:'2026-11-16', note:'再補 64 張卡、201 題：systemd 實作（socket/path、fstab 與 mount unit、KillMode、hardening、journal 管理、cgroup 除錯）、Docker 實作（PID 1 與訊號、registry 與私有 CA、資源限制、docker.sock 風險、capabilities、防火牆繞過、.env）、HW2 逐項拆解（LUKS、rescue、縮 root、RAID10、rollback 原理、SnApper 參數、ACL 與 anonymous 的衝突、Match 設定、watchd 實作）、HW3 實作層（openssl、TLS 除錯、反向代理 header、容器 DNS 與 CA、Keycloak、JWT、PostgreSQL TLS、runner 與 workflow、SSH 部署、Docker API、sandbox 網路、MITM、DNS、Falco、SQL、Prometheus、OTel）。'},
  {v:5, date:'2026-11-17', note:'內容檢修：36 張卡加上圖解（開機流程、fd 與重導向、NAT、SSH 轉發、LVM、process 狀態、Docker 網路與 layer cache、cgroup、PKI、HW3 架構等）；43 張原本只有 1 題的卡各補 1 到 2 題；新增 4 題簡答；約 300 題選擇題重寫錯誤選項或縮短正解，「正解是最長選項」的比例從 61% 降到 28%（接近隨機的 25%），不能再靠選最長的猜對；17 題打指令題接受更多等價寫法。'},
  {v:6, date:'2026-11-17', note:'考試範圍改用 Debian：2024 以前 FreeBSD 時期的考古題改編成 Debian 版（裝軟體 apt、忘記 root 密碼用 GRUB init=/bin/bash、logrotate、nftables、rsyslog、cron.daily 與 atd、/etc/shadow 的 yescrypt、systemd vs SysV），FreeBSD 專屬的練習也換成 Debian 對應（chattr、systemctl enable --now 等）。投影片本身有的 FreeBSD 對照仍保留。'},
];

