# streaming-chatbot

The goal of this repository is to work with the OpenAI API/SDK to create a version of ChatGPT.

This is mainly to play around with the API and experience building an AI app end-to-end. I don't expect it to get too feature-rich, and so will start with a very basic MVP and let it evolve naturally.

## Feature Set
### Must Haves
- A chat interface for a GPT model with streaming responses (OpenAI API)
- Maintain a history of the conversation (last 10 messages to start?)
- Track the number of tokens being used and use a progress bar to show how many are left
- Basic error handling for API failures
- Deployed live and usable by anyone

### Nice to Haves
- Be able to log in with Google Account and retain chat history across sessions
- Extend history management to track multiple conversations
- Add text files, images, PDFs etc. to build model's contextual knowledge