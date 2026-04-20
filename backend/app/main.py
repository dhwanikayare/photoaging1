from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from backend.app.risk_logic import run_analysis, aqi_df

app = FastAPI(title="Photoaging Insight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aiphotoaginginsight.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Photoaging API is running"}

@app.get("/cities")
def get_cities():
    city_list = sorted(
        aqi_df["city"].dropna().astype(str).str.title().unique().tolist()
    )
    return {"cities": city_list}


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    hours: float = Form(...),
    cigs: int = Form(...),
    city: str = Form(...),
    sunscreen: str = Form(...),
):
    try:
        image_bytes = await image.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file")

    try:
        result = run_analysis(
            img_pil=img,
            hours=hours,
            cigs=cigs,
            city=city,
            sunscreen=sunscreen,
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
