FROM python:3.9

# 安裝 OpenCV 與圖形庫所需的底層系統依賴
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 建立 UID 1000 的安全使用者（Hugging Face 規範）
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# 1. 先複製基本依賴清單並安裝
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 2. 分段安裝大型機器學習庫，降低 pip 解析與解壓時的記憶體峰值（避免 OOM Crash）
RUN pip install --no-cache-dir paddlepaddle==2.6.1
RUN pip install --no-cache-dir paddleocr==2.8.1
RUN pip install --no-cache-dir faster-whisper==1.0.3

# 3. 複製專案其餘檔案
COPY --chown=user . $HOME/app

# 監聽 Hugging Face Spaces 要求的 7860 連接埠
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
