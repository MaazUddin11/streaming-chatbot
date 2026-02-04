import tiktoken
from typing import List, Dict


class TokenCounter:
    """Counts tokens for OpenAI API requests."""

    def __init__(self, model_name: str = "gpt-5-nano", token_limit: int = 4000):
        self.model_name = model_name
        self.token_limit = token_limit

        # Get the appropriate encoding for the model
        try:
            self.encoding = tiktoken.encoding_for_model(model_name)
        except KeyError:
            # Fallback to o200k_base encoding (used by GPT-4o and GPT-5)
            self.encoding = tiktoken.get_encoding("o200k_base")

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a text string.

        Args:
            text: The text to count tokens for

        Returns:
            Number of tokens
        """
        return len(self.encoding.encode(text))

    def count_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count tokens for a list of messages.
        Includes overhead for message formatting.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            Total number of tokens
        """
        tokens_per_message = 3  # Every message follows <|start|>{role/name}\n{content}<|end|>\n
        tokens_per_name = 1  # If there's a name, the role is omitted

        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += self.count_tokens(value)
                if key == "name":
                    num_tokens += tokens_per_name

        num_tokens += 3  # Every reply is primed with <|start|>assistant<|message|>

        return num_tokens
