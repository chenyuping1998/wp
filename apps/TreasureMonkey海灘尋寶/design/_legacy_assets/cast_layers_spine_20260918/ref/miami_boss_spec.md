# miami_boss 的美術規格

骨架高 1000（正規化成 1000 來比比例）

## 要準備的圖層（檔名 = attachment 名，放在 --layers 資料夾）

檔名.png                     掛在哪根骨                   建議像素      佔身高     長寬比  備註
ch3_body2.png              boss_body_perspective   444 x 868     86.8%    2.03  原本是加權網格
ch3_arm_l.png              boss_arm2_l        183 x 615     61.5%    3.25  原本是加權網格
ch3_arm_r.png              boss_arm2_r         87 x 431     43.1%    5.34  原本是加權網格
ch3_head.png               boss_head          152 x 238     23.8%    1.63  原本是加權網格
ch3_glasses.png            boss_glasses       135 x 79      13.5%    2.06  原本是加權網格
ch3_body.png               root                71 x 139     13.9%    2.03  
ch3_body2.png              boss_leg_l          74 x 131     13.1%    2.03  原本是加權網格
smoke.png                  smoke_ctrl          77 x 78       7.8%    3.37  
smoke2.png                 smoke_p6            55 x 97       9.7%    3.37  原本是加權網格
smoke2.png                 smoke_p21           55 x 97       9.7%    3.37  原本是加權網格
smoke2.png                 smoke_p15           55 x 97       9.7%    3.37  原本是加權網格
smoke.png                  smoke_p7            59 x 81       8.1%    3.37  原本是加權網格
smoke.png                  smoke_p10           59 x 81       8.1%    3.37  原本是加權網格
smoke.png                  smoke_p4            54 x 87       8.7%    3.37  原本是加權網格
smoke.png                  smoke_p19           54 x 87       8.7%    3.37  原本是加權網格
smoke.png                  smoke_p13           54 x 87       8.7%    3.37  原本是加權網格
smoke.png                  smoke_p1            56 x 73       7.3%    3.37  原本是加權網格
smoke.png                  smoke_p16           56 x 73       7.3%    3.37  原本是加權網格
smoke.png                  smoke_ctrl          69 x 59       6.9%    3.37  
smoke2.png                 smoke_p9            44 x 61       6.1%    3.37  原本是加權網格
smoke2.png                 smoke_p12           44 x 61       6.1%    3.37  原本是加權網格
smoke.png                  smoke_ctrl          47 x 54       5.4%    3.37  
Cigg.png                   boss_cigg           34 x 20       3.4%    3.90  原本是加權網格；★ 必須在 joints.json 給座標

「佔身高」是這塊零件的長邊除以角色全高 —— **各部位的大小比例**。
「長寬比」是輪廓自己的長邊 / 短邊，會被 --checkart 逐層把關。

⚠️ 等比縮放不必對（--fit 會吸收），但**長寬比要對** ——
   單軸拉長或變胖就是比例錯，實測 1.3 倍就會被擋下來。

## bind pose 的關節角度（生圖要對的姿勢）

骨                         世界角度        長度       父骨
boss_arm2_l             -67.6°     250.1 boss_arm_l
boss_leg_l              -95.9°     242.1 body_root
boss_leg_r              -97.0°     238.4 body_root
boss_arm_l             -101.7°     229.3 boss_shoulder_l
boss_spine1              90.6°     220.5     root
boss_arm2_r             -81.2°     185.5 boss_arm_r
boss_shoulder_r         -32.2°     173.7 boss_spine2
boss_arm_r              -92.3°     172.7 boss_shoulder_r
boss_shoulder_l        -179.1°     168.8 boss_spine2
boss_spine2              99.5°     132.8 boss_spine1
boss_head                87.5°     106.5 boss_neck
boss_hand_l             -52.5°      70.4 boss_arm2_l
boss_neck                92.0°      68.1 boss_spine2
boss_hand_r            -126.9°      42.3 boss_arm2_r
boss_cigg              -148.5°      27.1 boss_head

用 --sheet 把這個姿勢畫成圖，生圖前後各對一次。
