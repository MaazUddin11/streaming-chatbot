from typing import List, Dict
from collections import defaultdict


class HistoryManager:
    """Manages conversation history in memory."""

    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        # Store conversations by ID
        self.conversations: Dict[str, List[Dict[str, str]]] = defaultdict(list)

    def add_message(self, conversation_id: str, message: Dict[str, str]):
        """
        Add a message to the conversation history.

        Args:
            conversation_id: Unique identifier for the conversation
            message: Dict with 'role' and 'content'
        """
        self.conversations[conversation_id].append(message)

        # Keep only the last N messages
        if len(self.conversations[conversation_id]) > self.max_messages:
            self.conversations[conversation_id] = \
                self.conversations[conversation_id][-self.max_messages:]

    def get_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """
        Get conversation history.

        Args:
            conversation_id: Unique identifier for the conversation

        Returns:
            List of message dicts
        """
        return self.conversations[conversation_id]
