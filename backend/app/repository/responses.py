from sqlalchemy.orm import Session
from app.models import Response, Form
import csv
from fastapi.responses import StreamingResponse
import io

def validate_response(schema, answers):
    fields = schema["fields"]

    for field in fields:
        fid = field["id"]
        ftype = field["type"]
        value = answers.get(fid)

        if field.get("required") and (value is None or value == ""):
            raise ValueError(f"{fid} is required")
        if value is None:
            continue

        if ftype == "text" or ftype == "textarea":
            if not isinstance(value, str):
                raise ValueError(f"{fid} must be string")

        elif ftype == "number":
            if not isinstance(value, (int, float)):
                raise ValueError(f"{fid} must be number")

        elif ftype in ["select", "radio"]:
            if value not in field.get("options", []):
                raise ValueError(f"{fid} invalid option")

        elif ftype == "multiselect":
            if not isinstance(value, list):
                raise ValueError(f"{fid} must be list")
            for v in value:
                if v not in field.get("options", []):
                    raise ValueError(f"{fid} invalid option in multiselect")

        elif ftype == "checkbox":
            if not isinstance(value, bool):
                raise ValueError(f"{fid} must be boolean")

        elif ftype == "date":
            if not isinstance(value, str):
                raise ValueError(f"{fid} must be date string")

        elif ftype == "email":
            if "@" not in value:
                raise ValueError(f"{fid} invalid email")

        elif ftype == "phone":
            if not str(value).isdigit():
                raise ValueError(f"{fid} invalid phone")

        elif ftype == "rating":
            if not isinstance(value, int):
                raise ValueError(f"{fid} must be integer")

        elif ftype == "slider":
            if not isinstance(value, (int, float)):
                raise ValueError(f"{fid} must be number")

        elif ftype == "file":
            if not isinstance(value, str):
                raise ValueError(f"{fid} must be file URL")
            
def submit_response(form_id, response, db: Session):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        return {"error": "Form not found"}

    try:
        validate_response(form.schema, response.answers)
    except ValueError as e:
        return {"error": str(e)}

    new_response = Response(
        form_id=form_id,
        answers=response.answers
    )

    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    return {"message": "Response submitted"}


def get_responses(form_id, db: Session):
    responses = db.query(Response).filter(Response.form_id == form_id).all()

    return [
        {
            "id": r.id,
            "answers": r.answers,
            "submitted_at": r.submitted_at
        }
        for r in responses
    ]

def export_responses(form_id, db: Session):
    responses = db.query(Response).filter(Response.form_id == form_id).all()

    if not responses:
        return {"error": "No responses found"}

    all_keys = set()
    for r in responses:
        all_keys.update(r.answers.keys())

    all_keys = list(all_keys)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=all_keys)

    writer.writeheader()

    for r in responses:
        writer.writerow(r.answers)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=responses.csv"}
    )
