// Keep your API key and URL
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function processImages() {
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    
    // Clear previous results
    previewContainer.innerHTML = '';
    
    const files = Array.from(imageInput.files);
    
    if (files.length === 0) {
        console.error('No files selected');
        return;
    }

    console.log(`Processing ${files.length} images...`); // Debug log

    for (const file of files) {
        const card = document.createElement('div');
        card.className = 'image-card';

        const img = document.createElement('img');
        img.className = 'preview-image';
        const imageUrl = URL.createObjectURL(file);
        img.src = imageUrl;

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing image...';

        cardContent.appendChild(loading);
        card.appendChild(img);
        card.appendChild(cardContent);
        previewContainer.appendChild(card);

        try {
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const compressedBase64 = await compressImage(img, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.8
            });

            const analysisContent = await analyzeImageWithGroq(compressedBase64);
            const results = JSON.parse(analysisContent);

            cardContent.innerHTML = `
                <h3 class="card-title">${results.title}</h3>
                <p class="description">${results.description}</p>
                
                <div class="tags-section">
                    <div class="section-title">
                        Tags
                        <button class="copy-btn" onclick="copyToClipboard(this, 'tags')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <div class="tags-container">
                        ${results.tags.map(tag => 
                            `<span class="tag" onclick="copyToClipboard(this)">${typeof tag === 'string' ? tag : tag.name}</span>`
                        ).join(' ')}
                    </div>
                </div>

                <div class="seo-section">
                    <div class="section-title">
                        SEO Keywords
                        <button class="copy-btn" onclick="copyToClipboard(this, 'seo')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <div class="seo-container">
                        ${results.seo_keywords.map(keyword => 
                            `<span class="seo-keyword" onclick="copyToClipboard(this)">${keyword}</span>`
                        ).join(' ')}
                    </div>
                </div>
            `;
        } catch (error) {
            cardContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-circle"></i>
                    Error analyzing image: ${error.message}
                    <p>Please try another image or refresh the page.</p>
                </div>
            `;
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
    }
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function analyzeImageWithGroq(base64Image) {
    const prompt = `You must respond ONLY with a JSON object in this exact format, with no additional text before or after:
{
    "title": "string",
    "description": "string",
    "tags": [{"name": "string"}],
    "seo_keywords": ["string"]
}

Analyze the image and include:
- A concise, descriptive title
- A detailed description of the content, style, and mood
- 10-15 relevant tags about style, content, mood, and colors
- 10-15 SEO-optimized keywords for search engines

DO NOT include any markdown, explanatory text, or other formatting. ONLY the JSON object.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                model: "llama-3.2-11b-vision-preview",
                temperature: 0.3,
                max_tokens: 1024,
                top_p: 1,
                stream: false,
                stop: null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to analyze image');
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        // Log the raw content for debugging
        console.log('Raw response:', content);

        // Try to repair and parse the JSON
        const repairedJson = repairJSON(content);
        return repairedJson;
    } catch (error) {
        console.error('Groq API error:', error);
        throw new Error(`Failed to analyze image: ${error.message}`);
    }
}

function repairJSON(content) {
    // Remove any text before the first {
    let jsonStr = content.substring(content.indexOf('{'));
    
    // Count braces to ensure proper closing
    let openBraces = 0;
    let needsClosing = false;
    
    for (let char of jsonStr) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
    }
    
    // Add missing closing braces if needed
    if (openBraces > 0) {
        jsonStr += '}'.repeat(openBraces);
        needsClosing = true;
    }

    // Clean up common issues
    jsonStr = jsonStr
        .replace(/\n/g, ' ')           // Remove newlines
        .replace(/\r/g, '')            // Remove carriage returns
        .replace(/\t/g, ' ')           // Remove tabs
        .replace(/\s+/g, ' ')          // Normalize spaces
        .replace(/,\s*}/g, '}')        // Remove trailing commas
        .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
        .replace(/([{,])\s*}/g, '$1')  // Remove empty objects
        .replace(/\[\s*]/g, '[]')      // Remove empty arrays
        .trim();

    try {
        // Try to parse the cleaned JSON
        const parsed = JSON.parse(jsonStr);
        
        // Convert tags to proper format if they're strings
        const formattedTags = Array.isArray(parsed.tags) 
            ? parsed.tags.map(tag => {
                if (typeof tag === 'string') {
                    return { name: tag };
                }
                return tag;
            })
            : [];

        // Ensure all required fields are present
        const template = {
            title: parsed.title || '',
            description: parsed.description || '',
            tags: formattedTags,
            seo_keywords: Array.isArray(parsed.seo_keywords) ? parsed.seo_keywords : []
        };

        // If we had to repair the JSON, log it
        if (needsClosing) {
            console.log('Repaired JSON:', JSON.stringify(template));
        }

        return JSON.stringify(template);
    } catch (e) {
        console.error('JSON repair failed:', e);
        throw new Error('Could not parse response as JSON');
    }
}

function processGroqResults(analysis) {
    try {
        // Parse the response content if it's a string
        let parsedContent = typeof analysis.content === 'string' 
            ? JSON.parse(analysis.content) 
            : analysis.content;

        // Add style-based confidence scores
        const enhancedTags = parsedContent.tags.map(tag => {
            // Add confidence if not present
            if (!tag.confidence) {
                tag.confidence = calculateTagConfidence(tag.name, parsedContent.description);
            }
            return tag;
        });

        return {
            title: parsedContent.title,
            description: parsedContent.description,
            tags: enhancedTags
        };
    } catch (error) {
        console.error('Error processing Groq results:', error);
        return {
            title: 'Analysis Results',
            description: analysis.content || 'Unable to generate description',
            tags: []
        };
    }
}

function calculateTagConfidence(tag, description) {
    // Calculate confidence based on context and description
    const relevanceScore = description.toLowerCase().includes(tag.toLowerCase()) ? 0.9 : 0.7;
    
    // Adjust confidence based on tag type
    const confidenceAdjustments = {
        'anime': 0.95,
        'illustration': 0.9,
        'character': 0.85,
        'digital art': 0.9,
        'drawing': 0.85,
        // Add more tag-specific confidence adjustments
    };

    return confidenceAdjustments[tag.toLowerCase()] || relevanceScore;
}

// Helper function to enhance anime/illustration detection
function enhanceAnimeDetection(description, tags) {
    const animeKeywords = [
        'anime', 'manga', 'illustration', 'character', 'digital art',
        'cartoon', 'drawn', 'animated', 'japanese style'
    ];

    const hasAnimeKeywords = animeKeywords.some(keyword => 
        description.toLowerCase().includes(keyword)
    );

    if (hasAnimeKeywords) {
        tags.push(
            { name: 'anime style', confidence: 0.9 },
            { name: 'illustration', confidence: 0.85 },
            { name: 'digital art', confidence: 0.8 }
        );
    }

    return tags;
}

async function compressImage(imgElement, options = {}) {
    const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.8,
        format = 'jpeg'
    } = options;

    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions while maintaining aspect ratio
        let width = imgElement.naturalWidth;
        let height = imgElement.naturalHeight;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgElement, 0, 0, width, height);

        // Convert to base64 with compression
        const base64String = canvas.toDataURL(`image/${format}`, quality);
        
        // Remove the data URL prefix
        const base64Data = base64String.split(',')[1];

        // Log compressed size
        const estimatedSize = (base64Data.length * 3) / 4;
        console.log(`Compressed image size: ${Math.round(estimatedSize / 1024)}KB`);

        resolve(base64Data);
    });
}

// Helper function for progressive compression if needed
async function progressiveCompress(base64Data, maxSizeKB = 1000) {
    let quality = 0.8;
    let compressed = base64Data;
    let iterations = 0;
    const maxIterations = 5;

    while (((compressed.length * 3) / 4) > maxSizeKB * 1024 && iterations < maxIterations) {
        quality *= 0.8;
        const img = new Image();
        
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = 'data:image/jpeg;base64,' + compressed;
        });

        compressed = await compressImage(img, {
            maxWidth: 800 * Math.pow(0.9, iterations),
            maxHeight: 800 * Math.pow(0.9, iterations),
            quality: quality
        });

        iterations++;
    }

    return compressed;
}

// Add copy functionality
function copyToClipboard(element, type) {
    let textToCopy;
    
    if (type === 'tags') {
        textToCopy = Array.from(element.parentElement.nextElementSibling.getElementsByClassName('tag'))
            .map(tag => tag.textContent)
            .join(', ');
    } else if (type === 'seo') {
        textToCopy = Array.from(element.parentElement.nextElementSibling.getElementsByClassName('seo-keyword'))
            .map(keyword => keyword.textContent)
            .join(', ');
    } else {
        textToCopy = element.textContent;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = element.innerHTML;
        element.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            element.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Update the file input to show selected files
document.getElementById('imageInput').addEventListener('change', function(e) {
    try {
        const label = document.querySelector('.upload-btn');
        const fileCount = e.target.files.length;
        
        if (fileCount > 0) {
            console.log(`Selected ${fileCount} files`); // Debug log
            label.innerHTML = `<i class="fas fa-check"></i> ${fileCount} ${fileCount === 1 ? 'image' : 'images'} selected`;
            processImages();
        } else {
            console.log('No files selected'); // Debug log
            label.innerHTML = `<i class="fas fa-upload"></i> Choose Images`;
        }
    } catch (error) {
        console.error('Error in file input handler:', error);
    }
});

// Add this to check if the script loaded properly
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script loaded successfully');
    
    // Check if elements exist
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    
    if (!imageInput) console.error('Image input element not found');
    if (!previewContainer) console.error('Preview container not found');
}); 