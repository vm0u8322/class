# MochiClass Free

以 VaultSage API 為主的學生課堂檔案管理原型；本機分類只作為無 key 時的展示備援。

## 目前這版

純本機分類可以直接開啟，但比賽展示應使用 API server：

```text
E:\MochiClassFree\index.html
```

API 主流程請用本機 server 開：

```powershell
cd E:\MochiClassFree
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn server:app --host 127.0.0.1 --port 4180 --reload
```

打開：

```text
http://127.0.0.1:4180
```

主流程：

- 課表視圖
- 後端以 `.env` 或部署平台環境變數提供 VaultSage API key
- 用 VaultSage API 將打字課表解析成結構化課表
- 使用者直接上傳自己的講義、照片、錄音、筆記
- 用檔名關鍵字與檔案時間自動配到課程
- 依課程建立 API 資料夾並上傳檔案
- 點課表課程後顯示相關資料
- 針對該堂課已上傳檔案做 API 問答

## 操作手冊

1. 啟動後打開 `http://127.0.0.1:4180`。
2. 在左側課表欄確認或貼上課表文字。
3. 按「AI 解析課表」讓 API 轉成課程清單；若只是本機測試，可按「本機備援」。
4. 按「選擇檔案」或拖曳檔案到上傳區。
5. 支援常見課堂資料：PDF 講義、課堂照片、錄音檔、文字筆記。
6. 點左側課程即可查看該課所有相關檔案。
7. 圖片可以點擊預覽。
8. 右側可下載該課照片與錄音 ZIP。
9. 右側輸入問題可針對該課已同步檔案問答。
10. 按「重新開始」會清除本機保存的課表與檔案。

## 範例檔案

範例資料放在：

```text
E:\MochiClassFree\example
```

裡面包含：

- 10 份亂碼檔名 PDF 講義
- 10 份亂碼檔名 WAV 假錄音
- 課堂照片
- `課表.txt`

測試時可直接從這個資料夾選取檔案上傳。正式介面不提供「載入範例」按鈕，避免使用者誤解。

## 課表文字格式

每堂課一行，例如：

```text
週一 09:10-12:00 統計學 B302 關鍵字: 回歸, anova
週二 13:10-16:00 機器學習 A508 關鍵字: ml, 模型, 分類
週三 10:10-12:00 英文簡報 C201
```

## 免費模型規劃

這些都可以走本機或下載 Hugging Face / 開源模型，不用付費 API：

- 錄音轉文字：Whisper / faster-whisper，例如 `openai/whisper-small` 或 `Systran/faster-whisper-small`
- 中文 OCR：PaddleOCR、EasyOCR，或 Hugging Face 上的 TrOCR 類模型
- 語意搜尋：`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` 或 `intfloat/multilingual-e5-small`
- 本機問答摘要：先用抽取式摘要 + 關鍵句；有顯卡再接小型 GGUF LLM

建議比賽 demo 先把「課表入口 + 自動配課 + 多素材集中 + 未配對檔案整理」做穩，模型用可插拔方式展示即可。這樣定位會偏檔案管理，不是 NotebookLM 類問答工具。

## Render ????

Render ?????

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

?????? Render Dashboard ??????? GitHub?

```text
VAULTSAGE_API_BASE=https://api.vaultsage.ai/api/v1
VAULTSAGE_API_KEY=?? API key
```

????? `runtime.txt` ?? Python 3.11.9??? Render ??????????
