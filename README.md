# MochiClass

MochiClass 是一個以 VaultSage API 為核心的學生課堂檔案整理工具。使用者可以輸入文字課表，並上傳講義、課堂照片、錄音等資料；系統會依照課程與檔案內容協助分類，讓學生點選課表中的課程後，就能集中查看該課相關的文件、照片、錄音與整理結果。

## 作品重點

- 以課表作為學生資料管理入口，不需要自己建立一堆資料夾。
- 同一門課即使分成多個時段，也會整理在同一個課程底下。
- 支援上傳 PDF 講義、課堂照片、錄音與一般文字檔。
- 可依課程查看已配對的講義、照片與錄音。
- 照片可以直接預覽。
- 可一鍵下載該課程的圖片與錄音 ZIP。
- 問答時會以該課程已配對的資料作為主要上下文。
- API key 由後端環境變數管理，不放在前端，也不提交到 GitHub。

## 使用的 API 與功能

本作品主要使用 VaultSage API，並把它放在後端統一呼叫，前端不直接保存 API key。

VaultSage API 在本作品中負責：

- 將使用者輸入的文字課表解析成結構化課表資料。
- 建立課程資料夾，讓不同課程的資料可以分開管理。
- 上傳講義、照片 OCR 文字、錄音逐字稿或其他課堂資料。
- 針對指定課程的資料進行問答與重點整理。
- 讓使用者可以連續追問同一門課的內容。

本機端則負責：

- 讀取使用者上傳的檔案。
- 依照檔案時間、檔案內容與課表資訊進行初步配對。
- 對圖片或掃描 PDF 做 OCR 輔助文字擷取。
- 對錄音做語音轉文字輔助擷取。
- 保存前端操作狀態，避免重新整理後資料立即消失。

## 創意與特色

一般筆記工具通常是先上傳資料，再由使用者自己整理分類。MochiClass 改成以「課表」為核心，讓課程本身成為檔案管理的入口。

學生上課時常會累積很多零散資料，例如白板照片、老師講義、錄音、截圖或臨時筆記。這些檔案通常不會在檔名中清楚寫出是哪一堂課，因此 MochiClass 不是只靠檔名分類，而是結合課表時間、檔案時間、OCR 內容與 API 問答，協助使用者把資料放回正確課程。

這個定位和 NotebookLM 不完全相同。NotebookLM 偏向「對一批資料問答」，MochiClass 則偏向「學生課堂資料管理」：先幫學生把資料按課表整理好，再針對每一門課查找、預覽、下載與整理重點。

## 成功畫面

下圖展示系統成功解析課表、配對 39 份檔案、連線 VaultSage API，並根據課堂照片整理重點的畫面。

![MochiClass 成功畫面](docs/success-screen.png)

## 使用流程

1. 開啟網站。
2. 在課表區貼上或輸入文字課表。
3. 按下「AI 解析課表」，由 VaultSage API 將文字轉成課程清單。
4. 上傳課堂檔案，例如 PDF 講義、照片、錄音。
5. 系統會依照課表、檔案時間與內容把資料配對到課程。
6. 點選課表上的某一門課。
7. 查看該課程底下的講義、照片、錄音與筆記。
8. 點照片可預覽圖片。
9. 可輸入問題，例如「這堂課重點是什麼？」來整理該課內容。
10. 可下載該課程的圖片與錄音 ZIP。
11. 若要清空狀態，可按「重新開始」。

## 範例資料

範例檔案放在：

```text
example/
```

其中包含：

- PDF 講義範例
- 課堂照片範例
- WAV 錄音範例
- 課表示範文字

範例檔案的檔名刻意不直接對應課程名稱，目的是展示系統不是只靠檔名比對，而是可以透過課表、時間與內容輔助分類。

## 本機執行

```powershell
cd E:\MochiClassFree
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn server:app --host 127.0.0.1 --port 4180 --reload
```

啟動後開啟：

```text
http://127.0.0.1:4180
```

本機需要建立 `.env`，內容如下：

```text
VAULTSAGE_API_BASE=https://api.vaultsage.ai/api/v1
VAULTSAGE_API_KEY=your_api_key_here
```

`.env` 不應該提交到 GitHub。

## Hugging Face Spaces 部署

本專案可使用 Hugging Face Spaces 的 Docker 模式部署。

建立 Space 時請選：

```text
SDK: Docker
Visibility: Public
```

部署後請到 Space 的 Settings > Repository secrets 設定：

```text
VAULTSAGE_API_BASE=https://api.vaultsage.ai/api/v1
VAULTSAGE_API_KEY=your_api_key_here
```

API key 不要寫進程式碼或 GitHub。Hugging Face 會從 Secrets 注入環境變數，後端再用這些環境變數呼叫 VaultSage API。

## 評審測試建議

1. 開啟部署網址。
2. 貼上範例課表或自行輸入一份課表。
3. 按「AI 解析課表」確認課程是否生成。
4. 上傳 `example/` 中的 PDF、照片與錄音範例。
5. 點選課表中的課程，確認相關檔案是否被整理到該課底下。
6. 點擊照片確認可預覽。
7. 輸入「這堂課重點是什麼？」測試課程問答。
8. 按下載確認該課程的圖片與錄音可以打包成 ZIP。
