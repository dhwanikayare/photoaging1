from pathlib import Path
import numpy as np
import tensorflow as tf
from PIL import Image
IMG_SIZE = (256, 256)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "photoaging_model_v1.keras"

model = tf.keras.models.load_model(MODEL_PATH, compile=False)


def predict_visible_photoaging(img_pil: Image.Image) -> float:
    img = img_pil.convert("RGB").resize(IMG_SIZE)
    img_np = np.array(img).astype(np.float32)
    img_batch = np.expand_dims(img_np, axis=0)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(img_batch)

    pred = model.predict(x, verbose=0)

    print("MODEL PREDICTION:", pred)
    print("PREDICTION SHAPE:", pred.shape)

    return float(np.ravel(pred)[0])