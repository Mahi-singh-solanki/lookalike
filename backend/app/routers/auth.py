from fastapi import APIRouter,status,Depends,HTTPException
from sqlalchemy.orm import Session
from app.schemas import UserCreate,UserLogin,Chat
from app.database import get_db
from app.repository import auth,chatbot
from app.models import User
from app.oauth2 import get_current_user

router = APIRouter(
    prefix='/user',tags=['Users'])

@router.post("/register",status_code=status.HTTP_200_OK)
def register(user:UserCreate,db:Session=Depends(get_db)):
    return auth.register(user,db)

@router.post("/login",status_code=status.HTTP_200_OK)
def register(user:UserLogin,db:Session=Depends(get_db)):
    return auth.login(user,db)


@router.get("/me")
def get_current_user_profile(db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    user=db.query(User).filter(User.email==current_user).first()
    if not user.is_verified:
        raise HTTPException(status_code=404,detail="Invalid credentials")
    return user

@router.get("/forms")
def get_user_forms( db: Session = Depends(get_db),user_id: User = Depends(get_current_user)):
    return auth.get_user_forms(user_id,db)

@router.post("/chat",status_code=status.HTTP_200_OK)
def chat_bot(request:Chat,current_user=Depends(get_current_user)):
    return chatbot.chat_bot(request)