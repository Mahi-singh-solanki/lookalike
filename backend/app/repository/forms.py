from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Form,User
from app.repository import email_verify


def create_form(current_user,form,db:Session):
    user=db.query(User).filter(User.email==current_user).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    schema = {
        "title": form.title,
        "fields": [f.dict() for f in form.fields]
    }
    new_form = Form(
        title=form.title,
        schema=schema
    )
    new_form.users.append(user)
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    return {
        "id": new_form.id,
        "message": "Form created"
    }

def get_form(form_id,db:Session):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return {"error": "Form not found"}

    return form

def update_form(form_id,updated,current_user,db:Session):
    user=db.query(User).filter(User.email==current_user).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    if user not in form.users:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this form")

    new_schema = {
        "title": updated.title,
        "fields": [f.dict() for f in updated.fields]
    }

    form.title = updated.title
    form.schema = new_schema

    db.commit()

    return {"message": "Form updated"}


def add_admins(form_id, data, db: Session):

    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return {"error": "Form not found"}
    
    users = db.query(User).filter(User.id.in_(data.user_ids)).all()

    if not users:
        return {"error": "No valid users found"}

    for user in users:
        if user not in form.users:
            email_verify.send_email(user.email,"Invitation to build forms",f"You have been invited to collab for form at http://localhost:5173/builder/{form.id}")
            form.users.append(user)

    db.commit()

    return {"message": "Admins added"}


def get_admins(form_id, db: Session):

    form = db.query(Form).filter(Form.id == form_id).first()

    return [
        {"id": user.id, "email": user.email}
        for user in form.users
    ]

def change_visibility(form_id,db:Session):
    form = db.query(Form).filter(Form.id == form_id).first()
    if form.is_expired:
        form.is_expired=False
    else:
        form.is_expired=True
    db.commit()
    return {
        "message":"updated succesfully"
    }
