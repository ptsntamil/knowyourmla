from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.districts import router as districts_router
from app.api.constituencies import router as constituencies_router
from app.api.mlas import router as mlas_router
from app.api. feedback import router as feedback_router
from app.api.elections import router as elections_router

from mangum import Mangum

app = FastAPI(
    title="KnowYourMLA API",
    description="Public APIs for Tamil Nadu political data.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development, can be restricted later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(districts_router)
app.include_router(constituencies_router)
app.include_router(mlas_router)
app.include_router(feedback_router)
app.include_router(elections_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

handler = Mangum(app)
