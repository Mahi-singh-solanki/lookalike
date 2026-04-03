from pydantic import BaseModel,EmailStr
from typing import List,Optional, Dict, Any

class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str

class AddAdmins(BaseModel):
    user_ids: List[int]

class Chat(BaseModel):
    question:str

class Field(BaseModel):
    id: str
    type: str
    label: str
    required: Optional[bool] = False
    options: Optional[List[str]] = None
    conditions: Optional[List[Dict[str, Any]]] = None

class FormCreate(BaseModel):
    title: str
    fields: List[Field]

class ResponseCreate(BaseModel):
    answers: Dict[str, Any]

class UserLogin(BaseModel):
    email:EmailStr
    password:str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None