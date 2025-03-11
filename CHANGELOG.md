# Changelog

All notable changes to the Health Advisor application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - YYYY-MM-DD

### Added
- User authentication via email/password
- Health data input (meals, lab results, symptoms) via photo, text, and voice
- Searchable health history with date filtering
- LLM-powered chat interface for personalized health advice
- Basic user profile management

### Security
- Implemented JWT-based authentication
- Secure storage of health data
- HTTPS for all API communications

## [0.2.0] - YYYY-MM-DD

### Added
- LLM integration for health advice
- Chat interface for user-AI interaction
- Health data context for personalized responses
- Image capture for meal and lab result logging
- Voice recording for symptom reporting

### Changed
- Improved health data storage format
- Enhanced user interface with bottom tab navigation

### Fixed
- Data persistence issues in health log
- Authentication token refresh mechanism

### Security
- Enhanced password hashing with bcrypt
- Implemented secure file storage for health images

## [0.1.0] - YYYY-MM-DD

### Added
- Initial project setup
- Basic user authentication
- Health data model design
- React Native mobile application skeleton
- Express backend API foundation

### Security
- Basic authentication implementation
- Initial security headers configuration

## Guidelines for maintaining this changelog

- Each version should have its own section with a version number and release date
- Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
- Most recent version should be at the top
- Mention both frontend and backend changes where applicable
- Include PR numbers when relevant
- Use plain language that end users can understand