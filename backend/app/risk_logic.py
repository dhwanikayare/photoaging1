# backend/app/risk_logic.py

from pathlib import Path
import pandas as pd
from typing import Optional
from PIL import Image

from backend.app.model_utils import predict_visible_photoaging

BASE_DIR = Path(__file__).resolve().parent
AQI_PATH = BASE_DIR / "data" / "city_pm25_aqi.csv"

# =============================
# LOAD AQI DATA
# =============================
def load_aqi():
    df = pd.read_csv(AQI_PATH)
    original_cols = set(df.columns)

    if {"City", "Country", "PM2.5 AQI Value"}.issubset(original_cols):
        df = df[["City", "Country", "PM2.5 AQI Value"]].dropna().copy()
        df.columns = ["city", "country", "pm25_aqi"]
    elif {"city", "country", "pm25_aqi"}.issubset(original_cols):
        df = df[["city", "country", "pm25_aqi"]].dropna().copy()
    else:
        raise ValueError("Invalid AQI CSV format")

    df["city"] = df["city"].astype(str).str.strip().str.lower()
    df["country"] = df["country"].astype(str).str.strip().str.lower()

    df = df.groupby(["city", "country"], as_index=False)["pm25_aqi"].mean()

    return df


aqi_df = load_aqi()


# =============================
# CORE HELPERS
# =============================
def clamp01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def to_title_case(text: Optional[str]):
    if not text:
        return None
    return " ".join(word.capitalize() for word in text.split())


def normalize_pm25(aqi: Optional[float]) -> float:
    if aqi is None:
        return 0.6
    if aqi <= 50:
        return 0.2
    elif aqi <= 100:
        return 0.4
    elif aqi <= 150:
        return 0.6
    elif aqi <= 200:
        return 0.8
    return 1.0


def category(score: float) -> str:
    if score < 0.33:
        return "Low"
    elif score < 0.66:
        return "Moderate"
    return "High"


def describe_visible_score(score: float) -> str:
    if score < 0.33:
        return "Limited visible signs"
    elif score < 0.66:
        return "Moderate visible signs"
    return "More pronounced visible signs"


def describe_exposure_score(score: float) -> str:
    if score < 0.33:
        return "Lower cumulative exposure"
    elif score < 0.66:
        return "Moderate cumulative exposure"
    return "Elevated cumulative exposure"


# =============================
# AQI LOOKUP
# =============================
def get_city_pm25(city_input: str):
    city_input = city_input.strip().lower()
    matches = aqi_df[aqi_df["city"] == city_input]

    if len(matches) == 0:
        return None, None, 0

    if len(matches) == 1:
        row = matches.iloc[0]
        return float(row["pm25_aqi"]), row["country"], 1

    mean_pm25 = float(matches["pm25_aqi"].mean())
    countries = ", ".join(sorted(matches["country"].unique()))

    return mean_pm25, countries, len(matches)


# =============================
# TEXT GENERATION
# =============================
def get_risk_text(risk_label: str) -> str:
    if risk_label == "Low":
        return (
            "Your profile suggests a lower level of photoaging risk, with relatively "
            "limited visible changes and a generally protective lifestyle pattern."
        )
    elif risk_label == "Moderate":
        return (
            "Your profile suggests a moderate level of photoaging risk, reflecting a "
            "balance between visible skin changes and cumulative environmental exposure."
        )
    return (
        "Your profile suggests a higher level of photoaging risk, with visible features "
        "and lifestyle factors indicating increased cumulative skin stress over time."
    )


def get_result_summary(risk_label: str) -> str:
    if risk_label == "Low":
        return (
            "The combined image-based and lifestyle-based assessment indicates a lower "
            "current photoaging profile."
        )
    elif risk_label == "Moderate":
        return (
            "The combined assessment suggests a moderate level of cumulative skin exposure "
            "and visible ageing patterns."
        )
    return (
        "The combined assessment indicates a higher level of cumulative exposure and more "
        "pronounced visible signs of photoaging."
    )


# =============================
# RECOMMENDATIONS
# =============================
def build_recommendations(hours, cigs, pollution_score, sunscreen):
    tips = []

    if sunscreen == "no":
        tips.append("Daily sunscreen use can help reduce cumulative ultraviolet damage.")
    if hours >= 4:
        tips.append(
            "Reducing prolonged sun exposure, especially during peak daylight hours, may help lower future skin stress."
        )
    if cigs > 0:
        tips.append(
            "Reducing or stopping smoking can support healthier skin structure and long-term skin quality."
        )
    if pollution_score >= 0.6:
        tips.append(
            "Gentle cleansing and barrier-supporting skincare may help reduce the effects of pollution exposure."
        )

    if not tips:
        tips.append(
            "Your current habits appear broadly supportive of skin health. Maintaining consistency will help preserve long-term skin quality."
        )

    return tips


def build_immediate_actions(hours, cigs, pollution_score, sunscreen):
    actions = []

    if sunscreen == "no":
        actions.append(
            "Introduce a daily broad-spectrum sunscreen as a consistent part of your morning routine."
        )
    if hours >= 4:
        actions.append(
            "Reduce prolonged sun exposure, particularly during peak midday hours when ultraviolet intensity is highest."
        )
    if cigs > 0:
        actions.append(
            "Reducing or stopping smoking can significantly improve long-term skin health and structural integrity."
        )
    if pollution_score >= 0.6:
        actions.append(
            "Incorporate gentle cleansing in the evening to remove pollutants and reduce cumulative skin stress."
        )

    if not actions:
        actions.append(
            "Your current habits are supportive of skin health. Maintaining consistency will help preserve long-term skin quality."
        )

    return actions


def get_skin_routine(risk_label):
    if risk_label == "Low":
        return [
            "Gentle daily cleanser",
            "Broad-spectrum sunscreen (SPF 30+)",
            "Lightweight moisturizer to support skin barrier",
        ]
    elif risk_label == "Moderate":
        return [
            "Gentle cleanser (morning and evening)",
            "Broad-spectrum sunscreen (SPF 30+)",
            "Barrier-supporting moisturizer",
            "Antioxidant-based skincare for environmental protection",
        ]
    return [
        "Gentle cleanser twice daily",
        "High-protection sunscreen (SPF 50)",
        "Hydrating and barrier-repair moisturizer",
        "Targeted antioxidant or repair-focused skincare",
    ]


# =============================
# MAIN ANALYSIS FUNCTION
# =============================
def run_analysis(
    img_pil: Image.Image,
    hours: float,
    cigs: int,
    city: str,
    sunscreen: str,
):
    visible_score = predict_visible_photoaging(img_pil)

    uv_score = clamp01(hours / 6.0)
    smoking_score = clamp01(cigs / 20.0)

    pm25_value, matched_country, city_matches = get_city_pm25(city)
    pollution_score = normalize_pm25(pm25_value)

    sunscreen_protection = 1.0 if sunscreen == "yes" else 0.0

    exposure_score = clamp01(
        0.70 * uv_score
        + 0.15 * smoking_score
        + 0.10 * pollution_score
        + 0.05 * (1 - sunscreen_protection)
    )

    final_score = clamp01(0.80 * visible_score + 0.20 * exposure_score)

    risk_label = category(final_score)

    return {
        "visible_score": visible_score,
        "visible_label": describe_visible_score(visible_score),
        "exposure_score": exposure_score,
        "exposure_label": describe_exposure_score(exposure_score),
        "final_score": final_score,
        "risk_label": risk_label,
        "risk_text": get_risk_text(risk_label),
        "result_summary": get_result_summary(risk_label),
        "tips": build_recommendations(hours, cigs, pollution_score, sunscreen),
        "immediate_actions": build_immediate_actions(hours, cigs, pollution_score, sunscreen),
        "routine": get_skin_routine(risk_label),
        "pm25_value": pm25_value,
        "matched_country": to_title_case(matched_country),
        "city_matches": city_matches,
        "city": city.title(),
    }