FROM python:3.9

# 安裝 OpenCV 與圖形庫所需的底層系統依賴
# 包含編譯 PaddleOCR 依賴項 (如 lanms-neo, shapely) 所需的 swig 與建置工具
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    swig \
    cmake \
    libgeos-dev \
    libsm6 \
    libgl1 \
    libglib2.0-0 \
    libxrender1 \
    libxext6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 建立 UID 1000 的安全使用者（Hugging Face 規範）
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

WORKDIR $HOME/app

# 1. 先複製基本依賴清單並安裝
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir numpy==1.26.4 && \
    pip install --no-cache-dir -r requirements.txt

# 2. 分段安裝大型機器學習庫，降低 pip 解析與解壓時的記憶體峰值（避免 OOM Crash）
# 使用 PaddlePaddle 官方 CPU 專用鏡像源
RUN pip install --no-cache-dir paddlepaddle==2.6.1 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

# 預先安裝 PaddleOCR 的編譯依賴，添加 swig 與單獨安裝以節省記憶體
RUN pip install --no-cache-dir swig
RUN pip install --no-cache-dir lanms-neo
RUN pip install --no-cache-dir shapely pyclipper

# 最後安裝 PaddleOCR 與 Faster-Whisper
# 這裡強制指定 opencv-python-headless 避免 paddleocr 拉下標準版
RUN pip install --no-cache-dir paddleocr==2.8.1 opencv-python-headless==4.9.0.80
RUN pip install --no-cache-dir faster-whisper==1.0.3

# 🌟 預先下載 PaddleOCR 與 Faster-Whisper 模型，確保雲端啟動後 100% 本地加載，免除漫長下載造成的超時與卡頓！
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(text_detection_model_name='PP-OCRv4_mobile_det', text_recognition_model_name='PP-OCRv4_mobile_rec', use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False, enable_mkldnn=False)"
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('tiny', device='cpu', compute_type='int8', download_root='/home/user/app/tools/whisper_models')"


# 3. 複製專案其餘檔案
COPY --chown=user . $HOME/app

# 監聽 Hugging Face Spaces 要求的 7860 連接埠
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
