from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas import FormCreate,ResponseCreate,AddAdmins
from app.database import get_db
from app.models import User
from app.repository import forms,responses
from app.oauth2 import get_current_user

router = APIRouter(prefix='/forms',tags=['Forms'])

@router.post("/")
def create_form(form: FormCreate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    return forms.create_form(current_user,form,db)

@router.get("/{form_id}")
def get_form(form_id: int, db: Session = Depends(get_db)):
    return forms.get_form(form_id,db)

@router.put("/{form_id}")
def update_form(form_id: int, updated: FormCreate, db: Session = Depends(get_db)):
    return forms.update_form(form_id,updated,db)

@router.post("/responses/{form_id}")
def submit_response(form_id: int, response: ResponseCreate, db: Session = Depends(get_db)):
    return responses.submit_response(form_id,response,db)

@router.get("/responses/{form_id}")
def get_responses(form_id: int, db: Session = Depends(get_db)):
    return responses.get_responses(form_id,db)

@router.get("/responses/{form_id}/export")
def export_responses(form_id: int, db: Session = Depends(get_db)):
    return responses.export_responses(form_id,db)

@router.post("/forms/{form_id}/admins")
def add_admins(form_id: int, data: AddAdmins, db: Session = Depends(get_db)):
    return forms.add_admins(form_id,data,db)

@router.get("/forms/{form_id}/admins")
def get_admins(form_id: int, db: Session = Depends(get_db)):
    return forms.get_admins(form_id,db)