from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status

from ..models import LoginRequest, RefreshResponse, TokenResponse, User
from ..repositories.stations import authenticate_station
from ..storage import REFRESH_TOKENS
from ..utils import (
    create_access_token,
    create_refresh_token,
    parse_authorization_header,
    require_user_from_token,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = int(timedelta(days=7).total_seconds())


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response) -> TokenResponse:
    station_id = payload.station_id
    user_record = await authenticate_station(station_id, payload.password)

    access_token = create_access_token(station_id)
    refresh_token = create_refresh_token(station_id)

    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE,
    )

    user = User(id=station_id, name=user_record["name"], role=user_record["role"])
    return TokenResponse(accessToken=access_token, user=user)


@router.get("/me", response_model=User)
def me(authorization: str | None = Header(default=None)) -> User:
    token = parse_authorization_header(authorization)
    user_dict = require_user_from_token(token)
    return User(**user_dict)


@router.post("/refresh", response_model=RefreshResponse)
def refresh_access_token(
    response: Response, refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
) -> RefreshResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    station_id = REFRESH_TOKENS.get(refresh_token)
    if not station_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token = create_access_token(station_id)
    return RefreshResponse(accessToken=access_token)
