import sys
import os
os.environ["FLAGS_use_onednn"] = "0"
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"
import json
import cv2
from PIL import Image
import numpy as np

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"text": "", "error": "No image path provided"}))
        return
        
    image_path = sys.argv[1]
    try:
        from paddleocr import PaddleOCR
        # 禁用重型文檔去扭曲與方向識別，僅保留極速文字偵測與識別
        ocr = PaddleOCR(
            text_detection_model_name="PP-OCRv4_mobile_det",
            text_recognition_model_name="PP-OCRv4_mobile_rec",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False
        )
        
        pil_img = Image.open(image_path)
        max_size = 1200
        if max(pil_img.size) > max_size:
            pil_img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        img_np = np.array(pil_img.convert("RGB"))
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        result = ocr.predict(img_bgr)
        lines = []
        if result:
            for res in result:
                # res supports dict-like get() in paddlex OCRResult
                texts = res.get('rec_texts') if hasattr(res, 'get') else res.get('rec_texts') if isinstance(res, dict) else None
                if texts:
                    lines.extend(texts)
        
        print(json.dumps({"text": " ".join(lines).strip()}, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"text": "", "error": str(exc)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
