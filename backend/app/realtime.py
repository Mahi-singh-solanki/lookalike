import asyncio
from typing import Any

import socketio


CANVAS_WIDTH = 3200
CANVAS_HEIGHT = 2200

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
users_by_socket_id: dict[str, dict[str, Any]] = {}
room_state: dict[str, dict[str, Any]] = {}
users_lock = asyncio.Lock()


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max(value, min_value), max_value)


def _pick_color_from_name(username: str) -> str:
    colors = ["#d9480f", "#2f9e44", "#1971c2", "#5f3dc4", "#c2255c", "#0b7285"]
    hash_value = sum(ord(char) for char in username.strip())
    return colors[hash_value % len(colors)]


def _safe_room_id(raw_form_id: Any) -> str:
    raw = str(raw_form_id or "global").strip()
    return raw if raw else "global"


def _room_users(room_id: str) -> list[dict[str, Any]]:
    return [user for user in users_by_socket_id.values() if user.get("roomId") == room_id]


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> None:
    return None


@sio.event
async def join(sid: str, payload: Any) -> None:
    if isinstance(payload, str):
        payload = {"username": payload, "formId": "global", "userId": sid}

    username = str(payload.get("username") or "").strip()[:24]
    user_id = str(payload.get("userId") or sid)
    room_id = _safe_room_id(payload.get("formId"))

    if not username:
        await sio.emit("join_error", "Username is required.", to=sid)
        return

    await sio.enter_room(sid, room_id)

    user = {
        "socketId": sid,
        "userId": user_id,
        "username": username,
        "x": CANVAS_WIDTH / 2,
        "y": CANVAS_HEIGHT / 2,
        "roomId": room_id,
        "color": payload.get("color") or _pick_color_from_name(username),
        "editingFieldId": None,
    }

    async with users_lock:
        users_by_socket_id[sid] = user
        users = _room_users(room_id)

        state = room_state.get(room_id)
        if state is None:
            state = {
                "schema": None,
                "version": 0,
                "updatedAt": 0,
                "editing": {},
            }
            room_state[room_id] = state

    await sio.emit(
        "joined",
        {
            "you": user,
            "users": users,
            "canvas": {"width": CANVAS_WIDTH, "height": CANVAS_HEIGHT},
            "state": state,
        },
        to=sid,
    )
    await sio.emit("presence_update", users, room=room_id)


@sio.event
async def cursor_move(sid: str, payload: dict[str, Any]) -> None:
    async with users_lock:
        user = users_by_socket_id.get(sid)
        if not user:
            return

        x = _clamp(float(payload.get("x", 0)), 0, CANVAS_WIDTH)
        y = _clamp(float(payload.get("y", 0)), 0, CANVAS_HEIGHT)

        user["x"] = x
        user["y"] = y

        emit_payload = {
            "socketId": user["socketId"],
            "userId": user.get("userId"),
            "username": user["username"],
            "x": x,
            "y": y,
            "color": user["color"],
            "editingFieldId": user.get("editingFieldId"),
        }

        room_id = user.get("roomId", "global")

    await sio.emit("cursor_moved", emit_payload, room=room_id)


@sio.event
async def schema_update(sid: str, payload: dict[str, Any]) -> None:
    room_id = _safe_room_id(payload.get("formId"))
    version = int(payload.get("version", 0))
    at = int(payload.get("at", 0))

    async with users_lock:
        state = room_state.setdefault(room_id, {"schema": None, "version": 0, "updatedAt": 0, "editing": {}})
        current_version = int(state.get("version", 0))
        current_at = int(state.get("updatedAt", 0))

        should_apply = version > current_version or (version == current_version and at >= current_at)
        if not should_apply:
            return

        state["schema"] = payload.get("schema")
        state["version"] = version
        state["updatedAt"] = at

    await sio.emit(
        "schema_updated",
        {
            "type": "SCHEMA_UPDATE",
            "formId": int(payload.get("formId", 0)),
            "schema": payload.get("schema"),
            "version": version,
            "userId": payload.get("userId"),
            "at": at,
        },
        room=room_id,
    )


@sio.event
async def field_editing(sid: str, payload: dict[str, Any]) -> None:
    room_id = _safe_room_id(payload.get("formId"))
    field_id = payload.get("fieldId")
    username = payload.get("username")

    async with users_lock:
        user = users_by_socket_id.get(sid)
        if user:
            user["editingFieldId"] = field_id

        state = room_state.setdefault(room_id, {"schema": None, "version": 0, "updatedAt": 0, "editing": {}})
        editing = state.setdefault("editing", {})
        if field_id and username:
            editing[field_id] = username
        elif field_id in editing:
            del editing[field_id]

    await sio.emit("editing_updated", {"fieldId": field_id, "username": username}, room=room_id)


@sio.event
async def undo_redo(sid: str, payload: dict[str, Any]) -> None:
    room_id = _safe_room_id(payload.get("formId"))
    version = int(payload.get("version", 0))
    at = int(payload.get("at", 0))

    async with users_lock:
        state = room_state.setdefault(room_id, {"schema": None, "version": 0, "updatedAt": 0, "editing": {}})
        state["schema"] = payload.get("schema")
        state["version"] = version
        state["updatedAt"] = at

    await sio.emit(
        "undo_redo_synced",
        {
            "formId": int(payload.get("formId", 0)),
            "schema": payload.get("schema"),
            "version": version,
            "userId": payload.get("userId"),
            "at": at,
        },
        room=room_id,
    )


@sio.event
async def disconnect(sid: str) -> None:
    async with users_lock:
        user = users_by_socket_id.pop(sid, None)
        clear_events: list[dict[str, Any]] = []
        if user:
            room_id = user.get("roomId", "global")
            state = room_state.setdefault(room_id, {"schema": None, "version": 0, "updatedAt": 0, "editing": {}})
            editing = state.setdefault("editing", {})
            for key, value in list(editing.items()):
                if value == user.get("username"):
                    del editing[key]
                    clear_events.append({"fieldId": key, "username": None})

    if user:
        room_id = user.get("roomId", "global")
        for event in clear_events:
            await sio.emit("editing_updated", event, room=room_id)
        await sio.emit("user_left", {"socketId": sid}, room=room_id)
        await sio.emit("presence_update", _room_users(room_id), room=room_id)
