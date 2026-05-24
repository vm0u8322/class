FROM python:3.10-slim

# 安裝 OpenCV 與本機 OCR 所需的系統依賴庫
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 創建一個 UID 為 1000 的非 root 使用者（Hugging Face 安全規範）
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# 複製並安裝 Python 依賴
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 複製其餘專案檔案
COPY --chown=user . $HOME/app

# Hugging Face Spaces 預設必須監聽 7860 連接埠
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
