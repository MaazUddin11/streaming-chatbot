# Streaming Chatbot - Backend

FastAPI backend for streaming chat responses using OpenAI API.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-your-actual-key-here
MODEL_NAME=gpt-5-nano
MAX_HISTORY_MESSAGES=10
TOKEN_LIMIT=4000
```

## Running Locally

```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `POST /chat` - Stream chat responses (SSE)
- `GET /history/{conversation_id}` - Get conversation history
- `DELETE /history/{conversation_id}` - Clear conversation history

## Testing

You can test the streaming endpoint with curl:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "conversation_id": "test"}'
```

Or visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure

- `main.py` - FastAPI app and endpoints
- `chat_service.py` - OpenAI API integration
- `history_manager.py` - Conversation history management
- `token_counter.py` - Token counting logic
- `requirements.txt` - Python dependencies
