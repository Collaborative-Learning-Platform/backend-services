const { faker } = require('@faker-js/faker');

// Comprehensive processor for all microservices load testing
function beforeScenario(userContext, events, done) {
  // Set up common variables for all scenarios
  userContext.vars.timestamp = Date.now();
  userContext.vars.randomString = faker.lorem.word();
  userContext.vars.randomInt = (min, max) => faker.number.int({ min, max });
  
  // Initialize counters
  userContext.vars.requestCount = 0;
  userContext.vars.errorCount = 0;
  
  return done();
}

function afterResponse(requestParams, response, context, ee, next) {
  context.vars.requestCount++;
  
  // Track response times by service
  const url = requestParams.url;
  const responseTime = response.timings ? response.timings.response : 0;
  
  if (url.includes('/auth/')) {
    ee.emit('histogram', 'auth_service.response_time', responseTime);
  } else if (url.includes('/workspace/')) {
    ee.emit('histogram', 'workspace_service.response_time', responseTime);
  } else if (url.includes('/quiz/')) {
    ee.emit('histogram', 'quiz_service.response_time', responseTime);
  } else if (url.includes('/ai/')) {
    ee.emit('histogram', 'ai_service.response_time', responseTime);
  } else if (url.includes('/storage/')) {
    ee.emit('histogram', 'storage_service.response_time', responseTime);
  } else if (url.includes('/chat/')) {
    ee.emit('histogram', 'chat_service.response_time', responseTime);
  } else if (url.includes('/notifications/')) {
    ee.emit('histogram', 'notification_service.response_time', responseTime);
  } else if (url.includes('/whiteboard/')) {
    ee.emit('histogram', 'whiteboard_service.response_time', responseTime);
  }
  
  // Track errors by service and type
  if (response.statusCode >= 400) {
    context.vars.errorCount++;
    const service = url.split('/')[1] || 'unknown';
    ee.emit('counter', `${service}_service.errors.${response.statusCode}`, 1);
    
    // Log critical errors
    if (response.statusCode >= 500) {
      console.log(`Server error on ${url}: ${response.statusCode}`);
    }
  }
  
  // Track specific success metrics
  if (response.statusCode === 200) {
    const service = url.split('/')[1] || 'unknown';
    ee.emit('counter', `${service}_service.success`, 1);
  }
  
  return next();
}

// Custom function to generate realistic quiz data
function generateQuizData(userContext, events, done) {
  userContext.vars.quizData = {
    title: `${faker.lorem.words(3)} Quiz`,
    description: faker.lorem.sentence(),
    duration: faker.number.int({ min: 15, max: 120 }), // 15-120 minutes
    questions: Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, (_, i) => ({
      id: `q${i + 1}`,
      question: faker.lorem.sentence() + '?',
      type: faker.helpers.arrayElement(['multiple_choice', 'true_false', 'short_answer']),
      options: ['A', 'B', 'C', 'D'].map(opt => `${opt}: ${faker.lorem.words(2)}`),
      points: faker.number.int({ min: 1, max: 10 })
    }))
  };
  return done();
}

// Generate realistic workspace data
function generateWorkspaceData(userContext, events, done) {
  userContext.vars.workspaceData = {
    name: `${faker.company.name()} Class`,
    description: faker.lorem.paragraph(),
    subject: faker.helpers.arrayElement(['Mathematics', 'Science', 'English', 'History', 'Computer Science']),
    grade_level: faker.number.int({ min: 6, max: 12 }),
    max_students: faker.number.int({ min: 10, max: 50 })
  };
  return done();
}

// Generate file upload simulation data
function generateFileData(userContext, events, done) {
  const fileTypes = [
    { ext: 'pdf', type: 'application/pdf', minSize: 50000, maxSize: 5000000 },
    { ext: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', minSize: 20000, maxSize: 2000000 },
    { ext: 'pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', minSize: 100000, maxSize: 10000000 },
    { ext: 'jpg', type: 'image/jpeg', minSize: 30000, maxSize: 3000000 },
    { ext: 'mp4', type: 'video/mp4', minSize: 1000000, maxSize: 100000000 }
  ];
  
  const fileType = faker.helpers.arrayElement(fileTypes);
  userContext.vars.fileData = {
    filename: `${faker.system.fileName()}.${fileType.ext}`,
    content_type: fileType.type,
    size: faker.number.int({ min: fileType.minSize, max: fileType.maxSize }),
    description: faker.lorem.sentence()
  };
  return done();
}

// Generate AI interaction data
function generateAIPrompt(userContext, events, done) {
  const prompts = [
    "Explain the concept of photosynthesis in simple terms",
    "Create a lesson plan for teaching fractions to 5th graders",
    "Generate 5 multiple choice questions about World War II",
    "Summarize the key points of the water cycle",
    "Create an engaging activity for teaching coding basics",
    "Explain Newton's laws of motion with examples",
    "Generate a creative writing prompt for high school students",
    "Create a math problem involving percentages and real-world applications"
  ];
  
  userContext.vars.aiPrompt = faker.helpers.arrayElement(prompts);
  userContext.vars.aiContext = {
    subject: faker.helpers.arrayElement(['Mathematics', 'Science', 'English', 'History']),
    grade_level: faker.number.int({ min: 6, max: 12 }),
    learning_objective: faker.lorem.sentence()
  };
  return done();
}

// Performance monitoring
function logPerformanceMetrics(userContext, events, done) {
  const metrics = {
    timestamp: new Date().toISOString(),
    user_id: userContext.vars.userId || 'anonymous',
    total_requests: userContext.vars.requestCount || 0,
    total_errors: userContext.vars.errorCount || 0,
    error_rate: userContext.vars.requestCount ? (userContext.vars.errorCount / userContext.vars.requestCount) * 100 : 0
  };
  
  // Log metrics periodically (every 50 requests)
  if (metrics.total_requests > 0 && metrics.total_requests % 50 === 0) {
    console.log(`Performance metrics for user ${metrics.user_id}:`, metrics);
  }
  
  return done();
}

module.exports = {
  beforeScenario,
  afterResponse,
  generateQuizData,
  generateWorkspaceData,
  generateFileData,
  generateAIPrompt,
  logPerformanceMetrics
};