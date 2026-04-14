 import { useEffect, useRef, useState } from "react";

import "./App.css";


function App() {

 const [screen, setScreen] = useState("landing");

const [image, setImage] = useState(null);

const [previewUrl, setPreviewUrl] = useState(null);

const [scanComplete, setScanComplete] = useState(false);



const [hours, setHours] = useState("");

const [cigs, setCigs] = useState("");

const [cityInput, setCityInput] = useState("");

const [city, setCity] = useState("");

const [showCityDropdown, setShowCityDropdown] = useState(false);

const [sunscreen, setSunscreen] = useState("");



const [faceBox, setFaceBox] = useState(null);

const [faceDetected, setFaceDetected] = useState(false);



const [cities, setCities] = useState([]);

const [citiesLoading, setCitiesLoading] = useState(true);



const [result, setResult] = useState(null);

const [loadingText, setLoadingText] = useState("Preparing analysis...");

const [error, setError] = useState("");



const [cameraOpen, setCameraOpen] = useState(false);

const [capturedFromCamera, setCapturedFromCamera] = useState(false);



 const videoRef = useRef(null);

const canvasRef = useRef(null);

const streamRef = useRef(null);

const cityGroupRef = useRef(null);

const faceDetectorRef = useRef(null);

  useEffect(() => {

    const fetchCities = async () => {

      try {

        const response = await fetch("http://127.0.0.1:8000/cities");

        const data = await response.json();

        setCities(data.cities || []);

      } catch (err) {

        console.error("Failed to load cities:", err);

      } finally {

        setCitiesLoading(false);

      }

    };



    fetchCities();

  }, []);



useEffect(() => {
  let cancelled = false;

  const loadFaceDetection = async () => {
    try {
      if (!window.FaceDetection) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (cancelled || !window.FaceDetection) return;

      const detector = new window.FaceDetection({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      detector.setOptions({
        model: "short",
        minDetectionConfidence: 0.6,
      });

      detector.onResults((results) => {
        if (results.detections && results.detections.length > 0) {
          const detection = results.detections[0];
          const box = detection.boundingBox;

          setFaceBox({
            xCenter: box.xCenter,
            yCenter: box.yCenter,
            width: box.width,
            height: box.height,
          });

          setFaceDetected(true);

          setTimeout(() => {
            setScanComplete(true);
          }, 1500);
        } else {
          setFaceDetected(false);
          setFaceBox(null);
          setScanComplete(false);
        }
      });

      faceDetectorRef.current = detector;
    } catch (err) {
      console.error("Failed to load MediaPipe face detection:", err);
    }
  };

  loadFaceDetection();

  return () => {
    cancelled = true;
    faceDetectorRef.current = null;
  };
}, []);

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (cityGroupRef.current && !cityGroupRef.current.contains(event.target)) {

        setShowCityDropdown(false);

      }

    };



    document.addEventListener("mousedown", handleClickOutside);

    return () => {

      document.removeEventListener("mousedown", handleClickOutside);

    };

  }, []);

const detectFace = async (imageElement) => {

  if (!faceDetectorRef.current || !imageElement) return;



  setFaceDetected(false);

  setFaceBox(null);

  setScanComplete(false);



  try {

    await faceDetectorRef.current.send({ image: imageElement });

  } catch (err) {

    console.error("Face detection failed:", err);

    setFaceDetected(false);

    setFaceBox(null);

    setScanComplete(false);

  }

};

  const filteredCities =

    cityInput.trim() === ""

      ? cities

      : cities.filter((c) =>

          c.toLowerCase().includes(cityInput.toLowerCase())

        );



  const closeCamera = () => {

    if (streamRef.current) {

      streamRef.current.getTracks().forEach((track) => track.stop());

      streamRef.current = null;

    }

    setCameraOpen(false);

  };



  const resetAll = () => {

  closeCamera();

  setScreen("landing");

  setImage(null);

  setPreviewUrl(null);

  setScanComplete(false);

  setFaceBox(null);

  setFaceDetected(false);

  setHours("");

  setCigs("");

  setCityInput("");

  setCity("");

  setShowCityDropdown(false);

  setSunscreen("");

  setResult(null);

  setError("");

  setLoadingText("Preparing analysis...");

  setCapturedFromCamera(false);

};

const handleImageChange = (e) => {

  const file = e.target.files?.[0];

  if (!file) return;



  const img = new Image();

  const reader = new FileReader();



  reader.onload = () => {

    img.src = reader.result;

  };



  img.onload = () => {

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");



    const size = 512;

    canvas.width = size;

    canvas.height = size;



    const minSide = Math.min(img.width, img.height);

    const sx = (img.width - minSide) / 2;

    const sy = (img.height - minSide) / 2;



    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);



    canvas.toBlob(

      (blob) => {

        if (!blob) return;



        const resizedFile = new File([blob], "resized.jpg", {

          type: "image/jpeg",

        });



        setImage(resizedFile);

        setPreviewUrl(URL.createObjectURL(blob));

        setCapturedFromCamera(false);

        setError("");

        setScanComplete(false);

        setFaceDetected(false);

        setFaceBox(null);

      },

      "image/jpeg",

      0.9

    );

  };



  reader.readAsDataURL(file);

};

  const openCamera = async () => {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        video: { facingMode: "user" },

        audio: false,

      });



      streamRef.current = stream;

      setCameraOpen(true);



      setTimeout(() => {

        if (videoRef.current) {

          videoRef.current.srcObject = stream;

        }

      }, 100);

    } catch (err) {

      setError("Camera access was denied or is not available on this device.");

    }

  };



const capturePhoto = () => {

  const video = videoRef.current;

  const canvas = canvasRef.current;



  if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;



  const size = 512;

  canvas.width = size;

  canvas.height = size;



  const ctx = canvas.getContext("2d");



  const minSide = Math.min(video.videoWidth, video.videoHeight);

  const sx = (video.videoWidth - minSide) / 2;

  const sy = (video.videoHeight - minSide) / 2;



  ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, size, size);



  canvas.toBlob(

    (blob) => {

      if (!blob) return;



      const file = new File([blob], "camera.jpg", { type: "image/jpeg" });



      setImage(file);

      setPreviewUrl(URL.createObjectURL(blob));

      setCapturedFromCamera(true);

      setError("");

      setScanComplete(false);

      setFaceDetected(false);

      setFaceBox(null);

      closeCamera();

    },

    "image/jpeg",

    0.9

  );

};

  const getVisibleScoreExplanation = (score) => {

    if (score < 0.33) {

      return "The facial image shows relatively limited visible features commonly associated with photoaging.";

    }

    if (score < 0.66) {

      return "The facial image shows some visible features associated with cumulative skin ageing and environmental exposure.";

    }

    return "The facial image shows more pronounced visible features associated with photoaging, including changes that may reflect longer term cumulative damage.";

  };



  const getExposureScoreExplanation = (score) => {

    if (score < 0.33) {

      return "Your reported lifestyle and environmental profile suggest a relatively lower level of cumulative exposure.";

    }

    if (score < 0.66) {

      return "Your reported lifestyle and environmental profile suggests a moderate level of cumulative exposure over time.";

    }

    return "Your reported lifestyle and environmental profile suggests a higher level of cumulative exposure that may contribute more strongly to photoaging over time.";

  };



  const getOverallRiskExplanation = (riskLabel) => {

    if (riskLabel === "Low") {

      return "Overall, the combined image based and lifestyle based assessment suggests a lower current photoaging risk profile.";

    }

    if (riskLabel === "Moderate") {

      return "Overall, the combined image based and lifestyle based assessment suggests a moderate photoaging risk profile.";

    }

    return "Overall, the combined image based and lifestyle based assessment suggests a higher photoaging risk profile.";

  };



  const getEnvironmentalExposureExplanation = (pm25Value) => {

    if (pm25Value == null) {

      return "Environmental exposure data was not available for the selected city, so a default estimate was used.";

    }



    if (pm25Value < 50) {

      return "Air quality related exposure appears relatively lower and is less likely to make a major contribution to long term skin stress.";

    }



    if (pm25Value < 100) {

      return "Air quality related exposure may contribute moderately to cumulative skin stress over time.";

    }



    return "Air quality related exposure appears elevated and may contribute more meaningfully to long term skin stress.";

  };



  const formatRoutineItem = (item) => {

    const map = {

      Cleanser: "Use a gentle cleanser morning and evening.",

      SPF: "Apply broad spectrum sunscreen daily.",

      Moisturizer: "Use a moisturizer to support barrier health.",

      Antioxidants:

        "Consider antioxidant based skincare to support environmental protection.",

    };



    return map[item] || item;

  };

const toTitleCase = (text) => {

  if (!text) return "Not available";

  return text.replace(/\w\S*/g, (word) => {

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  });

};

  const runAnalysis = async () => {

    setError("");



    if (!image) {

      setError("Please upload or capture an image.");

      setScreen("image");

      return;

    }



    if (hours === "" || Number(hours) < 0 || Number(hours) > 12) {

      setError("Please enter valid daily outdoor hours.");

      setScreen("lifestyle");

      return;

    }



    if (cigs === "" || Number(cigs) < 0 || Number(cigs) > 50) {

      setError("Please enter valid cigarette usage.");

      setScreen("lifestyle");

      return;

    }



    if (city.trim() === "") {

      setError("Please select your city from the list.");

      setScreen("lifestyle");

      return;

    }



    if (!sunscreen) {

      setError("Please select sunscreen usage.");

      setScreen("lifestyle");

      return;

    }



    setScreen("processing");



    const stages = [

      "Processing facial image features...",

      "Evaluating lifestyle and environmental exposure...",

      "Generating personalized photoaging insights...",

    ];



    let stageIndex = 0;

    setLoadingText(stages[0]);



    const interval = setInterval(() => {

      stageIndex += 1;

      if (stageIndex < stages.length) {

        setLoadingText(stages[stageIndex]);

      }

    }, 1000);



    try {

      const formData = new FormData();

      formData.append("image", image);

      formData.append("hours", hours);

      formData.append("cigs", cigs);

      formData.append("city", city);

      formData.append("sunscreen", sunscreen);



      const res = await fetch("http://127.0.0.1:8000/analyze", {

        method: "POST",

        body: formData,

      });



      if (!res.ok) {

        throw new Error("Analysis failed");

      }

const data = await res.json();

clearInterval(interval);

setResult(data.data ?? data);

setScreen("results");

    } catch (err) {

      clearInterval(interval);

      setError("Could not connect to the backend or process the request.");

      setScreen("lifestyle");

    }

  };



  const renderProgress = (step) => {

    const steps = [

      { num: 1, label: "Image" },

      { num: 2, label: "Lifestyle" },

      { num: 3, label: "Results" },

    ];



    return (

      <div className="progress-wrap">

        {steps.map((item, index) => (

          <div key={item.num} className="progress-group">

            <div className={`progress-step ${step === item.num ? "active" : ""}`}>

              <span className="progress-num">{item.num}</span>

              <span>{item.label}</span>

            </div>

            {index < steps.length - 1 && <span className="progress-arrow">→</span>}

          </div>

        ))}

      </div>

    );

  };



  if (screen === "landing") {

    return (

      <div className="app-shell landing-shell">

        <div className="landing-bg-glow glow-one"></div>

        <div className="landing-bg-glow glow-two"></div>



        <div className="container landing-container">

          <section className="hero-premium">

            <div className="hero-badge-premium">AI DRIVEN SKIN EXPOSURE ANALYSIS</div>



            <h1 className="hero-title-premium">

              Understand Your Skin

              <span> Beyond the Surface</span>

            </h1>



            <p className="hero-subtitle-premium">

              AI based assessment of visible skin ageing and lifestyle exposure,

              designed to support awareness, prevention, and better daily skin care decisions.

            </p>



            <div className="hero-button-wrap">

              <button className="primary-btn premium-cta" onClick={() => setScreen("image")}>

                Start Analysis

              </button>

            </div>



            <p className="hero-micro-note">Takes around 30 seconds</p>

          </section>



          <section className="landing-section">

            <div className="section-heading-wrap">

              <p className="section-kicker-premium">Why it matters</p>

              <h2 className="section-title-premium">Photoaging is more than just time</h2>

              <p className="section-copy-premium">

                Visible skin ageing is shaped by cumulative environmental exposure and daily behaviour, not only time.

              </p>

            </div>



            <div className="facts-grid-premium">

              <article className="fact-card-premium">

                <h3>Up to 80% of visible skin ageing is linked to sun exposure</h3>

                <p>

                  Most visible ageing is not simply time. It is driven by cumulative ultraviolet

                  exposure that gradually breaks down collagen, alters pigmentation, and changes skin structure.

                </p>

              </article>



              <article className="fact-card-premium">

                <h3>Photoaging can act as a visible marker of longer term skin damage</h3>

                <p>

                  Changes such as wrinkles, uneven tone, and loss of elasticity can reflect biological

                  damage occurring beneath the surface after repeated environmental stress.

                </p>

              </article>



              <article className="fact-card-premium">

                <h3>Early awareness can support skin cancer prevention behaviour</h3>

                <p>

                  Chronic ultraviolet exposure is a major environmental risk factor for skin cancer.

                  Recognising early signs of photoaging can encourage protective habits and timely skin checks.

                </p>

              </article>

            </div>

          </section>



          <section className="landing-section how-it-works-premium">

            <div className="section-heading-wrap">

              <p className="section-kicker-premium">How it works</p>

              <h2 className="section-title-premium">A simple three step assessment</h2>

            </div>



            <div className="steps-grid-premium">

              <div className="step-card-premium">

                <div className="step-index">01</div>

                <h3>Capture your image</h3>

                <p>Use your camera or upload a clear front facing facial image.</p>

              </div>



              <div className="step-card-premium">

                <div className="step-index">02</div>

                <h3>Add your lifestyle details</h3>

                <p>Tell us about sun exposure, location, smoking, and sunscreen habits.</p>

              </div>



              <div className="step-card-premium">

                <div className="step-index">03</div>

                <h3>Receive your assessment</h3>

                <p>Get an AI assisted photoaging insight with guidance and preventive context.</p>

              </div>

            </div>

          </section>



          <section className="landing-section closing-banner-premium">

            <div className="closing-content">

              <p className="section-kicker-premium">Built for clarity</p>

              <h2 className="closing-title">

                A calmer, more informed way to understand photoaging risk

              </h2>

              <p className="closing-copy">

                Designed to translate complex skin exposure signals into a clear, elegant,

                and human centered digital assessment experience.

              </p>



              <div className="hero-button-wrap">

                <button className="primary-btn premium-cta" onClick={() => setScreen("image")}>

                  Analyse My Skin

                </button>

              </div>

            </div>

          </section>

        </div>

      </div>

    );

  }



  if (screen === "image") {

  return (

    <div className="app-shell image-step-shell">

      <div className="image-step-glow image-glow-one"></div>

      <div className="image-step-glow image-glow-two"></div>



      <div className="container">

        {renderProgress(1)}



        <div className="image-step-hero">

          <p className="section-kicker-premium">Step 1</p>

          <h2 className="section-title-premium">Add your face image</h2>

          <p className="section-copy-premium">

            Choose how you want to provide your image. For the most reliable result,

            use a clear front facing face image with good lighting, minimal shadows,

            and no sunglasses.

          </p>

        </div>



        <div className="image-options-grid">

          <div className="image-option-card">

            <div className="image-option-icon">◉</div>

            <h3>Use your camera</h3>

            <p>

              Capture a face image directly in the app for a guided and more

              controlled experience.

            </p>



            {!cameraOpen ? (

              <button className="secondary-btn camera-open-btn" onClick={openCamera}>

                Open Camera

              </button>

            ) : (

              <div className="camera-box">

                <div className="camera-preview-shell">

                  <video

                    ref={videoRef}

                    autoPlay

                    playsInline

                    muted

                    className="camera-preview"

                  />

                </div>



                <canvas ref={canvasRef} style={{ display: "none" }} />



                <div className="camera-actions">

                  <button className="primary-btn" onClick={capturePhoto}>

                    Capture Photo

                  </button>

                  <button className="secondary-btn" onClick={closeCamera}>

                    Cancel

                  </button>

                </div>

              </div>

            )}

          </div>



          <div className="image-option-card">

            <div className="image-option-icon">↑</div>

            <h3>Upload an image</h3>

            <p>

              Use an existing clear face photo from your device. Frontal images

              work best for a stable assessment.

            </p>



            <label className="custom-upload-btn">

              Choose Image

              <input type="file" accept="image/*" onChange={handleImageChange} hidden />

            </label>

          </div>

        </div>



        {previewUrl && (

          <div className="selected-preview-card">

            <div className="preview-guidance">

              A clear face has been prepared for analysis preview.

            </div>



            <div className="premium-preview-frame fixed-preview-frame">

              <img

                src={previewUrl}

                alt="Selected preview"

                className="premium-preview-image fixed-preview-image"

                onLoad={(e) => detectFace(e.target)}

              />



              {!scanComplete && <div className="scan-overlay"></div>}



              {faceBox && (

                <div

                  className="face-box"

                  style={{

                   left: `${Math.max(0, (faceBox.xCenter - faceBox.width / 2) * 100)}%`,

top: `${Math.max(0, (faceBox.yCenter - faceBox.height / 2) * 100)}%`,

width: `${Math.min(faceBox.width * 100, 100)}%`,

height: `${Math.min(faceBox.height * 100, 100)}%`,

                  }}

                >

                  <div className="corner tl"></div>

                  <div className="corner tr"></div>

                  <div className="corner bl"></div>

                  <div className="corner br"></div>

                </div>

              )}

            </div>



            <p className="scan-status-below">

  {!scanComplete

    ? "Analyzing facial features..."

    : !faceDetected

    ? "No clear face detected"

    : "Face detected · Ready for analysis"}

</p>

          </div>

        )}



        {error && <p className="error-text">{error}</p>}



        <div className="button-row image-step-buttons">

          <button className="secondary-btn" onClick={() => setScreen("landing")}>

            Back

          </button>

          <button

            className="primary-btn premium-cta"

            onClick={() => setScreen("lifestyle")}

            disabled={!image || !scanComplete || !faceDetected}

          >

            Continue

          </button>

        </div>

      </div>

    </div>

  );

}



  if (screen === "lifestyle") {

    return (

      <div className="app-shell lifestyle-shell">

        <div className="lifestyle-glow lifestyle-glow-one"></div>

        <div className="lifestyle-glow lifestyle-glow-two"></div>



        <div className="container">

          {renderProgress(2)}



          <div className="lifestyle-hero">

            <p className="section-kicker-premium">Step 2</p>

            <h2 className="section-title-premium">Lifestyle profile</h2>

            <p className="section-copy-premium">

              These questions help estimate your longer term skin exposure patterns.

              Answer them based on your usual routine rather than a single day.

            </p>

          </div>



          <div className="lifestyle-card-premium">

            <div className="lifestyle-card-header">

              <h3>Tell us about your typical exposure</h3>

              <p>

                Your answers help combine visible facial features with lifestyle

                and environmental factors linked to photoaging.

              </p>

            </div>



            <div className="lifestyle-grid">

              <div className="input-group-premium">

                <label>How many hours do you usually spend outdoors during daylight each day?</label>

                <input

                  type="number"

                  min="0"

                  max="8"

                  step="0.5"

                  value={hours}

                  placeholder="Enter hours"

                  onChange={(e) => setHours(e.target.value)}

                />

                <small>

                  Include commuting, walking, outdoor exercise, and time spent in direct daylight.

                </small>

              </div>



              <div className="input-group-premium">

                <label>How many cigarettes do you smoke per day?</label>

                <input

                  type="number"

                  min="0"

                  max="40"

                  value={cigs}

                  placeholder="Enter number"

                  onChange={(e) => setCigs(e.target.value)}

                />

                <small>Enter 0 if you do not smoke.</small>

              </div>



              <div className="input-group-premium city-group" ref={cityGroupRef}>

                <label>Which city do you live in most of the time?</label>



                <input

                  type="text"

                  value={cityInput}

                  placeholder={citiesLoading ? "Loading cities..." : "Search your city"}

                  onChange={(e) => {

                    setCityInput(e.target.value);

                    setCity("");

                    setShowCityDropdown(true);

                  }}

                  onFocus={() => setShowCityDropdown(true)}

                  disabled={citiesLoading}

                />



                {showCityDropdown && !citiesLoading && filteredCities.length > 0 && (

                  <div className="city-dropdown">

                    {filteredCities.slice(0, cityInput.trim() === "" ? 8 : 12).map((c) => (

                      <button

                        key={c}

                        type="button"

                        className="city-option"

                        onClick={(e) =>  {

                          e.preventDefault();

                          setCity(c);

                          setCityInput(c);

                          setShowCityDropdown(false);

                          setError("");

                         

                        }

                      }

                      >

                        {c}

                      </button>

                    ))}

                  </div>

                )}



                {showCityDropdown &&

                  cityInput.trim() !== "" &&

                  !citiesLoading &&

                  filteredCities.length === 0 && (

                    <div className="city-dropdown">

                      <div className="city-option city-option-empty">

                        No matching city found

                      </div>

                    </div>

                  )}



                <small>

                  This helps estimate environmental exposure using city level air quality data.

                </small>

              </div>



              <div className="input-group-premium">

                <label>Do you apply sunscreen daily?</label>

                <select

                  value={sunscreen}

                  onChange={(e) => setSunscreen(e.target.value)}

                >

                  <option value="">Select an option</option>

                  <option value="yes">Yes</option>

                  <option value="no">No</option>

                </select>

                <small>

                  Daily sunscreen use is one of the most protective habits against cumulative photoaging.

                </small>

              </div>

            </div>



            <div className="lifestyle-summary-row">

              <div className="summary-pill">

                <span className="summary-pill-label">Sun exposure</span>

                <span className="summary-pill-value">

                  {hours === "" ? "Not set" : `${hours} hrs/day`}

                </span>

              </div>



              <div className="summary-pill">

                <span className="summary-pill-label">Smoking</span>

                <span className="summary-pill-value">

                  {cigs === "" ? "Not set" : `${cigs} / day`}

                </span>

              </div>



              <div className="summary-pill">

                <span className="summary-pill-label">Location</span>

                <span className="summary-pill-value">

                  {city === "" ? "Not set" : city}

                </span>

              </div>



              <div className="summary-pill">

                <span className="summary-pill-label">Sunscreen</span>

                <span className="summary-pill-value">

                  {sunscreen === "" ? "Not set" : sunscreen}

                </span>

              </div>

            </div>



            {error && <p className="error-text">{error}</p>}



            <div className="button-row lifestyle-buttons">

              <button className="secondary-btn" onClick={() => setScreen("image")}>

                Back

              </button>

              <button className="primary-btn premium-cta" onClick={runAnalysis}>

                Run Analysis

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }



  if (screen === "processing") {

    return (

      <div className="app-shell processing-shell">

        <div className="processing-glow processing-glow-one"></div>

        <div className="processing-glow processing-glow-two"></div>



        <div className="container">

          {renderProgress(3)}



          <div className="processing-card-premium">

            <p className="section-kicker-premium">Step 3</p>

            <h2 className="processing-title">Analyzing your profile</h2>

            <p className="processing-copy">

              Please wait while the system processes your facial image,

              lifestyle details, and environmental exposure profile.

            </p>



            <div className="processing-loader-wrap">

              <div className="processing-ring"></div>

            </div>



            <div className="processing-stage-list">

              <div className={`processing-stage-card ${loadingText === "Processing facial image features..." ? "active" : ""}`}>

                Processing facial image features...

              </div>



              <div className={`processing-stage-card ${loadingText === "Evaluating lifestyle and environmental exposure..." ? "active" : ""}`}>

                Evaluating lifestyle and environmental exposure...

              </div>



              <div className={`processing-stage-card ${loadingText === "Generating personalized photoaging insights..." ? "active" : ""}`}>

                Generating personalized photoaging insights...

              </div>

            </div>

          </div>

        </div>

      </div>

    );

  }



  if (screen === "results" && result) {

    const riskClass =

      result.risk_label === "Low"

        ? "risk-low"

        : result.risk_label === "Moderate"

        ? "risk-moderate"

        : "risk-high";



    return (

      <div className="app-shell results-shell">

        <div className="results-glow results-glow-one"></div>

        <div className="results-glow results-glow-two"></div>



        <div className="container">

          {renderProgress(3)}



          <div className="results-hero-card">

            <p className="section-kicker-premium">Your result</p>

            <h2 className="results-main-title">Photoaging assessment</h2>



            <div className={`result-banner-premium ${riskClass}`}>

              <div className="result-banner-title">

                {result.risk_label} Photoaging Risk

              </div>

              <p className="result-banner-copy">{result.risk_text}</p>



              <div className="result-pill-row">

                <span className="result-pill">

                  Visible signs: {result.visible_label}

                </span>

                <span className="result-pill">

                  Exposure level: {result.exposure_label}

                </span>

                <span className="result-pill">

                  Score: {result.final_score.toFixed(2)}

                </span>

              </div>

            </div>

          </div>



          <div className="results-grid-clean">

            <div className="metric-card-clean">

              <span className="metric-label-clean">Visible skin change</span>

              <span className="metric-value-clean">

                {result.visible_score.toFixed(2)}

              </span>

              <span className="metric-sub-clean">{result.visible_label}</span>

              <p className="metric-explainer">

                {getVisibleScoreExplanation(result.visible_score)}

              </p>

            </div>



            <div className="metric-card-clean">

              <span className="metric-label-clean">Exposure profile</span>

              <span className="metric-value-clean">

                {result.exposure_score.toFixed(2)}

              </span>

              <span className="metric-sub-clean">{result.exposure_label}</span>

              <p className="metric-explainer">

                {getExposureScoreExplanation(result.exposure_score)}

              </p>

            </div>



            <div className="metric-card-clean">

              <span className="metric-label-clean">Overall risk</span>

              <span className="metric-value-clean">{result.risk_label}</span>

              <span className="metric-sub-clean">

                Combined score: {result.final_score.toFixed(2)}

              </span>

              <p className="metric-explainer">

                {getOverallRiskExplanation(result.risk_label)}

              </p>

            </div>

          </div>



          <div className="main-insight-card">

            <h3>Your assessment</h3>

            <p className="main-insight-lead">{result.result_summary}</p>

            <p className="main-insight-copy">

              This assessment combines visible facial image patterns with your

              reported lifestyle and environmental exposure profile to provide a

              broader picture of photoaging related risk. It is designed as an

              awareness and prevention focused tool rather than a medical diagnosis.

            </p>

          </div>



          <div className="results-lower-grid">

            <div className="results-simple-card">

              <h3>Recommended actions</h3>



              <div className="clean-list-block">

                <p className="list-block-title">What you can do now</p>

                <div className="clean-list-items">

                  {result.immediate_actions.map((item, index) => (

                    <div key={index} className="clean-list-item">

                      {item}

                    </div>

                  ))}

                </div>

              </div>



              <div className="clean-list-block">

                <p className="list-block-title">Supportive routine</p>

                <div className="clean-list-items">

                  {result.routine.map((item, index) => (

                    <div key={index} className="clean-list-item">

                      {formatRoutineItem(item)}

                    </div>

                  ))}

                </div>

              </div>



              <div className="clean-list-block">

                <p className="list-block-title">Why this matters</p>

                <div className="clean-list-items">

                  <div className="clean-list-item">

                    Long term ultraviolet exposure is one of the main drivers of visible photoaging.

                  </div>

                  <div className="clean-list-item">

                    Early protective habits can help reduce cumulative skin stress over time.

                  </div>

                  <div className="clean-list-item">

                    Visible photoaging can also act as an early warning sign of longer term sun related skin damage.

                  </div>

                </div>

              </div>

            </div>



            <div className="results-simple-card">

              <h3>Environmental exposure</h3>



              <div className="env-stat-block-clean">

                <div className="env-stat-row-clean">

                  <span className="env-label-clean">City</span>

                  <span className="env-value-clean">{result.city}</span>

                </div>



                <div className="env-stat-row-clean">

                  <span className="env-label-clean">PM2.5 AQI</span>

                  <span className="env-value-clean">

                    {result.pm25_value ?? "Not available"}

                  </span>

                </div>



                <div className="env-stat-row-clean">

                  <span className="env-label-clean">Matched country</span>

                  <span className="env-value-clean env-country">

                    {toTitleCase(result.matched_country)}

                  </span>

                </div>

              </div>



              <p className="environment-note">

                {getEnvironmentalExposureExplanation(result.pm25_value)}

              </p>

            </div>

          </div>



          <div className="center-wrap results-reset-wrap">

            <button className="primary-btn premium-cta" onClick={resetAll}>

              Start New Analysis

            </button>

          </div>



          <p className="results-disclaimer">

            This tool is intended for educational and research purposes only. It

            does not provide a medical diagnosis or replace professional

            dermatological advice.

          </p>

        </div>

      </div>

    );

  }



  return null;

}



export default App;