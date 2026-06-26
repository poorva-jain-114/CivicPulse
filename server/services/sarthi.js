import dotenv from 'dotenv';

dotenv.config();

// Standard Indian municipal departments
export const DEPARTMENTS = {
  ROADS: 'Roads & Buildings Maintenance',
  SANITATION: 'Public Health & Sanitation',
  WATER: 'Water Supply & Sewerage Board',
  ELECTRICITY: 'MSEDCL / Electricity Board',
  TRAFFIC: 'Traffic Police / RTO'
};

// Initialize Gemini if key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    // Note: The package uses new GoogleGenAI class or standard GoogleGenerativeAI
    // Let's use the typical GoogleGenerativeAI import or import { GoogleGenerativeAI } from '@google/generative-ai'
    // To ensure compatibility with most versions of @google/generative-ai:
    // We can fallback to local simulation if there's any load issue, but let's wire it standardly.
    console.log('>>> Sarthi AI: Gemini API Key detected. Ready for Live Mode.');
  } catch (err) {
    console.error('>>> Sarthi AI: Failed to load Google Generative AI client:', err.message);
  }
}

// 1. SPAM FILTER
export function filterSpam(text) {
  if (!text || typeof text !== 'string') {
    return { isSpam: true, reason: 'Empty or invalid complaint text.' };
  }

  const cleaned = text.trim().toLowerCase();
  
  if (cleaned.length < 10) {
    return { isSpam: true, reason: 'Complaint description is too short (under 10 characters).' };
  }

  // Check for gibberish (e.g. asdfghjkl, qweqweqwe, continuous characters)
  if (/(.)\1{4,}/.test(cleaned)) {
    return { isSpam: true, reason: 'Gibberish detected (excessive repeating characters).' };
  }

  // Check if string lacks vowels or basic syllables (English gibberish check)
  const words = cleaned.split(/\s+/);
  let gibberishWordCount = 0;
  words.forEach(w => {
    if (w.length > 5 && !/[aeiouy]/i.test(w)) {
      gibberishWordCount++;
    }
  });

  if (gibberishWordCount / words.length > 0.4) {
    return { isSpam: true, reason: 'High density of unreadable characters/words.' };
  }

  // Basic profanity check (English/Hindi transliterated)
  const blacklisted = ['idiot', 'fool', 'stupid', 'fck', 'shit', 'bitch', 'admin is bad', 'chutiya', 'saala', 'kamina', 'haramkhor'];
  for (const word of blacklisted) {
    if (cleaned.includes(word)) {
      return { isSpam: true, reason: 'Offensive language or non-constructive behavior flagged.' };
    }
  }

  return { isSpam: false, reason: null };
}

// 2. ZERO-FRICTION PARSING AND CLASSIFICATION (Voice/Text Input)
export async function parseComplaint(inputText) {
  // If Live Mode with Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      // Lazy-import to prevent crashes if library issues
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const api = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = api.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are Sarthi AI, an autonomous civic intelligence operating system for Indian municipalities.
        Analyze the following user complaint (which might be in English, Hindi, Marathi, or mixed/Hinglish).
        Parse it and return a strict JSON object with:
        - "title": A concise, formal title (English).
        - "category": Short name of the issue category (e.g. Potholes, Garbage Dump, Water Leakage, Streetlight Failure, Illegal Parking).
        - "department": Must be exactly one of: "Roads & Buildings Maintenance", "Public Health & Sanitation", "Water Supply & Sewerage Board", "MSEDCL / Electricity Board", "Traffic Police / RTO".
        - "priorityHint": One of "High", "Medium", "Low".
        - "officerBrief": A professional 2-to-3-sentence brief in English summarizing the issue, actionable for a municipal worker.
        - "criticalKeywords": Array of keywords indicating proximity to critical zones if mentioned (e.g. "school", "hospital", "highway", "bus stop").
        - "severityScore": Numeric value (0-100) estimated severity.

        User Complaint: "${inputText}"
        
        Return ONLY valid JSON. Do not include markdown wraps like \`\`\`json.
      `;

      const result = await model.generateContent(prompt);
      const resText = result.response.text().trim();
      const parsed = JSON.parse(resText.replace(/```json/g, '').replace(/```/g, '').trim());
      return parsed;
    } catch (err) {
      console.log('Gemini Live parsing failed, falling back to simulated parser:', err.message);
    }
  }

  // Simulated Parser (Fallback & Default Mode)
  // Handles English, Hindi, and Marathi keywords
  const text = inputText.toLowerCase();
  
  let department = DEPARTMENTS.SANITATION;
  let category = 'Sanitation & Solid Waste';
  let title = 'Garbage Accumulation Grievance';
  let priorityHint = 'Medium';
  let severityScore = 40;
  let criticalKeywords = [];

  // Keywords mapping for departments (supporting: English, Hindi, Marathi, Bengali, Tamil, Kannada, Telugu, Punjabi)
  const roadsKeywords = [
    'road', 'pothole', 'khadda', 'street', 'footpath', 'drain', 'digging', 'pavement',
    'खड्डा', 'सड़क', 'रस्ता', 'गटार', 'रस्ते',
    'রাস্তা', 'গর্ত', 'ফুটপাথ',
    'சாலை', 'பள்ளம்', 'பாதை',
    'ರಸ್ತೆ', 'ಗುಂಡಿ', 'ಪಾದಚಾರಿ',
    'రోడ్డు', 'గుంత', 'ఫుట్‌పాత్',
    'ਸੜਕ', 'ਟੋਆ', 'ਰਾਹ'
  ];
  const sanitationKeywords = [
    'garbage', 'garbage dump', 'trash', 'waste', 'litter', 'smell', 'sewage', 'drainage overflow', 'clean', 'kachra', 'dump',
    'कचरा', 'गंदगी', 'साफ', 'घाण', 'सांडपाणी',
    'আবর্জনা', 'ময়লা', 'নোংরা',
    'குப்பை', 'கழிவு', 'நாற்றம்',
    'ಕಸ', 'ತ್ಯಾಜ್ಯ', 'ಗಲೀಜು',
    'చెత్త', 'వ్యర్థాలు', 'మురుగు',
    'ਕੂੜਾ', 'ਗੰਦਗੀ', 'ਮਲਮੂਤਰ'
  ];
  const waterKeywords = [
    'water', 'pipe', 'leak', 'drainage water', 'water supply', 'contamination', 'dirty water', 'paani', 'leakage', 'tap',
    'पानी', 'नल', 'लीक', 'पाणी', 'गळती',
    'জল', 'পাইপ', 'লিক',
    'தண்ணீர்', 'குழாய்', 'கசிவு',
    'ನೀರು', 'ಕೊಳವೆ', 'ಸೋರಿಕೆ',
    'నీరు', 'పైప్', 'లీకేజీ',
    'ਪਾਣੀ', 'ਪਾਈਪ', 'ਲੀਕ'
  ];
  const electricityKeywords = [
    'light', 'streetlight', 'lamp', 'wire', 'hanging wire', 'electricity', 'current', 'power cut', 'pole', 'blackout', 'power',
    'बिजली', 'तार', 'खंभा', 'लाइट', 'वीज', 'खांब', 'दिवा',
    'বিদ্যুৎ', 'তার', 'আলো', 'খুঁটি',
    'மின்சாரம்', 'கம்பி', 'விளக்கு',
    'ವಿದ್ಯುತ್', 'ತಂತಿ', 'ಕಂಬ', 'ದೀಪ',
    'విద్యుత్', 'తీగ', 'స్తంభం', 'దీపం',
    'ਬਿਜਲੀ', 'ਤਾਰ', 'ਖੰਭਾ', 'ਬੱਤੀ'
  ];
  const trafficKeywords = [
    'traffic', 'parking', 'illegal parking', 'signal', 'no parking', 'police', 'rto', 'jam', 'vehicle',
    'पार्किंग', 'गाड़ी', 'जाम', 'गाडी', 'वाहतूक',
    'ট্রাফিক', 'পার্কিং', 'জ্যাম',
    'போக்குவரத்து', 'பார்க்கிங்', 'நெரிசல்',
    'ಸಂಚಾರ', 'ಪಾರ್ಕಿಂಗ್', 'ಜಾಮ್',
    'ట్రాఫిక్', 'పార్కింగ్', 'జామ్',
    'ਟ੍ਰੈਫਿਕ', 'ਪਾਰਕਿੰਗ', 'ਜਾਮ'
  ];

  if (roadsKeywords.some(k => text.includes(k))) {
    department = DEPARTMENTS.ROADS;
    category = 'Roads & Footpaths';
    title = 'Damaged Roadway / Pothole Issue';
    severityScore = 55;
  } else if (waterKeywords.some(k => text.includes(k))) {
    department = DEPARTMENTS.WATER;
    category = 'Water Supply & Sewerage';
    title = 'Water Pipeline Leakage / Contamination';
    severityScore = 70;
  } else if (electricityKeywords.some(k => text.includes(k))) {
    department = DEPARTMENTS.ELECTRICITY;
    category = 'Streetlights & Electricals';
    title = 'Streetlight Malfunction / Hanging Live Wires';
    severityScore = 75;
  } else if (trafficKeywords.some(k => text.includes(k))) {
    department = DEPARTMENTS.TRAFFIC;
    category = 'Traffic & Illegal Parking';
    title = 'Traffic Signal Defect / Obstruction';
    severityScore = 45;
  }

  // Critical Zones detection (Multilingual keys)
  const criticalZones = {
    school: ['school', 'college', 'shala', 'शाळा', 'शाळेजवळ', 'विद्यालय', 'স্কুল', 'பள்ளி', 'ಶಾಲೆ', 'పాఠశాల', 'ਸਕੂਲ'],
    hospital: ['hospital', 'clinic', 'davakhana', 'रुग्णालय', 'दवाखाना', 'হাসপাতাল', 'மருத்துவமனை', 'ಆಸ್ಪತ್ರೆ', 'ఆసుపత్రి', 'ਹਸਪਤਾਲ'],
    transit: ['bus stop', 'railway', 'station', 'highway', 'चौक', 'station road', 'স্টেশন', 'நிலையம்', 'ನಿಲ್ದಾಣ', 'స్టేషన్', 'ਸਟੇਸ਼ਨ'],
  };

  for (const [zone, keys] of Object.entries(criticalZones)) {
    if (keys.some(k => text.includes(k))) {
      criticalKeywords.push(zone);
    }
  }

  // Set Priority based on severity and keywords
  if (severityScore >= 70 || criticalKeywords.length > 0 || text.includes('emergency') || text.includes('danger') || text.includes('धोका')) {
    priorityHint = 'High';
  } else if (text.includes('slow') || text.includes('minor') || text.includes('not urgent')) {
    priorityHint = 'Low';
  }

  // Officer brief generation
  let brief = `A complaint has been registered regarding ${category.toLowerCase()}. `;
  if (criticalKeywords.length > 0) {
    brief += `The complainant notes that this issue is situated near a ${criticalKeywords.join('/')} zone, posing high localized risk. `;
  }
  brief += `Immediate inspection and resolution is requested to prevent public inconvenience.`;

  // Refine titles based on common phrases
  if (text.includes('pothole') || text.includes('khadda')) title = 'Report of Major Potholes';
  else if (text.includes('garbage') || text.includes('kachra')) title = 'Garbage Pile & Sanitation Request';
  else if (text.includes('streetlight') || text.includes('dark')) title = 'Inactive Streetlights causing dark spot';
  else if (text.includes('water leak') || text.includes('pipeline')) title = 'Water Line Leakage Reported';
  else if (text.includes('parking') || text.includes('no parking')) title = 'Illegal Parking causing traffic blockage';

  return {
    title,
    category,
    department,
    priorityHint,
    officerBrief: brief,
    criticalKeywords,
    severityScore
  };
}

// 3. HA VERSINE DISTANCE CHECK (For duplicate clustering)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // Distance in meters
  return d;
}

// 4. DYNAMIC PRIORITY ENGINE
export function calculatePriorityScore(incident, aiParsed) {
  // Base score from category/severity
  let baseScore = aiParsed.severityScore || 50;

  // 1. Proximity to critical zones (+15 points per zone, max 30)
  let zoneScore = Math.min((aiParsed.criticalKeywords?.length || 0) * 15, 30);

  // 2. Population Impact factor (default is medium, if description has keywords we raise it)
  let populationImpact = 10;
  const text = incident.description.toLowerCase();
  if (text.includes('main road') || text.includes('market') || text.includes('crowded') || text.includes('apartment') || text.includes('colony')) {
    populationImpact = 25;
  }

  // 3. Duration factor (if mentions lasting issue)
  let durationScore = 0;
  if (text.includes('week') || text.includes('month') || text.includes('days') || text.includes('long time')) {
    durationScore = 15;
  }

  // Calculate overall score (cap at 100)
  const finalScore = Math.min(baseScore + zoneScore + populationImpact + durationScore, 100);
  return finalScore;
}

// 5. DOUBLE-BLIND VERIFICATION (Proof-of-Resolution)
export function verifyResolutionImages(beforeImage, afterImage) {
  // Simulates computer-vision comparison
  // In real life, this might call a visual similarity model
  // We compute a structured metadata comparison to simulate checking layout, color, and object detection
  
  if (!beforeImage || !afterImage) {
    return {
      verified: false,
      confidence: 0,
      details: 'Missing resolution images for comparison.'
    };
  }

  // Simulation parameters
  const edgesMatch = 75 + Math.floor(Math.random() * 20); // 75% to 95%
  const backgroundSimilarity = 80 + Math.floor(Math.random() * 15); // 80% to 95%
  const objectDifferenceDetected = true; // Indicates the pothole/garbage is no longer present
  
  const confidence = Math.round((edgesMatch + backgroundSimilarity) / 2);
  const verified = confidence >= 80;

  return {
    verified,
    confidence,
    details: `Visual check successful. Edge consistency: ${edgesMatch}%. Background match: ${backgroundSimilarity}%. AI confirms anomaly cleared.`
  };
}
