// Auth processor for Artillery load testing
// Provides utility functions for authentication flows

const { faker } = require('@faker-js/faker');

// Generate realistic test data
function generateUserData() {
  return {
    email: faker.internet.email(),
    password: 'TestPassword123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: faker.helpers.arrayElement(['student', 'teacher', 'admin'])
  };
}

// Before scenario hooks
function beforeScenario(userContext, events, done) {
  // Generate unique user data for each virtual user
  userContext.vars.userData = generateUserData();
  
  // Add custom headers
  userContext.vars.userAgent = 'Artillery-LoadTest/1.0';
  userContext.vars.sessionId = faker.string.uuid();
  
  return done();
}

// After response hooks
function afterResponse(requestParams, response, context, ee, next) {
  // Log failed requests for debugging
  if (response.statusCode >= 400) {
    console.log(`Request failed: ${requestParams.url} - Status: ${response.statusCode}`);
    ee.emit('error', `HTTP ${response.statusCode}: ${requestParams.url}`);
  }
  
  // Track authentication success/failure
  if (requestParams.url.includes('/auth/login')) {
    if (response.statusCode === 200) {
      ee.emit('counter', 'auth.login.success', 1);
    } else {
      ee.emit('counter', 'auth.login.failure', 1);
    }
  }
  
  return next();
}

// Custom functions for scenarios
function setRandomCredentials(userContext, events, done) {
  userContext.vars.email = faker.internet.email();
  userContext.vars.password = 'TestPassword123!';
  return done();
}

function setInvalidCredentials(userContext, events, done) {
  userContext.vars.email = 'invalid@test.com';
  userContext.vars.password = 'wrongpassword';
  return done();
}

function generateRandomString(userContext, events, done) {
  userContext.vars.randomString = faker.lorem.word();
  return done();
}

module.exports = {
  beforeScenario,
  afterResponse,
  setRandomCredentials,
  setInvalidCredentials,
  generateRandomString
};