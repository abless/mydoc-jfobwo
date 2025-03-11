/**
 * Database Seeding Script for Health Advisor
 * 
 * This script populates the MongoDB database with initial test data for
 * development, testing, and demonstration purposes. It creates users,
 * health data entries (meals, lab results, symptoms), and chat conversations
 * with realistic back-and-forth messages.
 */

// Import required modules
const mongoose = require('mongoose'); // v7.0.3
const dotenv = require('dotenv'); // v16.0.3
const path = require('path'); // built-in
const fs = require('fs'); // built-in

// Import database connection functions
const { connectToDatabase, disconnectFromDatabase } = require('../../src/backend/src/config/database');

// Import models
const User = require('../../src/backend/src/models/user.model').default;
const { HealthData } = require('../../src/backend/src/models/index');
const { ChatConversation } = require('../../src/backend/src/models/chat-conversation.model');
const { ChatMessage } = require('../../src/backend/src/models/chat-message.model');

// Import types
const { UserRole } = require('../../src/backend/src/types/user.types');
const { 
  HealthDataType, 
  MealType, 
  SymptomSeverity, 
  InputSource 
} = require('../../src/backend/src/types/health.types');
const { ChatRole } = require('../../src/backend/src/types/chat.types');

// Constants for controlling the amount of test data
const USERS_COUNT = 5;
const HEALTH_DATA_PER_USER = 10;
const CONVERSATIONS_PER_USER = 3;
const MESSAGES_PER_CONVERSATION = 10;

/**
 * Creates test user accounts with predefined emails and passwords
 * @returns {Promise<Array<any>>} Array of created user documents
 */
async function seedUsers() {
  console.log('Seeding users...');
  
  // Define test users
  const users = [
    // Admin user
    {
      email: 'admin@healthadvisor.com',
      password: 'Admin123!',
      role: UserRole.ADMIN
    },
    // Regular users
    {
      email: 'user1@example.com',
      password: 'Password123!',
      role: UserRole.USER
    },
    {
      email: 'user2@example.com',
      password: 'Password123!',
      role: UserRole.USER
    },
    {
      email: 'user3@example.com',
      password: 'Password123!',
      role: UserRole.USER
    },
    {
      email: 'user4@example.com',
      password: 'Password123!',
      role: UserRole.USER
    }
  ];

  // Create users in the database
  const createdUsers = await User.create(users);
  console.log(`Created ${createdUsers.length} users`);
  
  return createdUsers;
}

/**
 * Creates test health data entries for each user
 * @param {Array<any>} users - Array of user documents
 * @returns {Promise<Array<any>>} Array of created health data documents
 */
async function seedHealthData(users) {
  console.log('Seeding health data...');
  
  const healthData = [];
  
  for (const user of users) {
    // Create health data entries for each user
    for (let i = 0; i < HEALTH_DATA_PER_USER; i++) {
      const dataType = getRandomHealthDataType();
      const timestamp = generateRandomDate(30); // Random date within the past 30 days
      
      let data, metadata;
      
      if (dataType === HealthDataType.MEAL) {
        data = {
          description: getRandomMealDescription(),
          mealType: getRandomMealType(),
          imageUrl: ''
        };
        metadata = {
          source: InputSource.PHOTO,
          tags: ['meal', getMealTag(data.mealType)],
          location: {}
        };
      } else if (dataType === HealthDataType.LAB_RESULT) {
        data = {
          testType: getRandomLabTestType(),
          testDate: timestamp,
          results: getRandomLabResults(),
          notes: getRandomLabNotes(),
          imageUrl: ''
        };
        metadata = {
          source: InputSource.PHOTO,
          tags: ['lab', 'test', data.testType.toLowerCase()],
          location: {}
        };
      } else if (dataType === HealthDataType.SYMPTOM) {
        data = {
          description: getRandomSymptomDescription(),
          severity: getRandomSymptomSeverity(),
          duration: getRandomDuration(),
          transcription: '',
          audioUrl: ''
        };
        metadata = {
          source: InputSource.VOICE,
          tags: ['symptom', data.severity],
          location: {}
        };
      }
      
      healthData.push({
        userId: user._id,
        type: dataType,
        timestamp,
        data,
        fileIds: [],
        metadata
      });
    }
  }
  
  // Create health data entries in the database
  const createdHealthData = await HealthData.create(healthData);
  console.log(`Created ${createdHealthData.length} health data entries`);
  
  return createdHealthData;
}

/**
 * Creates test chat conversations for each user
 * @param {Array<any>} users - Array of user documents
 * @returns {Promise<Array<any>>} Array of created conversation documents
 */
async function seedChatConversations(users) {
  console.log('Seeding chat conversations...');
  
  const conversations = [];
  
  for (const user of users) {
    // Create conversations for each user
    for (let i = 0; i < CONVERSATIONS_PER_USER; i++) {
      const title = getRandomConversationTitle();
      
      conversations.push(await ChatConversation.createConversation(
        user._id.toString(),
        title
      ));
    }
  }
  
  console.log(`Created ${conversations.length} chat conversations`);
  return conversations;
}

/**
 * Creates test chat messages for each conversation
 * @param {Array<any>} users - Array of user documents
 * @param {Array<any>} conversations - Array of conversation documents
 * @returns {Promise<Array<any>>} Array of created message documents
 */
async function seedChatMessages(users, conversations) {
  console.log('Seeding chat messages...');
  
  const messages = [];
  
  for (const conversation of conversations) {
    // Find the user who owns this conversation
    const user = users.find(u => u._id.toString() === conversation.userId.toString());
    
    if (!user) continue;
    
    // Create system message to start the conversation
    const systemMessage = await ChatMessage.createMessage(
      conversation._id.toString(),
      user._id.toString(),
      ChatRole.SYSTEM,
      'Hello! I am your personal health advisor. How can I help you today?',
      { initialMessage: true }
    );
    
    messages.push(systemMessage);
    
    // Create a realistic back-and-forth conversation
    for (let i = 0; i < MESSAGES_PER_CONVERSATION; i++) {
      // Alternate between user and assistant
      const role = i % 2 === 0 ? ChatRole.USER : ChatRole.ASSISTANT;
      
      // Generate message content based on role
      let content;
      if (role === ChatRole.USER) {
        content = getRandomUserMessage();
      } else {
        content = getRandomAssistantMessage();
      }
      
      // Create the message
      const message = await ChatMessage.createMessage(
        conversation._id.toString(),
        user._id.toString(),
        role,
        content
      );
      
      messages.push(message);
    }
  }
  
  console.log(`Created ${messages.length} chat messages`);
  return messages;
}

/**
 * Generates a random date within the past month
 * @param {number} daysBack - Maximum number of days in the past
 * @returns {Date} Random date within the specified range
 */
function generateRandomDate(daysBack) {
  const today = new Date();
  const pastDate = new Date(today.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  // Generate a random timestamp between pastDate and today
  const randomTimestamp = pastDate.getTime() + Math.random() * (today.getTime() - pastDate.getTime());
  
  return new Date(randomTimestamp);
}

/**
 * Clears existing data from the database before seeding
 * @returns {Promise<void>} Promise that resolves when database is cleared
 */
async function clearDatabase() {
  console.log('Clearing existing data...');
  
  // Delete all documents from all collections
  await User.deleteMany({});
  await HealthData.deleteMany({});
  await ChatConversation.deleteMany({});
  await ChatMessage.deleteMany({});
  
  console.log('Database cleared');
}

/**
 * Gets a random health data type
 * @returns {string} Random health data type
 */
function getRandomHealthDataType() {
  const types = [HealthDataType.MEAL, HealthDataType.LAB_RESULT, HealthDataType.SYMPTOM];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Gets a random meal description
 * @returns {string} Random meal description
 */
function getRandomMealDescription() {
  const meals = [
    'Grilled chicken salad with avocado and olive oil dressing',
    'Oatmeal with berries and honey',
    'Salmon with roasted vegetables',
    'Turkey sandwich on whole grain bread',
    'Vegetable stir-fry with tofu',
    'Greek yogurt with granola and fruit',
    'Quinoa bowl with mixed vegetables and chickpeas',
    'Spinach and feta omelette',
    'Lentil soup with whole grain bread',
    'Mixed berry smoothie with protein powder'
  ];
  return meals[Math.floor(Math.random() * meals.length)];
}

/**
 * Gets a random meal type
 * @returns {string} Random meal type
 */
function getRandomMealType() {
  const types = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Gets a tag based on meal type
 * @param {string} mealType - Meal type
 * @returns {string} Tag
 */
function getMealTag(mealType) {
  return mealType.toLowerCase();
}

/**
 * Gets a random lab test type
 * @returns {string} Random lab test type
 */
function getRandomLabTestType() {
  const tests = ['Blood Test', 'Cholesterol', 'Blood Sugar', 'Thyroid Panel', 'Vitamin D', 'CBC', 'Liver Function', 'Kidney Function'];
  return tests[Math.floor(Math.random() * tests.length)];
}

/**
 * Gets random lab results
 * @returns {Object} Random lab results
 */
function getRandomLabResults() {
  return {
    cholesterol: Math.floor(Math.random() * 100 + 150),
    hdl: Math.floor(Math.random() * 30 + 40),
    ldl: Math.floor(Math.random() * 50 + 70),
    triglycerides: Math.floor(Math.random() * 100 + 100)
  };
}

/**
 * Gets random lab notes
 * @returns {string} Random lab notes
 */
function getRandomLabNotes() {
  const notes = [
    'Fasting before test',
    'Follow-up test in 3 months',
    'Slight improvement from last test',
    'Test performed at Central Lab',
    'Morning test after 8 hours fasting',
    'Doctor recommended retest in 6 months',
    'Some values are borderline high',
    'All values within normal range'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

/**
 * Gets a random symptom description
 * @returns {string} Random symptom description
 */
function getRandomSymptomDescription() {
  const symptoms = [
    'Headache with mild pressure behind the eyes',
    'Sore throat and difficulty swallowing',
    'Muscle aches, especially in the legs',
    'Mild fever with chills',
    'Persistent cough with phlegm',
    'Joint pain in knees and ankles',
    'Fatigue and general weakness',
    'Upset stomach and nausea',
    'Dizziness when standing up quickly',
    'Skin rash with mild itching'
  ];
  return symptoms[Math.floor(Math.random() * symptoms.length)];
}

/**
 * Gets a random symptom severity
 * @returns {string} Random symptom severity
 */
function getRandomSymptomSeverity() {
  const severities = [SymptomSeverity.MILD, SymptomSeverity.MODERATE, SymptomSeverity.SEVERE];
  return severities[Math.floor(Math.random() * severities.length)];
}

/**
 * Gets a random duration
 * @returns {string} Random duration
 */
function getRandomDuration() {
  const durations = ['30 minutes', '1 hour', '2 hours', '4 hours', '8 hours', '1 day', '2 days', '3 days', '1 week'];
  return durations[Math.floor(Math.random() * durations.length)];
}

/**
 * Gets a random conversation title
 * @returns {string} Random conversation title
 */
function getRandomConversationTitle() {
  const titles = [
    'Diet recommendations',
    'Exercise routine questions',
    'Sleep improvement advice',
    'Vitamin supplements',
    'Headache concerns',
    'Blood pressure questions',
    'Cholesterol management',
    'Stress reduction strategies',
    'Allergy symptoms',
    'Digestive health'
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}

/**
 * Gets a random user message
 * @returns {string} Random user message
 */
function getRandomUserMessage() {
  const messages = [
    'I've been having frequent headaches after meals. What could be causing this?',
    'How much water should I be drinking daily?',
    'Can you recommend some foods to help lower cholesterol?',
    'I'm having trouble sleeping at night. Any suggestions?',
    'What are the best exercises for someone with knee pain?',
    'Are there any natural remedies for allergies?',
    'How can I improve my digestion?',
    'What vitamins should I take for more energy?',
    'Is it normal to feel tired after eating?',
    'How often should I get my blood pressure checked?'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Gets a random assistant message
 * @returns {string} Random assistant message
 */
function getRandomAssistantMessage() {
  const messages = [
    'Based on your health data, I've noticed you often have high-sugar meals. Headaches can be triggered by rapid changes in blood sugar levels. Try eating more balanced meals with protein and fiber to stabilize your blood sugar.',
    'The general recommendation is to drink about 8 glasses (64 ounces) of water daily, but this can vary based on your activity level, climate, and individual health needs. Your health data shows you've been exercising regularly, so you might need more water on those days.',
    'Foods that can help lower cholesterol include oats, fatty fish like salmon, nuts such as almonds and walnuts, and avocados. I see from your meal logs that you're already incorporating some of these, which is great!',
    'Looking at your health logs, I notice you often record screen time right before bed. Try establishing a calming bedtime routine without screens an hour before sleep. Also, maintaining a consistent sleep schedule can significantly improve sleep quality.',
    'Low-impact exercises like swimming, cycling, or elliptical training are generally easier on the knees. Your health data indicates you've been walking regularly, which is also excellent. Consider adding some gentle strength training to support the muscles around your knees.',
    'Some people find relief from allergies with local honey, saline nasal rinses, or supplements like quercetin. Your symptom logs show your allergies seem to worsen in the morning - consider keeping windows closed overnight and using an air purifier.',
    'To improve digestion, try eating smaller, more frequent meals, staying hydrated, and incorporating probiotic-rich foods like yogurt. From your meal logs, I see you might benefit from adding more fiber-rich foods to your diet as well.',
    'Your recent lab results show your vitamin D is slightly low. Adding a vitamin D supplement might help with energy levels. B vitamins, particularly B12, are also important for energy production.',
    'Post-meal fatigue can be normal, especially after large or carbohydrate-heavy meals. Your meal logs show your lunch portions tend to be larger - try smaller, balanced meals that include protein to maintain steady energy levels throughout the day.',
    'With your current health profile, getting your blood pressure checked once a year is typically sufficient. However, if you have concerns or a family history of heart disease, more frequent monitoring might be beneficial.'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Main function that orchestrates the database seeding process
 * @returns {Promise<void>} Promise that resolves when seeding is complete
 */
async function main() {
  // Load environment variables
  dotenv.config();
  
  console.log('Starting database seeding...');
  
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed users
    const users = await seedUsers();
    
    // Seed health data
    const healthData = await seedHealthData(users);
    
    // Seed chat conversations
    const conversations = await seedChatConversations(users);
    
    // Seed chat messages
    const messages = await seedChatMessages(users, conversations);
    
    console.log('Seeding completed successfully!');
    console.log(`Created ${users.length} users`);
    console.log(`Created ${healthData.length} health data entries`);
    console.log(`Created ${conversations.length} conversations`);
    console.log(`Created ${messages.length} chat messages`);
    
    // Disconnect from the database
    await disconnectFromDatabase();
  } catch (error) {
    console.error('Error during seeding:', error);
    
    // Disconnect from the database in case of error
    await disconnectFromDatabase();
    process.exit(1);
  }
}

// Run the main function
main();