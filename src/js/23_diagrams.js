/* ═════════════════ DIAGRAMS: small inline SVG figures attached to concept cards ═════════════════
   Drawn with a few helpers on a 320-unit-wide canvas; colours come from the theme tokens. */
const DG={
  t:(x,y,t,c='',a='middle')=>`<text class="d-t ${c}" x="${x}" y="${y}" text-anchor="${a}">${esc(t)}</text>`,
  b:(x,y,w,h,t,c='',s2)=>`<rect class="d-box ${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`+(s2?DG.t(x+w/2,y+h/2-2,t)+DG.t(x+w/2,y+h/2+10,s2,'d-s'):DG.t(x+w/2,y+h/2+4,t)),
  l:(x1,y1,x2,y2,c='')=>`<line class="d-ln ${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  a:(x1,y1,x2,y2,t,c='',o)=>{ const an=Math.atan2(y2-y1,x2-x1), L=6, p=d=>`${(x2-L*Math.cos(an+d)).toFixed(1)},${(y2-L*Math.sin(an+d)).toFixed(1)}`, [lx,ly]=o||[0,-4];
    return DG.l(x1,y1,x2,y2,c)+`<polygon class="d-hd ${c}" points="${x2},${y2} ${p(0.45)} ${p(-0.45)}"/>`+(t?DG.t((x1+x2)/2+lx,(y1+y2)/2+ly,t,'d-s'):''); },
  // vertical flow of steps [{t,s,c}]
  flow:(steps,x=40,w=240,bh=30,gap=14)=>{ let y=6, out=''; steps.forEach((s,i)=>{ out+=DG.b(x,y,w,bh,s.t,s.c||'',s.s); if(i<steps.length-1) out+=DG.a(x+w/2,y+bh,x+w/2,y+bh+gap-1); y+=bh+gap; }); return [y-gap+6,out]; },
  // sequence diagram: actors [names], msgs [[from,to,label,cls]]
  seq:(actors,msgs)=>{ const n=actors.length, m=34, xs=actors.map((_,i)=>n===1?160:m+i*(320-2*m)/(n-1)), bw=Math.min(84,(320-2*m)/(n-1)-6||84);
    const H=38+msgs.length*24+8; let out='';
    xs.forEach((x,i)=>{ out+=DG.b(x-bw/2,4,bw,22,actors[i],'d-acc')+`<line class="d-ln d-dash" x1="${x}" y1="26" x2="${x}" y2="${H-4}"/>`; });
    msgs.forEach((g,k)=>{ const y=46+k*24, x1=xs[g[0]], x2=xs[g[1]]; out+=DG.a(x1+(x2>x1?2:-2),y,x2+(x2>x1?-2:2),y,g[2],g[3]||''); });
    return [H,out]; },
  // namespaces joined by veth pairs to a bridge
  bridge:(a,b,br,up)=>DG.b(20,6,120,44,a[0],'',a[1])+DG.b(180,6,120,44,b[0],'',b[1])+DG.l(80,50,80,92,'d-acc')+DG.l(240,50,240,92,'d-acc')+DG.t(86,74,'veth','d-s','start')+DG.t(246,74,'veth','d-s','start')
    +DG.b(40,92,240,30,br[0],'d-acc',br[1])+DG.a(160,122,160,150)+DG.b(90,150,140,28,up[0],'',up[1])
};
const DIAGRAMS={
  'shell.layers':()=>{ const [h,s]=DG.flow([{t:'Terminal',s:'顯示文字、收你的按鍵'},{t:'Shell',s:'解析指令、展開、執行',c:'d-acc'},{t:'Kernel',s:'管理 process、記憶體、裝置'},{t:'Hardware'}]); return [h,s+DG.t(166,43,'字元','d-s','start')+DG.t(166,87,'system call','d-s','start'),'你打的字一路往下傳，結果再一路傳回來']; },
  'shell.fd':()=>[124,DG.b(8,44,64,32,'鍵盤')+DG.b(128,34,64,52,'process','d-acc')+DG.b(248,14,64,32,'螢幕')+DG.b(248,78,64,32,'螢幕')+DG.a(72,60,128,60,'0 stdin')+DG.a(192,48,248,32,'1 stdout',"",[0,-8])+DG.a(192,72,248,92,'2 stderr',"",[0,14]),'每個 process 一出生就有三個 fd：0 讀輸入、1 寫正常輸出、2 寫錯誤訊息'],
  'shell.redir':()=>[178,DG.t(8,14,'cmd > out.txt 2>&1',"d-m",'start')+DG.b(8,24,54,48,'cmd','d-acc')+DG.b(226,30,86,36,'out.txt','d-ok')+DG.a(62,38,226,42,'1')+DG.a(62,60,226,54,'2','',[0,12])
    +DG.t(8,104,'cmd 2>&1 > out.txt',"d-m",'start')+DG.b(8,114,54,48,'cmd','d-acc')+DG.b(226,112,86,24,'out.txt','d-ok')+DG.b(226,142,86,24,'螢幕','d-bad')+DG.a(62,128,226,124,'1')+DG.a(62,150,226,154,'2','',[0,12]),'由左到右處理：2>&1 是「讓 2 指向 1 此刻指的地方」，所以順序不同結果不同'],
  'shell.pipe':()=>[112,DG.b(6,14,66,30,'cmd1')+DG.a(72,29,118,29,'stdout')+DG.b(118,14,56,30,'tee','d-acc')+DG.a(174,29,246,29,'stdin')+DG.b(246,14,66,30,'cmd2')+DG.a(146,44,146,76)+DG.b(106,76,80,28,'檔案','d-ok')+DG.t(8,66,'cmd1 | tee f | cmd2','d-m','start'),'pipe 把前一個的 stdout 接到下一個的 stdin；tee 像 T 型水管，同時存一份到檔案'],
  'net.tcpip':()=>{ const rows=[['Application','HTTP、DNS、SSH'],['Transport','TCP、UDP（port）'],['Internet','IP、ICMP（IP 位址）'],['Link','Ethernet、Wi-Fi（MAC）']]; let s=''; rows.forEach((r,i)=>{ s+=DG.b(8,6+i*32,112,26,r[0],i===1?'d-acc':'')+DG.t(130,23+i*32,r[1],'d-s','start'); });
    s+=DG.t(8,150,'封裝：每往下一層就多包一層標頭','d-s','start')+DG.b(8,158,304,30,'','')+DG.t(34,177,'Eth','d-s')+DG.b(60,162,248,22,'','')+DG.t(80,177,'IP','d-s')+DG.b(100,165,204,16,'','')+DG.t(124,177,'TCP','d-s')+DG.b(150,167,150,12,'','d-acc')+DG.t(225,177,'資料','d-s'); return [196,s,'四層各管一件事；送出時由上往下層層包裝，收到時由下往上拆開']; },
  'net.tcpudp':()=>{ const [h,s]=DG.seq(['Client','Server'],[[0,1,'SYN'],[1,0,'SYN + ACK'],[0,1,'ACK'],[0,1,'開始傳資料','d-acc']]); return [h,s,'TCP 三向交握：雙方各確認一次「我聽得到你」，連線才建立；UDP 沒有這一步']; },
  'net.dhcp':()=>{ const [h,s]=DG.seq(['Client','DHCP Server'],[[0,1,'Discover（廣播：有人能給我 IP 嗎）'],[1,0,'Offer（這個 IP 給你用）'],[0,1,'Request（我要這個）'],[1,0,'Ack（確認，租約開始）','d-acc']]); return [h,s,'DORA 四步驟：Discover → Offer → Request → Ack']; },
  'net.dns':()=>{ const [h,s]=DG.seq(['Resolver','Root','TLD','權威'],[[0,1,'www.example.com？'],[1,0,'去問 .com'],[0,2,'www.example.com？'],[2,0,'去問 example.com 的 NS'],[0,3,'www.example.com？'],[3,0,'A 記錄：IP','d-acc']]); return [h,s,'遞迴解析器替你一層層問下去：Root → TLD → 權威伺服器，最後把答案快取起來']; },
  'net.nat':()=>[128,DG.b(4,10,92,40,'內網主機','', '192.168.1.10')+DG.b(114,10,92,40,'NAT 路由器','d-acc','203.0.113.5')+DG.b(224,10,92,40,'外部伺服器','','8.8.8.8')+DG.a(96,24,114,24)+DG.a(206,24,224,24)+DG.a(224,40,206,40)+DG.a(114,40,96,40)
    +DG.t(8,72,'出去：來源 192.168.1.10:5000','d-s','start')+DG.t(8,86,'　　→ 改成 203.0.113.5:40001（SNAT）','d-s','start')+DG.t(8,104,'回來：目的 203.0.113.5:40001','d-s','start')+DG.t(8,118,'　　→ 查表改回 192.168.1.10:5000','d-s','start'),'路由器改寫來源位址並記在表上，回程封包再依表改回內網位址'],
  'net.lpf':()=>[118,DG.t(8,13,'ssh server -L 9999:localhost:8080','d-m','start')+DG.b(4,24,96,44,'筆電（client）','d-acc','監聽 :9999')+DG.b(214,24,102,44,'SSH server','', 'localhost:8080')+`<rect class="d-box d-ok" x="100" y="38" width="114" height="16" rx="8"/>`+DG.t(157,50,'SSH tunnel','d-s')+DG.a(100,84,214,84,'連線方向')+DG.t(8,106,'連筆電的 9999 = 從 server 連它自己的 8080','d-s','start'),'-L：在「本機」開一個入口，流量經 tunnel 從 server 那端出去'],
  'net.rpf':()=>[118,DG.t(8,13,'ssh server -R 0.0.0.0:9999:127.0.0.1:8080','d-m','start')+DG.b(4,24,96,44,'筆電（client）','', '127.0.0.1:8080')+DG.b(214,24,102,44,'SSH server','d-acc','監聽 :9999')+`<rect class="d-box d-ok" x="100" y="38" width="114" height="16" rx="8"/>`+DG.t(157,50,'SSH tunnel','d-s')+DG.a(214,84,100,84,'連線方向')+DG.t(8,106,'別人連 server 的 9999 = 連到筆電的 8080','d-s','start'),'-R：在「遠端」開一個入口，流量經 tunnel 回到本機這端'],
  'net.veth':()=>[184,DG.bridge(['namespace A','eth0  10.0.0.2'],['namespace B','eth0  10.0.0.3'],['bridge br0','像一台虛擬 switch'],['host eth0','對外']),'veth 是一條兩端都有插頭的虛擬網路線：一端在 namespace 裡，另一端插在 bridge 上'],
  'docker2.netdriver':()=>[184,DG.bridge(['容器 A','eth0  172.17.0.2'],['容器 B','eth0  172.17.0.3'],['docker0（bridge）','172.17.0.1，容器的 gateway'],['host eth0','經 NAT 對外']),'預設 bridge 網路：每個容器用一對 veth 接到 docker0，再由 host 做 NAT 出去'],
  'proc.fork':()=>[128,DG.t(8,22,'父','d-s','start')+DG.t(8,84,'子','d-s','start')+DG.l(28,18,300,18)+DG.b(52,8,48,20,'fork()','d-acc')+DG.b(238,8,56,20,'wait()','d-acc')+DG.a(76,28,76,70)+DG.l(76,80,250,80)+DG.b(100,70,52,20,'exec()')+DG.b(196,70,48,20,'exit()')+DG.a(250,80,266,30,'','d-dash')
    +DG.t(160,62,'換成新程式','d-s')+DG.t(8,112,'exit 之後、父還沒 wait 之前，子是 zombie','d-s','start'),'fork 複製出子 process，exec 把它換成新程式，exit 結束後由父 wait 收回結束狀態'],
  'proc.states':()=>[170,DG.b(125,46,70,30,'R','d-acc','執行／可執行')+DG.b(6,46,74,30,'S / D','', '睡眠等待')+DG.b(240,46,74,30,'T','', '被暫停')+DG.b(125,126,70,30,'Z','d-bad','zombie')
    +DG.a(125,54,80,54,'等 I/O',"",[0,-5])+DG.a(80,68,125,68,'事件發生',"",[0,12])+DG.a(195,54,240,54,'SIGSTOP',"",[0,-5])+DG.a(240,68,195,68,'SIGCONT',"",[0,12])+DG.a(160,76,160,126,'exit()',"",[20,2])+DG.a(195,141,250,141,'父 wait()')+DG.t(282,145,'消失','d-s'),'process 在這幾個狀態之間切換；Z 已經死了，只是還沒被父 process 收走'],
  'proc.termkill':()=>[112,DG.b(4,8,88,36,'SIGTERM','d-acc','15')+DG.a(92,26,112,26)+DG.b(112,8,96,36,'process 自己處理','', '可攔截、可忽略')+DG.a(208,26,228,26)+DG.b(228,8,88,36,'清理後結束','d-ok')
    +DG.b(4,64,88,36,'SIGKILL','d-bad','9')+DG.a(92,82,112,82)+DG.b(112,64,96,36,'kernel 直接處理','', '不能攔截、忽略')+DG.a(208,82,228,82)+DG.b(228,64,88,36,'立刻消失','d-bad','來不及清理'),'先送 TERM 給它機會收尾，沒反應才用 KILL'],
  'systemd.p_kill':()=>{ const [h,s]=DG.flow([{t:'systemctl stop'},{t:'執行 ExecStop=',s:'有設定才會跑'},{t:'送出 SIGTERM',s:'KillMode 決定送給誰',c:'d-acc'},{t:'等待 TimeoutStopSec',s:'預設 90 秒'},{t:'還沒結束就 SIGKILL',c:'d-bad'}]); return [h,s,'停止服務的固定流程：先禮後兵']; },
  'fs.lsl':()=>{ const str='-rwxr-xr--', x0=44, dx=23; let s=''; [...str].forEach((ch,i)=>{ s+=DG.t(x0+i*dx,26,ch,'d-big'); });
    const seg=(a,b,l,c)=>{ const x1=x0+a*dx-8, x2=x0+b*dx+8; return DG.l(x1,36,x2,36,c)+DG.l(x1,36,x1,32,c)+DG.l(x2,36,x2,32,c)+DG.t((x1+x2)/2,52,l,'d-s'); };
    s+=seg(0,0,'類型','')+seg(1,3,'擁有者 u','d-acc')+seg(4,6,'群組 g','d-ok')+seg(7,9,'其他人 o','')+DG.t(160,76,'r = 4　w = 2　x = 1　→　rwx r-x r-- = 754','d-s'); return [86,s,'第一個字元是檔案類型，後面每三個一組：擁有者、群組、其他人']; },
  'fs.link':()=>[150,DG.b(6,8,84,24,'a.txt')+DG.b(6,42,84,24,'b.txt','', '')+DG.t(48,80,'hard link：兩個名字','d-s')+DG.b(120,22,76,30,'inode 1234','d-acc','link 數 = 2')+DG.b(226,22,88,30,'資料區塊','d-ok')+DG.a(90,20,120,32)+DG.a(90,54,120,42)+DG.a(196,37,226,37)
    +DG.b(6,104,84,24,'c.txt')+DG.b(120,100,76,32,'inode 5678','', '內容：a.txt')+DG.a(90,116,120,116)+DG.a(158,100,60,34,'照路徑再找一次','d-dash',[52,4])+DG.t(48,144,'symlink：存的是路徑','d-s'),'hard link 直接指向同一個 inode；symlink 是另一個檔案，裡面存著目標的路徑'],
  'lvm.arch':()=>[196,DG.b(8,6,92,26,'/dev/sdb1')+DG.b(114,6,92,26,'/dev/sdc1')+DG.b(220,6,92,26,'/dev/sdd1')+DG.t(316,48,'PV','d-s','end')+DG.a(54,32,54,58)+DG.a(160,32,160,58)+DG.a(266,32,266,58)
    +DG.b(8,58,304,30,'VG：把所有 PV 合成一個空間池','d-acc')+DG.a(70,88,70,112)+DG.a(190,88,190,112)+DG.b(8,112,124,28,'LV root')+DG.b(140,112,100,28,'LV home')+`<rect class="d-box d-dash" x="248" y="112" width="64" height="28" rx="5"/>`+DG.t(280,130,'未分配','d-s')
    +DG.a(70,140,70,162)+DG.a(190,140,190,162)+DG.b(8,162,124,26,'ext4　掛在 /','d-ok')+DG.b(140,162,100,26,'btrfs　/home','d-ok'),'實體分割區（PV）先合成一個池（VG），再從池裡切出可以隨時調整大小的 LV'],
  'boot.stages':()=>{ const [h,s]=DG.flow([{t:'1　Firmware（UEFI / BIOS）',s:'初始化硬體，選開機裝置'},{t:'2　Boot loader（GRUB）',s:'載入 kernel 與 initramfs'},{t:'3　Kernel',s:'驅動、記憶體，準備 root 檔案系統'},{t:'4　PID 1（systemd）',s:'啟動 user space，監管服務',c:'d-acc'},{t:'5　Login services',s:'console、SSH、圖形登入'}]); return [h,s,'開機是一棒接一棒：每一階段只負責把下一階段叫起來']; },
  'docker.vsvm':()=>{ const col=(x,title,rows)=>{ let s=DG.t(x+70,14,title,'d-s'); rows.forEach((r,i)=>{ s+=DG.b(x,22+i*28,140,24,r[0],r[1]||''); }); return s; };
    return [170,col(8,'VM',[['App'],['Guest OS（各自一份 kernel）','d-bad'],['Hypervisor'],['Host OS'],['硬體']])+col(172,'Container',[['App'],['函式庫與相依套件'],['Docker Engine'],['Host OS（共用 kernel）','d-ok'],['硬體']]),'VM 每台都帶一整個作業系統；container 共用 host 的 kernel，所以輕又快']; },
  'docker2.cache':()=>{ const col=(x,title,rows)=>{ let s=DG.t(x+72,14,title,'d-s'); rows.forEach((r,i)=>{ s+=DG.b(x,22+i*28,144,24,r[0],r[1]?'d-ok':'d-bad')+DG.t(x+138,38+i*28,r[1]?'快取':'重做','d-s','end'); }); return s; };
    return [146,col(6,'先 COPY 全部',[['FROM python　　　',1],['COPY . .　　　　',0],['RUN pip install　',0],['CMD　　　　　　',0]])+col(170,'先 COPY requirements',[['FROM python　　　',1],['COPY req.txt　　',1],['RUN pip install　',1],['COPY . .　　　　',0]]),'只改了 main.py：某一層變了，它後面的層全部要重做，所以耗時的步驟要放前面']; },
  'docker2.multistage':()=>[130,DG.b(6,8,140,84,'','')+DG.t(76,24,'stage 1：builder','d-s')+DG.t(76,42,'gcc、cmake、-dev 套件','d-s')+DG.t(76,56,'原始碼','d-s')+DG.b(40,64,72,22,'my_app','d-acc')
    +DG.a(146,75,206,70)+DG.b(206,26,108,58,'','d-ok')+DG.t(260,42,'最終 image','d-s')+DG.t(260,56,'執行期函式庫','d-s')+DG.b(224,60,72,20,'my_app','d-acc')+DG.t(76,106,'很大，用完就丟','d-s')+DG.t(260,100,'很小，只留成品','d-s')+DG.t(160,122,'COPY --from=builder /app/my_app ./my_app','d-m'),'第一階段負責編譯，第二階段只把成品搬進乾淨的小 image'],
  'systemd.cgroup':()=>{ const rows=[[0,'/（root cgroup）'],[1,'init.scope　← PID 1'],[1,'system.slice'],[2,'sshd.service',1],[2,'cron.service',1],[1,'user.slice'],[2,'user-1000.slice'],[3,'session-3.scope',1]]; let s=''; rows.forEach((r,i)=>{ const x=10+r[0]*26, y=16+i*18; s+=DG.t(x+10,y,r[1],r[2]?'d-accT':'', 'start'); if(r[0]) s+=DG.l(x-10,y-4,x+4,y-4)+DG.l(x-10,y-4,x-10,y-14); });
    return [158,s+DG.t(312,154,'橘色 = 真正放 process 的葉節點','d-s','end'),'cgroup 是一棵樹：.slice 只負責分組與分資源，process 只能放在最底層的 .service / .scope']; },
  'systemd.hier':()=>{ const [h,s]=DG.flow([{t:'graphical.target',s:'圖形登入'},{t:'multi-user.target',s:'sshd、cron 等一般服務',c:'d-acc'},{t:'basic.target',s:'sockets、timers、paths、slices'},{t:'sysinit.target',s:'掛載、swap、udev 等早期初始化'}]); return [h,s,'上層 target 依賴下層：開機時由下往上啟動，要到哪一層由 default.target 決定']; },
  'systemd.restart':()=>{ const cols=['always','on-success','on-failure','on-abnormal','on-abort'], rows=[['正常結束',[1,1,0,0,0]],['exit 非 0',[1,0,1,0,0]],['被訊號殺',[1,0,1,1,1]],['逾時',[1,0,1,1,0]],['OOM',[1,0,1,1,0]]];
    let s=''; cols.forEach((c,i)=>{ s+=DG.t(96+i*48,14,c.replace('on-',''),'d-s'); }); s+=DG.t(72,14,'on-','d-s','end');
    rows.forEach((r,j)=>{ const y=38+j*22; s+=DG.t(66,y,r[0],'d-s','end')+DG.l(8,y-14,312,y-14,'d-dim'); r[1].forEach((v,i)=>{ s+=v?`<circle class="d-dot" cx="${96+i*48}" cy="${y-4}" r="5"/>`:DG.t(96+i*48,y,'·','d-s'); }); });
    return [136,s,'圓點 = 會自動重啟。最常用的是 on-failure：不正常結束才重啟']; },
  'hw3.overview':()=>[212,DG.b(6,6,66,30,'使用者','', 'judge')+DG.a(72,21,112,21)+DG.t(92,14,'80/443','d-s')+DG.b(112,6,104,30,'NGINX','d-acc','在 host，systemd')+DG.a(164,36,164,62)+DG.b(236,6,78,30,'資料庫用戶端','', '5432 直連')
    +`<rect class="d-box d-dash" x="6" y="62" width="308" height="144" rx="6"/>`+DG.t(14,76,'Docker Compose（port 只綁 127.0.0.1）','d-s','start')
    +DG.b(14,84,90,24,'IP-Srv ×3')+DG.b(114,84,90,24,'OIDC provider')+DG.b(214,84,92,24,'PostgreSQL','d-ok')+DG.b(14,116,90,24,'Prometheus')+DG.b(114,116,90,24,'Platform','d-acc')+DG.b(214,116,92,24,'Forgejo、runner')
    +DG.a(159,140,159,164)+DG.b(84,164,150,26,'sandbox 容器們','', '所有流量都經過 Platform')+DG.a(275,36,262,84),'只有 NGINX 與 PostgreSQL 對外；其他服務都躲在 NGINX 後面'],
  'hw3.pki':()=>[178,DG.b(90,6,140,30,'Root CA','d-acc','自簽，私鑰離線保存')+DG.a(160,36,160,62,'簽發',"",[18,2])+DG.b(70,62,180,30,'Intermediate CA','', 'CA:TRUE, pathlen:0')+DG.a(120,92,84,118)+DG.a(200,92,236,118)+DG.t(160,110,'簽發','d-s')
    +DG.b(8,118,150,30,'伺服器憑證','d-ok','SAN、serverAuth')+DG.b(166,118,146,30,'client 憑證','d-ok','CN、clientAuth')+DG.t(8,164,'伺服器送出：自己的憑證 + Intermediate','d-s','start')+DG.t(8,176,'用戶端只需信任 Root，沿著簽章一路驗上去','d-s','start'),'信任是一條鏈：Root 簽 Intermediate，Intermediate 簽終端憑證'],
  'hw3.oidc':()=>{ const [h,s]=DG.seq(['Client','OIDC','Platform'],[[0,1,'client_id + secret'],[1,0,'access token'],[0,2,'Authorization: Bearer token'],[2,1,'驗簽章 / introspect'],[2,0,'200 OK','d-acc']]); return [h,s,'client credentials：程式用自己的帳密換 token，再帶著 token 呼叫 API']; },
  'hw3.cicd':()=>{ const [h,s]=DG.flow([{t:'git push tag v1.2.3',s:'只有 v數字.數字.數字 會觸發'},{t:'Forgejo runner（Docker-in-Docker）',s:'build image',c:'d-acc'},{t:'push 到 Forgejo registry',s:'…/hw3/llm-sandbox-platform:v1.2.3'},{t:'SSH 到 host 部署',s:'更新 .env 的 tag → compose up -d'},{t:'GET /api/version 回傳 v1.2.3',c:'d-ok'}],30,260); return [h,s,'推一個 tag，5 分鐘內全自動換版']; },
  'hw3.p_sbxnet':()=>[150,DG.b(4,36,80,44,'sandbox','', '沒有 NET_ADMIN')+DG.a(84,58,112,58)+DG.b(112,14,104,88,'','d-acc')+DG.t(164,30,'Platform','')+DG.t(164,48,'DNS :53','d-s')+DG.t(164,62,'HTTP proxy :80','d-s')+DG.t(164,76,'HTTPS proxy :443','d-s')+DG.t(164,92,'其他流量丟棄','d-s')
    +DG.a(216,40,242,30)+DG.b(242,14,74,30,'*.ta.cs.nycu','d-ok')+DG.a(216,78,242,88)+DG.b(242,74,74,30,'其他網站','d-bad','擋下並記錄')+DG.t(8,124,'sandbox 的預設路由與 DNS 都指向 Platform，','d-s','start')+DG.t(8,138,'Platform 自己解析名稱再連線，並記錄每個事件','d-s','start'),'Platform 是 sandbox 唯一的出口'],
  'hw3.mitm':()=>[120,DG.b(4,10,72,36,'sandbox')+DG.b(124,10,72,36,'Platform','d-acc')+DG.b(244,10,72,36,'真網站')+`<rect class="d-box d-ok" x="76" y="20" width="48" height="16" rx="8"/><rect class="d-box d-ok" x="196" y="20" width="48" height="16" rx="8"/>`+DG.t(100,32,'TLS ①','d-s')+DG.t(220,32,'TLS ②','d-s')
    +DG.t(8,66,'①　Platform 用「攔截 CA」即時簽一張假憑證','d-s','start')+DG.t(8,80,'　　（sandbox 被設定成信任這個 CA）','d-s','start')+DG.t(8,98,'②　Platform 用 VM 信任的 CA + CRL 驗證真憑證','d-s','start')+DG.t(8,112,'　　驗證失敗就拒絕，並送出 tls alert','d-s','start'),'一條連線被拆成兩段 TLS，Platform 在中間看得到明文'],
  'btrfs.rollback':()=>[156,DG.t(80,12,'rollback 前','d-s')+DG.t(240,12,'rollback 後','d-s')+DG.b(8,20,144,128,'','')+DG.b(168,20,144,128,'','')+DG.t(80,36,'top-level（ID 5）','d-s')+DG.t(240,36,'top-level（ID 5）','d-s')
    +DG.b(20,46,120,26,'pool2','d-bad','改壞了')+DG.b(20,100,120,34,'snapshot/pool2/@時間','', '唯讀')+DG.b(180,46,120,26,'pool2（新的）','d-ok','可寫')+DG.b(180,100,120,34,'snapshot/pool2/@時間','', '唯讀，仍保留')+DG.a(240,100,240,74,'再做一次可寫快照',"",[0,0]),'不是把快照「貼回去」：從唯讀快照做一份可寫的新子卷，取代原本的名字'],
};
DIAGRAMS['hw2.p_rollback']=DIAGRAMS['btrfs.rollback']; DIAGRAMS['btrfs.p_rollback']=DIAGRAMS['btrfs.rollback']; DIAGRAMS['docker2.p_caps']=null; delete DIAGRAMS['docker2.p_caps'];
function diagramHTML(cid){ const f=DIAGRAMS[cid]; if(!f) return ''; let r; try{ r=f(); }catch(e){ return ''; }
  return `<figure class="dg"><svg viewBox="0 0 320 ${r[0]}" role="img" aria-label="${esc(r[2])}">${r[1]}</svg><figcaption>${esc(r[2])}</figcaption></figure>`; }

