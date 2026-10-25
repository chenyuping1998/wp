# miami_main_guy 的美術規格

骨架高 1066（正規化成 1000 來比比例）

## 要準備的圖層（檔名 = attachment 名，放在 --layers 資料夾）

檔名.png                     掛在哪根骨                   建議像素      佔身高     長寬比  備註
body.png                   spine              522 x 959     90.0%    2.01  原本是加權網格
bat.png                    bat_otherwise2     718 x 277     67.4%    7.50  原本是加權網格；★ 必須在 joints.json 給座標
bat.png                    bat_otherwise2     718 x 258     67.4%    7.50  原本是加權網格；★ 必須在 joints.json 給座標
arm_r.png                  arm_r              228 x 654     61.4%    3.11  原本是加權網格
arm_l.png                  arm_l              289 x 334     31.3%    1.45  原本是加權網格
arm_r.png                  arm_r              180 x 444     41.7%    3.11  原本是加權網格
guy_head.png               face_center        184 x 283     26.6%    1.56  原本是加權網格
body.png                   neck               179 x 209     19.6%    2.01  原本是加權網格
guy_head.png               head_front         120 x 211     19.8%    1.56  原本是加權網格
chain.png                  chain20            159 x 123     14.9%    2.08  原本是加權網格
fingers.png                hand               130 x 112     12.2%    1.13  
hand_l.png                 hand               124 x 106     11.6%    1.27  
lenses.png                 face_center        131 x 62      12.3%    2.76  原本是加權網格
lenses.png                 face_center        131 x 62      12.3%    2.76  原本是加權網格
Glasses.png                face_center        157 x 49      14.7%    4.27  原本是加權網格

「佔身高」是這塊零件的長邊除以角色全高 —— **各部位的大小比例**。
「長寬比」是輪廓自己的長邊 / 短邊，會被 --checkart 逐層把關。

⚠️ 等比縮放不必對（--fit 會吸收），但**長寬比要對** ——
   單軸拉長或變胖就是比例錯，實測 1.3 倍就會被擋下來。

## bind pose 的關節角度（生圖要對的姿勢）

骨                         世界角度        長度       父骨
bat_otherwise2           16.4°     662.5 bat_otherwise
arm_l                  -124.3°     238.1   spine2
spine                    82.8°     232.8 guy_root_pelvis
bat                      20.0°     226.1     hand
bat_otherwise          -162.4°     225.0   spine2
arm_r_2                 -98.7°     224.7    arm_r
arm_r                   -72.1°     216.8   spine2
spine2                   74.3°     182.3    spine
arm_l_2                 116.6°     173.4    arm_l
head                     95.7°     160.9     neck
glasses                -172.8°      96.7     head
hand_r                 -117.8°      80.6  arm_r_2
big_finger_r           -173.9°      52.3   hand_r
chain23                  13.8°      50.5  chain22
hand_opposite           -91.6°      50.0 bat_otherwise
hand                     93.7°      49.8  arm_l_2
fingers_r               171.6°      49.7   hand_r
chain22                  37.1°      47.4  chain21
neck                     95.8°      47.0   spine2
mask2                   -87.5°      40.7     mask
chain17                -159.5°      39.9  chain16
chain16                -140.8°      38.8  chain15
chain18                 177.2°      38.0  chain17
mask                    -82.3°      33.9 face_center
mask3                   -91.3°      33.9    mask2
mask4                   -97.6°      33.9    mask3
chain13                 -38.2°      32.5 guy_root_pelvis
chain15                -119.1°      32.4  chain14
chain21                  54.3°      32.1  chain20
chain14                 -90.1°      28.2  chain13
chain20                  77.3°      25.0  chain19
chain19                 118.2°      23.1  chain18

用 --sheet 把這個姿勢畫成圖，生圖前後各對一次。
