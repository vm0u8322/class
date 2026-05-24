FROM python:3.9

# 安裝 OpenCV 與圖形庫所需的底層系統依賴
# 包含編譯 PaddleOCR 依賴項（如 shapely, pyclipper）所需的建置工具
RUN apt-get update && apt-get install -y \
    build-essential \
    libgeos-dev \
    python3-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxrender1 \
    libxext6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 建立 UID 1000 的安全使用者（Hugging Face 規範）
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# 1. 先複製基本依賴清單並安裝
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 2. 分段安裝大型機器學習庫，降低 pip 解析與解壓時的記憶體峰值（避免 OOM Crash）
# 先安裝 PaddlePaddle CPU 版
RUN pip install --no-cache-dir paddlepaddle==2.6.1 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

# 預先安裝 PaddleOCR 的編譯依賴，避免在安裝 paddleocr 時併發編譯導致 OOM
RUN pip install --no-cache-dir shapely pyclipper lanms-neo

# 最後安裝 PaddleOCR 與 Faster-Whisper
# 這裡附帶安裝 opencv-python-headless 以防止 paddleocr 強制重裝帶 GUI 的 opencv-python
RUN pip install --no-cache-dir paddleocr==2.8.1 opencv-python-headless
RUN pip install --no-cache-dir faster-whisper==1.0.3

# 3. 複製專案其餘檔案
COPY --chown=user . $HOME/app

# 監聽 Hugging Face Spaces 要求的 7860 連接埠
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
