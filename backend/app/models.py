from sqlalchemy import Column, Integer, String,ForeignKey,Text,DateTime,Float,Boolean,JSON
from datetime import datetime
from app.database import Base
from sqlalchemy import Table
from sqlalchemy.orm import relationship

form_users = Table(
    "form_users",
    Base.metadata,
    Column("form_id", Integer, ForeignKey("Forms.id")),
    Column("user_id", Integer, ForeignKey("users.id"))
)

class User(Base):
    __tablename__="users"
    id=Column(Integer,index=True,primary_key=True)
    name=Column(String,nullable=False)
    email=Column(String,nullable=False,unique=True)
    password=Column(String,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    forms = relationship("Form", secondary=form_users, back_populates="users")

class Form(Base):
    __tablename__="Forms"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    schema = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", secondary=form_users, back_populates="forms")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("Forms.id"))
    answers = Column(JSON)
    submitted_at = Column(DateTime, default=datetime.utcnow)


