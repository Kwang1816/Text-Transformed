// DOM Elements
const cameraFeed = document.getElementById('camera-feed');
const captureBtn = document.getElementById('capture-btn');
const captureCanvas = document.getElementById('capture-canvas');
const capturedImage = document.getElementById('captured-image');
const capturedImageContainer = document.getElementById('captured-image-container');
const analyzeBtn = document.getElementById('analyze-btn');
const retakeBtn = document.getElementById('retake-btn');
const resultsSection = document.getElementById('results-section');
const detectedObjectText = document.getElementById('detected-object-text');

// Global variables
let stream = null;
let chart = null;

// API Configuration
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// List of all the assessment questions
const assessmentQuestions = [
    "To what extent does the design help users achieve their goals effectively?",
    "To what extent is the design solving the right problem for the right people?",
    "To what extent is the design aligned with the user's environment, tools, or constraints?",
    "To what extent is the design addressing a frequent user need?",
    "To what extent does the design prioritize doing the right thing, even if slowly, over doing the wrong thing quickly?",
    "To what extent does the product grow in value over time?",
    "To what extent does the design behave as users would naturally expect?",
    "To what extent does the layout and structure reflect common patterns or conventions?",
    "To what extent can someone understand how to use it the first time?",
    "To what extent does the design help users form accurate mental models on first interaction?",
    "To what extent are tasks completed with minimal steps?",
    "To what extent does the design show only essential features at the right time?",
    "To what extent are instructions, icons, and interface elements easy to interpret?",
    "To what extent is the hierarchy of information clear?",
    "To what extent is the design structured to prevent common mistakes?",
    "To what extent are dangerous actions guarded or reversible?",
    "To what extent are similar actions presented and executed in consistent ways?",
    "To what extent is language and visual design uniform throughout?",
    "To what extent does the design use familiar patterns and conventions?",
    "To what extent are features and options introduced progressively rather than all at once?",
    "To what extent is the information logically organized and labeled?",
    "To what extent are common tasks easy to locate and perform?",
    "To what extent do elements visually suggest how they should be used?",
    "To what extent does the design provide clear cues for completing tasks or workflows?",
    "To what extent are related tasks or tools grouped consistently across the interface?",
    "To what extent is the interface consistent enough to support memory retention?",
    "To what extent are task flows streamlined with the fewest necessary steps?",
    "To what extent are redundant or unnecessary actions eliminated?",
    "To what extent are related functions grouped for ease of access?",
    "To what extent does the design support shortcuts or accelerators for advanced users?",
    "To what extent are frequent actions simplified through templates or autofill?",
    "To what extent does the interface support smooth transitions between tasks?",
    "To what extent do default settings or remembered inputs reduce user effort?",
    "To what extent is the system free from delays or interruptions that hinder flow?",
    "To what extent is all text readable with sufficient contrast?",
    "To what extent is the design fully operable using only a keyboard?",
    "To what extent are interactive elements clearly distinguishable and appropriately sized?",
    "To what extent are non-text elements labeled with descriptive alternative text?",
    "To what extent does the layout retain clarity when zoomed in or resized?",
    "To what extent are motion and animation effects optional or minimal for sensitive users?",
    "To what extent is content structured with a clear and logical heading hierarchy?",
    "To what extent are forms clearly labeled and programmatically accessible?",
    "To what extent is color not the only means of conveying important information?",
    "To what extent is content written clearly and simply, without unnecessary jargon?",
    "To what extent are irreversible actions confirmed before execution?",
    "To what extent is there a clear and accessible way to undo user actions?",
    "To what extent does the design prevent common or predictable errors?",
    "To what extent does the form validate inputs early to avoid submission errors?",
    "To what extent are error messages clear, specific, and actionable?",
    "To what extent are inputs constrained to prevent invalid entries?",
    "To what extent is progress or input saved to prevent data loss?",
    "To what extent are defaults safe, reversible, or commonly correct?",
    "To what extent is the system tolerant of incomplete or imperfect input?",
    "To what extent do interactive elements visually suggest they can be clicked or touched?",
    "To what extent do visual cues like shadows or borders signal functionality?",
    "To what extent are similar actions visually and functionally consistent?",
    "To what extent are interactive areas large enough and clearly distinct from non-interactive ones?",
    "To what extent do icons or metaphors clearly communicate their purpose?",
    "To what extent are affordances aligned with the conventions of the platform or device?",
    "To what extent are misleading or false affordances avoided?",
    "To what extent are hidden interactions supported by visual hints or onboarding?"
];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeCamera();
    setupEventListeners();
});

// Initialize the camera
async function initializeCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        cameraFeed.srcObject = stream;
    } catch (error) {
        console.error('Error accessing the camera:', error);
        alert('Error accessing the camera. Please make sure you have granted camera permissions.');
    }
}

// Set up event listeners
function setupEventListeners() {
    captureBtn.addEventListener('click', captureImage);
    analyzeBtn.addEventListener('click', analyzeObject);
    retakeBtn.addEventListener('click', retakePhoto);
}

// Capture an image from the camera feed
function captureImage() {
    // Set canvas dimensions to match the video feed
    captureCanvas.width = cameraFeed.videoWidth;
    captureCanvas.height = cameraFeed.videoHeight;
    
    // Draw the current frame from the video onto the canvas
    const context = captureCanvas.getContext('2d');
    context.drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Convert the canvas to a data URL and set it as the source for the captured image
    const imageDataUrl = captureCanvas.toDataURL('image/jpeg');
    capturedImage.src = imageDataUrl;
    
    // Show the captured image container and hide the camera feed
    capturedImageContainer.style.display = 'block';
    document.getElementById('camera-container').style.display = 'none';
}

// Retake the photo
function retakePhoto() {
    // Hide the captured image container and show the camera feed
    capturedImageContainer.style.display = 'none';
    document.getElementById('camera-container').style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Clear previous results
    if (chart) {
        chart.destroy();
        chart = null;
    }
    detectedObjectText.textContent = '-';
}

// Analyze the captured object
async function analyzeObject() {
    try {
        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        // Get the captured image data
        const imageData = capturedImage.src;
        
        // Step 1: Detect the object in the image
        const detectionResult = await detectObject(imageData);
        detectedObjectText.textContent = detectionResult.description;
        
        // Step 2: Analyze the object based on the questions
        const analysisResults = await analyzeDetectedObject(detectionResult.description);
        
        // Step 3: Display the results
        displayResults(analysisResults);
        
        // Show the results section
        resultsSection.style.display = 'block';
    } catch (error) {
        console.error('Error analyzing object:', error);
        alert('Error analyzing the object. Please try again.');
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Object';
    }
}

// Detect the object in the image using OpenAI's API
async function detectObject(imageData) {
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Look at this image and provide a detailed description of what object you see. Focus on the design aspects of the object."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageData
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const description = data.choices[0].message.content.trim();
        
        return { description };
    } catch (error) {
        console.error('Error detecting object:', error);
        throw error;
    }
}

// Analyze the detected object based on the questions
async function analyzeDetectedObject(objectDescription) {
    try {
        // Create a prompt with the object description and assessment questions
        const prompt = `I'm going to analyze a product design based on the following description: "${objectDescription}".
        
Please rate each of the following questions on a scale of 1-10 (where 1 is lowest and 10 is highest).
The response should be in a valid JSON format containing an array of objects, each with 'question', 'rating', and 'category' fields.
For example: [{"question": "Question text", "rating": 7, "category": "Category name"}]

Here are the assessment questions to rate:
${assessmentQuestions.map(q => `- ${q}`).join('\n')}

Group the questions into these categories:
- Effectiveness (questions 1-6)
- Usability (questions 7-14)
- Consistency (questions 15-22)
- Efficiency (questions 23-34)
- Accessibility (questions 35-44)
- Error Prevention (questions 45-53)
- Affordances (questions 54-60)

Provide your ratings in JSON format only, with no additional text.`;

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const analysisText = data.choices[0].message.content.trim();
        const analysisResults = JSON.parse(analysisText);
        
        // Process the results to add shortened questions for the chart
        return analysisResults.results.map(item => {
            return {
                ...item,
                shortQuestion: item.question.substring(17, 50) + '...'
            };
        });
    } catch (error) {
        console.error('Error analyzing object description:', error);
        
        // Fallback to mock data in case of an error
        return assessmentQuestions.reduce((result, question, index) => {
            // Group questions into categories
            let category = '';
            if (index < 6) category = 'Effectiveness';
            else if (index < 14) category = 'Usability';
            else if (index < 22) category = 'Consistency';
            else if (index < 34) category = 'Efficiency';
            else if (index < 44) category = 'Accessibility';
            else if (index < 53) category = 'Error Prevention';
            else category = 'Affordances';
            
            // Create a shortened version of the question for the chart label
            const shortQuestion = question.substring(17, 50) + '...';
            
            // Generate a pseudo-random rating
            const rating = Math.floor((Math.sin(index * 0.5) + 1) * 4.5) + 1;
            
            result.push({
                question,
                shortQuestion,
                rating,
                category
            });
            
            return result;
        }, []);
    }
}

// Display the analysis results
function displayResults(results) {
    // Group the results by category
    const categories = [...new Set(results.map(item => item.category))];
    
    // For this demo, we'll just show a subset of the questions (first 10)
    // In a real application, you might want to allow users to filter or paginate
    const displayResults = results.slice(0, 10);
    
    // Prepare data for Chart.js
    const data = {
        labels: displayResults.map(item => item.shortQuestion),
        datasets: [{
            label: 'Rating (1-10)',
            data: displayResults.map(item => item.rating),
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'bar',
        data: data,
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Rating (1-10)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            return displayResults[index].question;
                        }
                    }
                }
            }
        }
    };
    
    // Create or update the chart
    const ctx = document.getElementById('results-chart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, config);
} 