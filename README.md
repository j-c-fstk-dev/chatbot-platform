# Modern Chatbot Interface

A sleek, dark-themed, minimalist chatbot interface built with React and Vite. This application provides a modern chat experience with support for various LLM models.

## Features

- 🌙 **Dark Theme**: Modern, minimalist dark interface
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🔑 **API Key Management**: Secure input for your API credentials
- 🤖 **Multiple Models**: Support for GPT-4, GPT-3.5, Claude, Gemini, and more
- 💬 **Real-time Chat**: Smooth messaging experience with typing indicators
- ⚙️ **Settings Panel**: Easy reconfiguration of API settings
- 🎨 **Modern UI**: Clean interface with smooth animations and transitions

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- An API key from your chosen LLM provider (OpenAI, Anthropic, Google, etc.)

## Installation

1. **Clone or download the project**
   ```bash
   cd chatbot-interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:12000` to access the application.

## Usage

### Initial Setup

1. **Enter API Key**: When you first open the application, you'll be prompted to enter your API key
2. **Select Model**: Choose from the available LLM models:
   - GPT-4
   - GPT-3.5 Turbo
   - Claude 3 Opus
   - Claude 3 Sonnet
   - Gemini Pro
3. **Start Chatting**: Click "Start Chatting" to begin your conversation

### Chat Interface

- **Send Messages**: Type your message and press Enter or click the send button
- **View Responses**: AI responses appear on the left with timestamps
- **Settings**: Click the settings icon to reconfigure your API key or model
- **Responsive**: The interface adapts to different screen sizes

### API Integration

The application currently includes a simulation mode for demonstration. To connect to real LLM APIs:

1. **OpenAI Integration**: Uncomment and modify the API call in `src/App.jsx`:
   ```javascript
   const response = await axios.post('https://api.openai.com/v1/chat/completions', {
     model: model,
     messages: [{ role: 'user', content: message }],
     max_tokens: 150
   }, {
     headers: {
       'Authorization': `Bearer ${apiKey}`,
       'Content-Type': 'application/json'
     }
   })
   ```

2. **Other Providers**: Modify the API endpoint and request format according to your chosen provider's documentation.

## Customization

### Styling
- All styles are in `src/App.css` using CSS custom properties
- Dark theme colors can be modified in the `:root` section
- Responsive breakpoints are included for mobile optimization

### Adding New Models
To add support for new models, update the select options in `src/App.jsx`:
```javascript
<option value="new-model">New Model Name</option>
```

### API Configuration
Modify the `simulateAPICall` function in `src/App.jsx` to integrate with your preferred LLM API.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Security Notes

- API keys are stored only in memory and are not persisted
- Use environment variables for production deployments
- Consider implementing proper authentication for production use

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **Port Already in Use**: If port 12000 is busy, modify `vite.config.js` to use a different port
2. **API Errors**: Check your API key and ensure you have sufficient credits/quota
3. **Styling Issues**: Clear browser cache and ensure all CSS files are loaded

### Development

- Hot reload is enabled for development
- Check browser console for any JavaScript errors
- Ensure all dependencies are properly installed

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.
