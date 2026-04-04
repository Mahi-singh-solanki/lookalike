from sqlalchemy.orm import Session
from app.models import Response, Form
import csv
from fastapi.responses import StreamingResponse
import io
from typing import Any, Dict

def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    if isinstance(value, list):
        return len(value) == 0
    return False

def _to_number(value: Any):
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value.strip() != "":
        try:
            return float(value)
        except ValueError:
            return None
    return None

def _rule_matches(rule: Dict[str, Any], answers: Dict[str, Any]) -> bool:
    field_id = rule.get("fieldId")
    operator = rule.get("operator", "equals")
    expected = str(rule.get("value", ""))
    actual = answers.get(field_id)

    if operator == "equals":
        if isinstance(actual, list):
            return expected in [str(v) for v in actual]
        return str(actual) == expected
    if operator == "not_equals":
        if isinstance(actual, list):
            return expected not in [str(v) for v in actual]
        return str(actual) != expected
    if operator == "contains":
        if isinstance(actual, list):
            return expected in [str(v) for v in actual]
        return expected.lower() in str(actual or "").lower()
    if operator == "not_contains":
        if isinstance(actual, list):
            return expected not in [str(v) for v in actual]
        return expected.lower() not in str(actual or "").lower()
    if operator in {"gt", "gte", "lt", "lte"}:
        a = _to_number(actual)
        b = _to_number(expected)
        if a is None or b is None:
            return False
        if operator == "gt":
            return a > b
        if operator == "gte":
            return a >= b
        if operator == "lt":
            return a < b
        return a <= b
    if operator == "is_empty":
        return _is_empty(actual)
    if operator == "is_not_empty":
        return not _is_empty(actual)
    return True

def _is_field_visible(field: Dict[str, Any], answers: Dict[str, Any]) -> bool:
    visibility = field.get("visibility") or {}
    rules = visibility.get("rules") or []
    if not rules:
        return True
    mode = visibility.get("mode", "all")
    results = [_rule_matches(rule, answers) for rule in rules]
    if mode == "any":
        return any(results)
    return all(results)

def validate_response(schema, answers):
    fields = schema["fields"]

    for field in fields:
        if not _is_field_visible(field, answers):
            continue

        fid = field["id"]
        ftype = field["type"]
        value = answers.get(fid)
        config = field.get("config") or {}

        if field.get("required") and _is_empty(value):
            raise ValueError(f"{fid} is required")
        if _is_empty(value):
            continue

        if ftype == "text" or ftype == "textarea":
            if not isinstance(value, str):
                raise ValueError(f"{fid} must be string")

        elif ftype == "number":
            if not isinstance(value, (int, float)):
                raise ValueError(f"{fid} must be number")
            min_value = config.get("min")
            max_value = config.get("max")
            if isinstance(min_value, (int, float)) and value < min_value:
                raise ValueError(f"{fid} must be >= {min_value}")
            if isinstance(max_value, (int, float)) and value > max_value:
                raise ValueError(f"{fid} must be <= {max_value}")

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
            min_value = config.get("min", 1)
            max_value = config.get("max", 5)
            if value < min_value or value > max_value:
                raise ValueError(f"{fid} must be between {min_value} and {max_value}")

        elif ftype == "slider":
            if not isinstance(value, (int, float)):
                raise ValueError(f"{fid} must be number")
            min_value = config.get("min", 0)
            max_value = config.get("max", 100)
            if value < min_value or value > max_value:
                raise ValueError(f"{fid} must be between {min_value} and {max_value}")

        elif ftype == "file":
            if isinstance(value, list):
                if not all(isinstance(v, str) for v in value):
                    raise ValueError(f"{fid} must be file URL(s)")
            elif not isinstance(value, str):
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
