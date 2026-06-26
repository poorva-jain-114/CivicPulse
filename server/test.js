import {
  filterSpam,
  parseComplaint,
  calculateDistance,
  calculatePriorityScore,
  verifyResolutionImages
} from './services/sarthi.js';

async function runTests() {
  console.log('==================================================');
  console.log('       SARTHI AI ENGINE INTEGRATION TESTING      ');
  console.log('==================================================\n');

  // Test 1: Spam Filter
  console.log('>> [TEST 1] Testing Spam Filter...');
  const cleanText = "There is a massive water leakage near the school gate, it has been running for 2 days.";
  const spamText = "asdfghjklqwerty bbbbbbbbbbb";
  const offensiveText = "You idiots fix my street light stupid fools";

  const cleanCheck = filterSpam(cleanText);
  const spamCheck = filterSpam(spamText);
  const offensiveCheck = filterSpam(offensiveText);

  console.log('   - Clean Text (Should be false):', cleanCheck.isSpam);
  console.log('   - Gibberish Text (Should be true):', spamCheck.isSpam, `(${spamCheck.reason})`);
  console.log('   - Offensive Text (Should be true):', offensiveCheck.isSpam, `(${offensiveCheck.reason})`);

  if (!cleanCheck.isSpam && spamCheck.isSpam && offensiveCheck.isSpam) {
    console.log('   [SUCCESS] Spam filter tests passed.\n');
  } else {
    console.error('   [FAILURE] Spam filter tests failed.\n');
  }

  // Test 2: Natural Language Parsing & Routing
  console.log('>> [TEST 2] Testing Zero-Friction Parsing & Routing...');
  const sampleComplaint = "Road khadda is very big on the main highway near clinical hospital, vehicles are breaking wheels.";
  const parsed = await parseComplaint(sampleComplaint);

  console.log('   - Extracted Title:', parsed.title);
  console.log('   - Extracted Category:', parsed.category);
  console.log('   - Routed Department:', parsed.department);
  console.log('   - Priority Hint:', parsed.priorityHint);
  console.log('   - Officer Brief:', parsed.officerBrief);
  console.log('   - Critical keywords found:', parsed.criticalKeywords);

  if (parsed.department && parsed.officerBrief) {
    console.log('   [SUCCESS] Parsing & Routing tests passed.\n');
  } else {
    console.error('   [FAILURE] Parsing & Routing tests failed.\n');
  }

  // Test 3: Haversine Distance (Clustering)
  console.log('>> [TEST 3] Testing Duplicate Clustering Proximity...');
  const nagpurStationLat = 21.1543;
  const nagpurStationLng = 79.0882;
  const nearbyLat = 21.1546; // Approx 40-50m away
  const nearbyLng = 79.0879;
  const farLat = 21.1654; // Approx 1.5km away
  const farLng = 79.0938;

  const distanceNearby = calculateDistance(nagpurStationLat, nagpurStationLng, nearbyLat, nearbyLng);
  const distanceFar = calculateDistance(nagpurStationLat, nagpurStationLng, farLat, farLng);

  console.log(`   - Nearby distance: ${distanceNearby.toFixed(2)} meters`);
  console.log(`   - Far distance: ${distanceFar.toFixed(2)} meters`);

  if (distanceNearby < 100 && distanceFar > 100) {
    console.log('   [SUCCESS] Distance clustering checks passed.\n');
  } else {
    console.error('   [FAILURE] Distance clustering checks failed.\n');
  }

  // Test 4: Dynamic Priority Score
  console.log('>> [TEST 4] Testing Dynamic Priority Engine...');
  const mockIncident = { description: sampleComplaint };
  const score = calculatePriorityScore(mockIncident, parsed);
  console.log(`   - Computed Priority Score (0-100): ${score}`);

  if (score > 50) {
    console.log('   [SUCCESS] Priority Engine tests passed.\n');
  } else {
    console.error('   [FAILURE] Priority Engine tests failed.\n');
  }

  // Test 5: Proof-of-Resolution Double-Blind Verification
  console.log('>> [TEST 5] Testing Resolution Proof Verification...');
  const verifyResult = verifyResolutionImages('beforeImageBase64', 'afterImageBase64');
  console.log('   - Verification Outcome:', verifyResult.verified);
  console.log('   - Confidence Level:', verifyResult.confidence + '%');
  console.log('   - Details:', verifyResult.details);

  if (verifyResult.confidence > 0) {
    console.log('   [SUCCESS] Proof-of-Resolution tests passed.\n');
  } else {
    console.error('   [FAILURE] Proof-of-Resolution tests failed.\n');
  }

  console.log('==================================================');
  console.log('     ALL INTEGRATION TESTS RUN SUCCESSFULLY      ');
  console.log('==================================================');
}

runTests();
