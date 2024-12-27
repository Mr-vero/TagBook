# TagBook - AI Image Analyzer

TagBook is a modern web application that uses AI to automatically generate titles, descriptions, tags, and SEO keywords for your images. Built with vanilla JavaScript and powered by Groq's AI model, it features a sleek iOS-inspired design with local caching capabilities.

![TagBook Screenshot](preview.png)

## Features

- 🖼️ Batch image processing
- 🤖 AI-powered image analysis
- 🏷️ Automatic tag generation
- 📱 Responsive design
- 💾 Local caching
- 📋 One-click copying
- 📚 History view
- 🔄 Offline support
- 🎨 Modern UI/UX

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Groq API key (get it from [Groq Console](https://console.groq.com))

### Installation

1. Clone the repository:
```bash
git clone 
git clone https://github.com/Mr-vero/TagBook.git
cd TagBook
```

2. Create your Groq API key:
   - Sign up at [console.groq.com](https://console.groq.com)
   - Go to API Keys section
   - Create a new API key
   - Copy the key (it starts with "gsk_")

3. Update the API key in `app.js`:
```javascript
const GROQ_API_KEY = 'your_groq_api_key_here';
```

4. Serve the files:
   - For local development, you can use Python's built-in server:
     ```bash
     python -m http.server 8000
     ```
   - Or use any web server of your choice

5. Open in browser:
   - Navigate to `http://localhost:8000`

## Usage

1. Click "Add Images" or drag and drop images
2. Wait for AI analysis
3. View generated content:
   - Title
   - Description
   - Tags
   - SEO Keywords
4. Click copy buttons to copy content
5. View history of processed images
6. Cached results load instantly

## Technical Details

### Architecture

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **AI**: Groq LLM API
- **Storage**: LocalStorage for caching
- **Image Processing**: Canvas API for compression

### Key Components

- `index.html`: Main UI structure
- `app.js`: Application logic
- `styles`: Embedded in HTML (iOS-inspired design)

### Caching System

- Images are hashed using SHA-256
- Results stored in LocalStorage
- Automatic cache retrieval
- Timestamp-based history

## Security

- API key should be kept private
- Consider backend proxy for production
- Implement rate limiting
- Add user authentication if needed

## Customization

### Styling

Modify CSS variables in `:root`:
```css
:root {
    --primary-color: #007AFF;
    --secondary-color: #5856D6;
    --background-color: #F5F7FA;
    /* ... other variables ... */
}
```

### API Settings

Adjust in `app.js`:
```javascript
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Groq for AI capabilities
- Apple's iOS design guidelines
- Font Awesome for icons

## Support

For support, please open an issue in the GitHub repository or contact [Mr.vero@usa.com]

## Roadmap

- [ ] Dark mode support
- [ ] Multiple language support
- [ ] Export functionality
- [ ] Cloud sync
- [ ] Batch operations
- [ ] Custom AI prompts

---

Made with ❤️ by Irvan