# WP Workspace 新電腦建置說明（Windows）

是的，**`git pull` 之後要先安裝依賴**，才可以正確 build。

---

## 1. 先決條件

1. 安裝 **Node.js 20+**（建議 LTS）
2. 安裝 **pnpm**

```powershell
npm i -g pnpm
```

---

## 2. 下載專案

```powershell
git clone https://github.com/chenyuping1998/wp.git
cd wp
```

---

## 3. 安裝依賴（必要）

```powershell
pnpm install
```

> 這步會建立 `node_modules`。  
> 沒做這步，後面的 `pnpm build` 會失敗。

---

## 4. 建置 WildParty

```powershell
cd apps\WildParty
pnpm build
```

建置完成後，產物在：

`apps\WildParty\build`

---

## 5. 常見問題

### Q1：`workspace:*` 套件找不到
請確認你是在 **repo 根目錄**先跑過 `pnpm install`，而不是只在單一子資料夾安裝。

### Q2：有 pull 新程式後 build 出錯
先重跑：

```powershell
pnpm install
```

再 build 一次。

---

## 6. 一句話版

**新電腦流程：clone/pull → `pnpm install` → `cd apps\WildParty` → `pnpm build`。**
