from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
CLASS_DIR = ROOT / "example"
FONT_NAME = "MSung-Light"


SAMPLES = [
    (
        "axq_0197_lmn.pdf",
        "英文",
        "王雅涵",
        [
            "主題：Email writing and short presentation",
            "Formal email opening: Dear Professor / Dear Ms. Wang",
            "Clear purpose sentence: I am writing to ask about...",
            "Presentation structure: opening, three key points, closing",
            "課後練習：寫一封 120 字英文 email，詢問期末報告繳交方式。",
        ],
    ),
    (
        "bravo_77xq.pdf",
        "資料庫管理系統實作",
        "林柏宇",
        [
            "本週主題：ER Model 與資料表設計",
            "Primary Key / Foreign Key 的設計原則",
            "SQL JOIN 實作：students、courses、enrollments 三表查詢",
            "作業：設計課程選課系統資料庫，至少包含三張資料表。",
        ],
    ),
    (
        "kz_4002_delta.pdf",
        "應用統計學",
        "陳冠廷",
        [
            "重點：平均數、變異數、標準差",
            "常態分配與 Z 分數：z = (x - μ) / σ",
            "信賴區間與抽樣誤差",
            "假設檢定流程：H0、H1、p-value 與顯著水準。",
        ],
    ),
    (
        "mld_88_tmp.pdf",
        "機器學習與深度學習",
        "許家豪",
        [
            "Supervised learning 與資料切分",
            "Train / validation / test split",
            "Overfitting and regularization",
            "常見模型：Decision Tree、Random Forest、CNN",
            "實作：使用 sklearn 訓練分類模型並評估 confusion matrix。",
        ],
    ),
    (
        "north_2048_q.pdf",
        "智慧工程與近代科技",
        "張哲維",
        [
            "智慧製造與工程系統的基本架構",
            "IoT 感測資料如何進入工程決策",
            "AI 在近代科技中的角色",
            "自動化、資料分析、雲端平台的整合。",
        ],
    ),
    (
        "ecm_zz91.pdf",
        "電子商務與網路行銷",
        "李昱辰",
        [
            "電商平台商業模式比較",
            "SEO 與關鍵字策略",
            "社群媒體內容規劃",
            "Conversion rate 與會員經營分析。",
        ],
    ),
    (
        "mobile_x7a.pdf",
        "行動應用開發",
        "黃子軒",
        [
            "Activity / ViewModel 基本概念",
            "UI layout 設計與事件處理",
            "API 串接流程",
            "作業：完成待辦清單 App，支援新增、完成、刪除與本機保存。",
        ],
    ),
    (
        "net_foo_31.pdf",
        "資訊網路",
        "周柏翰",
        [
            "TCP/IP 與封包傳輸",
            "OSI 七層模型",
            "IP address、subnet mask 與 gateway",
            "TCP three-way handshake 與 DNS 查詢流程。",
        ],
    ),
    (
        "sys_09_alpha.pdf",
        "Linux系統",
        "蔡承恩",
        [
            "常用指令：pwd、ls -la、cd、cat",
            "檔案權限 rwx 與 chmod",
            "使用者、群組與 process 管理",
            "shell script 基礎練習。",
        ],
    ),
    (
        "proj_2_finalish.pdf",
        "資訊管理實務專題二",
        "吳柏霖",
        [
            "專題進度檢核：需求訪談、功能列表、wireframe",
            "資料庫設計與系統核心流程 demo",
            "期末展示腳本：問題、解法、實作成果",
            "本週待辦：準備 3 分鐘簡報與系統展示。",
        ],
    ),
]


def draw_pdf(path: Path, title: str, teacher: str, lines: list[str]) -> None:
    pdf = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    y = height - 64
    pdf.setFont(FONT_NAME, 18)
    pdf.drawString(56, y, f"{title} 講義範例")
    y -= 34
    pdf.setFont(FONT_NAME, 12)
    pdf.drawString(56, y, f"授課教師：{teacher}")
    y -= 30
    pdf.drawString(56, y, "114學年度 第二學期")
    y -= 42
    pdf.setFont(FONT_NAME, 13)
    pdf.drawString(56, y, "課堂重點")
    y -= 28
    pdf.setFont(FONT_NAME, 11)
    for index, line in enumerate(lines, start=1):
        pdf.drawString(72, y, f"{index}. {line}")
        y -= 24
    pdf.showPage()
    pdf.save()


def main() -> None:
    CLASS_DIR.mkdir(exist_ok=True)
    pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))

    for old in CLASS_DIR.glob("*"):
        if old.suffix.lower() in {".txt", ".md"} and old.name != "課表.txt":
            old.unlink()

    for filename, title, teacher, lines in SAMPLES:
        draw_pdf(CLASS_DIR / filename, title, teacher, lines)


if __name__ == "__main__":
    main()
