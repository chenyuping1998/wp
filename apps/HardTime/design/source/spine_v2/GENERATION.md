# ImageGen 補畫提示詞

模式：內建 imagegen，透明 PNG。每張以需求單內 `full_prisoner.png` 或 `full_warden.png` 為編輯底圖。
原始輸出保留於 `design/_incoming/spine_v2/`，切件程式正規化回 1024×2048。

共同約束：

> Use case: precise-object-edit. Production animation layer repair. Edit attached image, preserve character identity and drawing. Same clothes, proportions, pose, position and size on 1024x2048 canvas. Same semi-realistic painted rendering, line weight, matte cloth rusty texture and upper-left light. No text numbers logos or cyan light. Actual transparent background.

- **P1**: Remove BOTH ARMS and white towel completely. Paint complete khaki sleeveless prison jacket underneath: full chest, both waist sides and both shoulders, continuing existing buttons, pockets and blank name patch. End jacket at clean shoulder line where arms joined. Keep head trousers shoes untouched at exactly original positions.
- **P2**: Show ONLY the TWO ARMS in exactly the same crossed-arms pose and same position. Remove body, head, towel and legs. Upper arms from shoulder to elbow, forearms with hands. Paint the lower forearm (his right arm coming from image left) complete including area hidden by top forearm, as if top arm were transparent. Keep both arm silhouettes in original location. Full 1024x2048 transparent canvas.
- **P3**: Show ONLY trousers and shoes. Remove jacket arms towel and head. Paint waistband and hips usually covered by jacket hem up to 60 px ABOVE jacket hem. Preserve all visible trouser and shoe pixels and their positions exactly.
- **P4**: Close his eyes in a natural brief blink, relaxed closed lids, not squinting or asleep. Change absolutely nothing else. Retain entire original full body with transparent background.
- **W1**: Remove BOTH arms, nightstick, whistle with lanyard and coiled earpiece cord. Paint complete slate blue-grey sleeveless uniform shirt: both chest pockets, epaulettes, blank badge and blank shoulder patch, button line. Continue shirt 40px below belt top. Keep head trousers boots untouched in exact original positions. NO arms or hands remain.
- **W2**: Show ONLY BOTH arms in exactly same original positions and pose, no body head legs or nightstick. Raised right arm (image left) complete from shoulder to hand, hand closed gripping an invisible stick; hanging left arm (image right) complete shoulder to fingertips. Preserve original arm positions and scale, fill hidden shoulder portions.
- **W3**: Show ONLY belt trousers and boots, no shirt arms head or keys. Paint complete belt and trousers normally covered by key ring. Extend waistband 40px ABOVE belt. Preserve original trouser and boot silhouettes and positions exactly.
- **W4**: Close his eyes in a natural blink with relaxed closed eyelids. Change nothing else, keep cap moustache pose full body and all other pixels exactly as original.

額外修正 **P2_under**：

> Production animation repair P2_under, precise-object-edit. Isolate ONLY the prisoner's ANATOMICAL RIGHT forearm and hand: the forearm belonging to image LEFT elbow in crossed-arms pose. It extends from elbow at (300,700) diagonally upward-right to the hand near (685,580). REMOVE the opposite arm lying ON TOP OF IT, remove torso, head, legs and towel. Paint the complete khaki sleeve and right hand including every portion normally occluded by the top arm. Show one COMPLETE uninterrupted forearm with hand, not both arms, no torso. Keep its pose, original position and exact size within full transparent 1024x2048 canvas. Matte painted cloth in identical style, no text, no numbers, no glow.
