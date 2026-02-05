from openai import AsyncOpenAI
from typing import List, Dict, AsyncGenerator, Optional


class ChatService:
    """Handles OpenAI API interactions for chat completion."""

    def __init__(self, api_key: Optional[str], model_name: str = "gpt-5-nano"):
        self.api_key = api_key
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None
        self.model_name = model_name

    async def stream_chat(
        self,
        messages: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from OpenAI API.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Yields:
            String chunks of the response
        """
        if not self.client:
            yield "Error: OpenAI API key not configured"
            return

        try:
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                stream=True,
            )

            async for chunk in stream:
                # Extract content from the chunk
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f"Error: {str(e)}"
