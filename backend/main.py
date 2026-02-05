from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os
import json
from dotenv import load_dotenv

from chat_service import ChatService
from history_manager import HistoryManager
from token_counter import TokenCounter

# Load environment variables
load_dotenv()

app = FastAPI(title="Streaming Chatbot API")

# CORS middleware to allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
history_manager = HistoryManager(max_messages=int(os.getenv("MAX_HISTORY_MESSAGES", 10)))
token_counter = TokenCounter(
    model_name=os.getenv("MODEL_NAME", "gpt-5-nano"),
    token_limit=int(os.getenv("TOKEN_LIMIT", 4000))
)
chat_service = ChatService(
    api_key=os.getenv("OPENAI_API_KEY"),
    model_name=os.getenv("MODEL_NAME", "gpt-5-nano")
)


class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"


class ChatHistoryResponse(BaseModel):
    messages: List[dict]
    token_usage: dict


@app.get("/")
async def root():
    return {"status": "ok", "message": "Streaming Chatbot API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Stream chat responses from OpenAI API.
    Returns Server-Sent Events (SSE) stream.
    """
    # Get conversation history
    history = history_manager.get_history(request.conversation_id)

    # Add user message to history
    user_message = {"role": "user", "content": request.message}
    history_manager.add_message(request.conversation_id, user_message)

    # Count tokens for the request
    messages_for_api = history + [user_message]
    token_count = token_counter.count_messages_tokens(messages_for_api)

    # Stream the response
    async def generate():
        # First, send token usage info
        yield f"data: {json.dumps({'type': 'token_count', 'count': token_count, 'limit': token_counter.token_limit})}\n\n"

        full_response = ""

        # Stream from OpenAI
        async for chunk in chat_service.stream_chat(messages_for_api):
            if chunk:
                full_response += chunk
                # Send each chunk as SSE
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

        # Add assistant response to history
        assistant_message = {"role": "assistant", "content": full_response}
        history_manager.add_message(request.conversation_id, assistant_message)

        # Send completion signal with final token count
        final_token_count = token_counter.count_messages_tokens(
            history_manager.get_history(request.conversation_id)
        )
        yield f"data: {json.dumps({'type': 'done', 'token_count': final_token_count})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    """Get conversation history and token usage."""
    history = history_manager.get_history(conversation_id)
    token_count = token_counter.count_messages_tokens(history)

    return ChatHistoryResponse(
        messages=history,
        token_usage={
            "current": token_count,
            "limit": token_counter.token_limit,
            "percentage": (token_count / token_counter.token_limit) * 100
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
