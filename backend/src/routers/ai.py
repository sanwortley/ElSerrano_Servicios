from fastapi import APIRouter, Depends
from src.deps import get_current_active_user
from src.utils.ai import parse_order_text
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["IA"])

class ParseRequest(BaseModel):
    text: str

@router.post("/parse-order")
async def parse_order(
    request: ParseRequest,
    user=Depends(get_current_active_user)
):
    return parse_order_text(request.text)
