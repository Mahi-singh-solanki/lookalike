from fastapi import FastAPI
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth,forms_responses

models.Base.metadata.create_all(engine)

app=FastAPI(title="Lookalike")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(forms_responses.router)

@app.get("/")
def LookAlike():
    return {"message":"Welcome to Lookalikes backend"}
