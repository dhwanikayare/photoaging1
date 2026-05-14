# AI Photoaging Insight

AI Photoaging Insight is a web based application that uses deep learning to analyse facial images and provide an estimated photoaging risk insight. The system combines image based prediction with lifestyle and environmental exposure factors such as outdoor daylight exposure, smoking, sunscreen use, and city based pollution data.

The application was developed as part of the CN6000 Final Year Project for BSc Computer Science.

## Live Application

The deployed application is available at:

https://aiphotoaginginsight.app/

## Project Overview

Photoaging refers to premature skin ageing associated with long term environmental exposure, especially ultraviolet radiation. It may appear through visible facial features such as wrinkles, uneven pigmentation, texture changes, and ageing related skin appearance.

This project explores how deep learning and web technologies can be combined to create an accessible, non clinical photoaging awareness tool. The system is intended for educational and research purposes only and does not provide medical diagnosis.

## Main Features

1. Facial image upload and camera capture

2. Face detection before analysis

3. MobileNetV2 based image classification model

4. Lifestyle and environmental exposure input form

5. Outdoor exposure, smoking, sunscreen, and pollution based scoring

6. Final photoaging risk category

7. React front end and FastAPI back end

8. Deployed web application with custom domain

## Technology Stack

| Area | Technology |
|---|---|
| Front end | React, Vite, JavaScript, CSS |
| Back end | FastAPI, Python |
| Machine learning | TensorFlow, Keras, MobileNetV2 |
| Image processing | OpenCV, NumPy, Pillow |
| Evaluation | scikit learn, Matplotlib |
| Face detection | MediaPipe |
| Deployment | DigitalOcean |
| Version control | GitHub |

## Repository Structure

```text
photoaging1
├── backend
│   ├── app
│   ├── requirements.txt
│   ├── Procfile
│   └── .python-version
├── frontend
│   ├── public
│   ├── src
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── vite.config.js
├── Model Training.ipynb
└── .gitignore
