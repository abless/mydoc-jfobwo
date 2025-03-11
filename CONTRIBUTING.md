# Contributing to Health Advisor

Thank you for your interest in contributing to the Health Advisor project! This document provides guidelines and instructions for contributing to our React Native mobile application with an Express backend that enables users to interact with an LLM as a personalized health advisor.

# Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Security Vulnerabilities](#security-vulnerabilities)
- [License](#license)

# Code of Conduct

We are committed to fostering an open and welcoming environment. By participating in this project, you agree to uphold our Code of Conduct, which includes:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Inappropriate behavior will not be tolerated and may result in removal from the project.

# Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher) or yarn
- MongoDB (v5.0 or higher)
- React Native development environment
  - For iOS: macOS with Xcode
  - For Android: Android Studio with SDK
- LLM provider API key

### Setting Up Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/health-advisor.git
   cd health-advisor
   ```
3. Add the original repository as a remote
   ```bash
   git remote add upstream https://github.com/original-owner/health-advisor.git
   ```
4. Follow the setup instructions in [docs/development/setup.md](docs/development/setup.md)

This will set up both the backend and mobile application for local development.

# Development Workflow

We follow a feature branch workflow with pull requests for code review and integration. The detailed development workflow is documented in [docs/development/workflow.md](docs/development/workflow.md), but here's a summary:

1. Ensure you're working with the latest code
   ```bash
   git checkout main
   git pull upstream main
   ```
2. Create a feature branch for your work
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes with appropriate commits
4. Push your branch to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a pull request to the main repository

For more detailed information on our development process, please refer to the [development workflow documentation](docs/development/workflow.md).

# Branching Strategy

Our repository uses the following branch structure:

- `main`: Production-ready code, always deployable
- `feature/*`: Feature branches for new development
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Emergency fixes for production
- `release/*`: Release preparation branches

Branch names should follow this pattern:

- `feature/short-description`: For new features
- `bugfix/issue-number-short-description`: For bug fixes
- `hotfix/issue-number-short-description`: For critical production fixes
- `release/version-number`: For release preparation

Example: `feature/health-data-input` or `bugfix/123-fix-auth-token-expiration`

# Commit Guidelines

Write clear, concise commit messages that explain the purpose of the change:

- Use the imperative mood ("Add feature" not "Added feature")
- First line should be 50 characters or less
- Optionally followed by a blank line and a more detailed explanation
- Reference issue numbers when applicable: "Fix #123: Resolve token expiration bug"

Commit frequently with logical, atomic changes rather than large, sweeping changes.

# Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with appropriate commits
3. Push your branch to GitHub
4. Create a pull request (PR) to merge into `main`
5. Fill out the PR template with details about your changes
6. Request reviews from appropriate team members
7. Address any feedback from code reviews
8. Ensure all CI checks pass
9. Merge the PR once approved

PRs should be focused on a single feature or fix to facilitate review. The PR template will guide you through providing all necessary information about your changes.

# Code Standards

All code must adhere to our established coding standards:

- Follow the TypeScript style guide
- Use ESLint and Prettier for code formatting
- Maintain consistent naming conventions
- Write self-documenting code with appropriate comments
- Follow the principles of clean code and SOLID design

These standards are enforced through linting in the CI pipeline. You can run linting locally:

```bash
# Backend
cd src/backend
npm run lint

# Mobile
cd src/web
npm run lint
```

# Testing Requirements

All code changes must include appropriate tests:

- **Backend**: Unit tests for utilities, services, and controllers; integration tests for API endpoints
- **Mobile**: Unit tests for components, hooks, and utilities; UI tests for critical flows

Minimum test coverage requirements:
- Backend: 85% line coverage, 85% function coverage, 80% branch coverage
- Mobile: 80% line coverage, 80% function coverage, 75% branch coverage

Run tests locally before submitting a PR:

```bash
# Backend tests
cd src/backend
npm test

# Mobile tests
cd src/web
npm test
```

Tests are run automatically in the CI pipeline and are a requirement for PR approval.

# Documentation

Documentation should be updated alongside code changes:

- Update API documentation for endpoint changes
- Document new features and configuration options
- Update architecture diagrams for significant changes
- Include JSDoc comments for public functions and interfaces

Documentation is stored in the `docs/` directory and should be kept up-to-date.

# Issue Reporting

If you find a bug or have a suggestion for improvement, please create an issue using the appropriate template:

- For bugs, use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- For feature requests, use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

Before creating a new issue, please search existing issues to avoid duplicates. Provide as much detail as possible to help us understand and address the issue effectively.

# Feature Requests

We welcome feature requests that align with the project's goals. When submitting a feature request:

1. Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
2. Clearly describe the problem the feature would solve
3. Explain the benefit to users
4. Suggest an implementation approach if possible

Feature requests will be evaluated based on alignment with project goals, technical feasibility, and community interest.

# Security Vulnerabilities

If you discover a security vulnerability, please do NOT open an issue. Instead, email [security@healthadvisor.example.com](mailto:security@healthadvisor.example.com) with details about the vulnerability. Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix if available

We take security seriously and will address vulnerabilities promptly.

# License

By contributing to the Health Advisor project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE). Note that while the code is MIT licensed, the use of the application for health-related purposes is subject to additional terms addressing health data privacy, HIPAA compliance, and limitations on medical advice.

# Questions and Support

If you have questions about contributing or need support, please:

1. Check the [documentation](docs/) for guidance
2. Search existing issues for similar questions
3. Open a new issue with the question tag if you can't find an answer

We appreciate your contributions and look forward to your involvement in making Health Advisor better for everyone!