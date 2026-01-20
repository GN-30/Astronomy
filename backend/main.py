from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import astrology, astronomy

app = FastAPI(title="Astronomy & Astrology API")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(astrology.router)
app.include_router(astronomy.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Astrology & Astronomy API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
