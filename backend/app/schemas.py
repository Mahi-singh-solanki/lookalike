from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import List, Optional, Dict, Any, Literal

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class AddAdmins(BaseModel):
    user_ids: List[int]

class Chat(BaseModel):
    question: str


FieldType = Literal[
    "text",
    "textarea",
    "number",
    "select",
    "radio",
    "multiselect",
    "checkbox",
    "date",
    "email",
    "phone",
    "rating",
    "slider",
    "file",
]

class Field(BaseModel):
    id: str
    type: FieldType
    label: str
    required: Optional[bool] = False
    options: Optional[List[str]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    visibility: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    style: Optional[Dict[str, Any]] = None

    @field_validator("id", "label")
    @classmethod
    def non_empty_string(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned

    @model_validator(mode="after")
    def validate_options_for_choice_fields(self):
        choice_types = {"select", "radio", "multiselect"}
        if self.type in choice_types:
            if not self.options or not any(option.strip() for option in self.options):
                raise ValueError(f"options are required for {self.type} fields")
        return self

class FormCreate(BaseModel):
    title: str
    fields: List[Field]

    @field_validator("title")
    @classmethod
    def non_empty_title(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title must not be empty")
        return cleaned

    @model_validator(mode="after")
    def unique_field_ids(self):
        ids = [field.id for field in self.fields]
        if len(ids) != len(set(ids)):
            raise ValueError("field ids must be unique")
        return self

class ResponseCreate(BaseModel):
    answers: Dict[str, Any]

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None
