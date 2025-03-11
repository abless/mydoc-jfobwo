# Health Advisor Development Workflow

This document outlines the development workflow for the Health Advisor application, covering the entire software development lifecycle from code creation to deployment. It provides guidelines for version control, code review, testing, and deployment processes for both the Express backend and React Native mobile application.

# Table of Contents
<!-- toc will be generated here -->

# 1. Development Environment

Before starting development, ensure your environment is properly set up according to the [Development Setup Guide](setup.md).

## 1.1 Prerequisites
- Git installed and configured
- Node.js and npm installed
- Docker and Docker Compose (recommended)
- IDE with TypeScript support (VS Code recommended)
- Access to the GitHub repository

## 1.2 Repository Structure
The Health Advisor repository is organized as follows:

```
health-advisor/
├── .github/            # GitHub Actions workflows and templates
├── docs/               # Documentation
├── infrastructure/     # Infrastructure as Code and deployment configs
├── scripts/            # Utility scripts
├── src/
│   ├── backend/        # Express backend service
│   └── web/            # React Native mobile application
└── README.md
```

# 2. Git Workflow

We follow a feature branch workflow with pull requests for code review and integration.

## 2.1 Branching Strategy
Our repository uses the following branch structure:

- `main`: Production-ready code, always deployable
- `develop`: Integration branch for feature development (optional)
- `feature/*`: Feature branches for new development
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Emergency fixes for production
- `release/*`: Release preparation branches

All development work should be done in feature branches created from `main` (or `develop` if used).

## 2.2 Branch Naming Convention
Branch names should follow this pattern:

- `feature/short-description`: For new features
- `bugfix/issue-number-short-description`: For bug fixes
- `hotfix/issue-number-short-description`: For critical production fixes
- `release/version-number`: For release preparation

Example: `feature/health-data-input` or `bugfix/123-fix-auth-token-expiration`

## 2.3 Commit Guidelines
Write clear, concise commit messages that explain the purpose of the change:

- Use the imperative mood ("Add feature" not "Added feature")
- First line should be 50 characters or less
- Optionally followed by a blank line and a more detailed explanation
- Reference issue numbers when applicable: "Fix #123: Resolve token expiration bug"

Commit frequently with logical, atomic changes rather than large, sweeping changes.

## 2.4 Pull Request Process
1. Create a feature branch from `main` (or `develop`)
2. Make your changes with appropriate commits
3. Push your branch to GitHub
4. Create a pull request (PR) to merge into `main` (or `develop`)
5. Fill out the PR template with details about your changes
6. Request reviews from appropriate team members
7. Address any feedback from code reviews
8. Ensure all CI checks pass
9. Merge the PR once approved

PRs should be focused on a single feature or fix to facilitate review.

## 2.5 Code Review Guidelines
When reviewing code, focus on:

- Functionality: Does the code work as intended?
- Architecture: Does the code follow our design patterns?
- Performance: Are there any performance concerns?
- Security: Are there any security vulnerabilities?
- Maintainability: Is the code clear and well-documented?
- Test coverage: Are there sufficient tests?

Provide constructive feedback and suggest improvements rather than just pointing out issues.

# 3. Development Process

The development process includes coding standards, testing requirements, and documentation expectations.

## 3.1 Coding Standards
All code must adhere to our established coding standards:

- Follow the TypeScript style guide
- Use ESLint and Prettier for code formatting
- Maintain consistent naming conventions
- Write self-documenting code with appropriate comments
- Follow the principles of clean code and SOLID design

These standards are enforced through linting in the CI pipeline.

## 3.2 Testing Requirements
All code changes must include appropriate tests:

- **Backend**: Unit tests for utilities, services, and controllers; integration tests for API endpoints
- **Mobile**: Unit tests for components, hooks, and utilities; UI tests for critical flows

Minimum test coverage requirements:
- Backend: 85% line coverage, 85% function coverage, 80% branch coverage
- Mobile: 80% line coverage, 80% function coverage, 75% branch coverage

Tests are run automatically in the CI pipeline and are a requirement for PR approval.

## 3.3 Documentation
Documentation should be updated alongside code changes:

- Update API documentation for endpoint changes
- Document new features and configuration options
- Update architecture diagrams for significant changes
- Include JSDoc comments for public functions and interfaces

Documentation is stored in the `docs/` directory and should be kept up-to-date.

## 3.4 Feature Flags
Use feature flags for features that are in development but not ready for production:

- Implement feature flags in the configuration
- Document feature flags in the appropriate configuration files
- Use feature flags to enable/disable features in different environments

This allows for continuous integration while controlling feature availability.

# 4. Backend Development Workflow

Specific workflow details for the Express backend service.

## 4.1 Local Development
For local backend development:

```bash
# Navigate to the backend directory
cd src/backend

# Install dependencies
npm install

# Start the development server
npm run dev
```

This starts the backend service with hot reloading at http://localhost:5000/api.

## 4.2 Testing
Run tests during development to ensure code quality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

Tests are located in the `src/backend/tests` directory, organized into `unit` and `integration` subdirectories.

## 4.3 Database Migrations
When making changes to the database schema:

1. Create a new migration script in `src/backend/src/migrations`
2. Test the migration locally
3. Document the migration in the PR description
4. Migrations are run automatically during deployment

Ensure migrations are backward compatible and include rollback procedures.

## 4.4 API Documentation
When modifying or adding API endpoints:

1. Update the OpenAPI/Swagger documentation
2. Ensure the documentation matches the implementation
3. Test the API using Postman or similar tools

API documentation is available at `/api-docs` when running the backend service.

# 5. Mobile Development Workflow

Specific workflow details for the React Native mobile application.

## 5.1 Local Development
For local mobile development:

```bash
# Navigate to the web directory
cd src/web

# Install dependencies
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..

# Start the Metro bundler
npm start

# In a new terminal, run on iOS (macOS only)
npm run ios

# Or run on Android
npm run android
```

This builds and runs the application on a simulator/emulator or connected device.

## 5.2 Testing
Run tests during development to ensure code quality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Tests are located in the `src/web/__tests__` directory, mirroring the source code structure.

## 5.3 UI Component Development
For UI component development:

1. Create reusable components in `src/web/src/components`
2. Write tests for components in `src/web/__tests__/components`
3. Follow the component structure guidelines
4. Ensure components are responsive and accessible

Components should be modular, reusable, and well-documented.

## 5.4 State Management
For state management:

1. Use React Context for global state
2. Use local state for component-specific state
3. Create custom hooks for reusable state logic
4. Document state management patterns

State management should be predictable, testable, and efficient.

## 5.5 Device Testing
Test on multiple devices and screen sizes:

- iOS: iPhone SE, iPhone 13, iPhone 13 Pro Max
- Android: Small (5"), Medium (6"), Large (6.5"+)
- Test in both portrait and landscape orientations
- Test with different OS versions

Ensure the application works correctly on all supported devices.

# 6. Continuous Integration

Our CI pipeline automatically builds, tests, and validates code changes.

## 6.1 GitHub Actions Workflows
We use GitHub Actions for CI/CD, with the following main workflows:

- `backend-build.yml`: Builds and tests the backend service
- `backend-deploy.yml`: Deploys the backend service
- `mobile-build.yml`: Builds and tests the mobile application
- `mobile-deploy.yml`: Deploys the mobile application

These workflows are triggered automatically on pushes to `main` and pull requests.

## 6.2 Backend CI Pipeline
The backend CI pipeline includes:

1. Linting and type checking
2. Unit tests with coverage reporting
3. Security scanning with CodeQL
4. Integration tests with MongoDB
5. Build and artifact generation

All checks must pass before a PR can be merged.

## 6.3 Mobile CI Pipeline
The mobile CI pipeline includes:

1. Linting and type checking
2. Unit tests with coverage reporting
3. Android build
4. iOS build (on macOS runners)
5. Artifact generation

All checks must pass before a PR can be merged.

## 6.4 Quality Gates
The following quality gates are enforced in the CI pipeline:

- All tests must pass
- Code coverage must meet minimum thresholds
- No critical security vulnerabilities
- No linting errors
- Successful build for all platforms

PRs that don't meet these criteria cannot be merged.

# 7. Deployment Process

Our deployment process ensures reliable, consistent releases to various environments.

## 7.1 Environments
We maintain the following environments:

- **Development**: Local development environment
- **Staging**: Pre-production environment for testing
- **Production**: Live environment for end users

Each environment has its own configuration and infrastructure.

## 7.2 Backend Deployment
Backend deployment follows these steps:

1. Code is merged to `main` via PR
2. CI pipeline builds and tests the code
3. Docker image is built and pushed to container registry
4. Staging deployment is triggered automatically
5. Staging environment is tested and validated
6. Production deployment is triggered manually after approval
7. Blue/green deployment ensures zero downtime

See [Backend Deployment Documentation](../deployment/backend.md) for details.

## 7.3 Mobile Deployment
Mobile deployment follows these steps:

1. Code is merged to `main` via PR
2. CI pipeline builds and tests the code
3. Android and iOS builds are generated
4. Builds are deployed to TestFlight and Google Play Beta
5. Beta builds are tested and validated
6. Production deployment to App Store and Google Play is triggered manually after approval

See [Mobile Deployment Documentation](../deployment/mobile.md) for details.

## 7.4 Release Process
Our release process includes:

1. Create a release branch from `main`
2. Perform final testing and validation
3. Update version numbers and release notes
4. Create a GitHub release with release notes
5. Deploy to production
6. Monitor the deployment for issues

Releases are scheduled on a regular cadence, typically every two weeks.

## 7.5 Hotfix Process
For critical production issues:

1. Create a `hotfix` branch from `main`
2. Implement and test the fix
3. Create a PR for review
4. After approval, merge to `main`
5. Deploy to production immediately
6. Backport the fix to any in-progress release branches

Hotfixes bypass the regular release cycle for urgent issues.

# 8. Monitoring and Feedback

Monitoring production and gathering feedback is essential for continuous improvement.

## 8.1 Application Monitoring
We monitor the application using:

- CloudWatch for backend metrics and logs
- Firebase Crashlytics for mobile crash reporting
- Custom metrics for business KPIs
- Uptime monitoring for API endpoints

Alerts are configured for critical issues and performance degradation.

## 8.2 User Feedback
We collect user feedback through:

- In-app feedback mechanisms
- App store reviews
- User testing sessions
- Support tickets

Feedback is tracked and prioritized for future development.

## 8.3 Performance Metrics
We track key performance metrics:

- API response times
- Mobile app startup time
- Screen rendering performance
- Database query performance
- LLM integration response times

Performance issues are addressed as part of regular development.

# 9. Development Best Practices

Additional best practices for Health Advisor development.

## 9.1 Security Practices
- Never commit secrets or credentials to the repository
- Use environment variables for sensitive configuration
- Follow the principle of least privilege
- Validate all user input
- Keep dependencies updated
- Run security scans regularly

## 9.2 Performance Optimization
- Optimize database queries
- Implement appropriate caching
- Minimize bundle sizes
- Optimize images and assets
- Profile and optimize rendering performance
- Use performance monitoring tools

## 9.3 Accessibility
- Follow WCAG 2.1 AA guidelines
- Test with screen readers
- Ensure proper contrast ratios
- Provide text alternatives for images
- Support keyboard navigation
- Test with accessibility tools

## 9.4 Internationalization
- Use a translation framework
- Externalize all user-facing strings
- Support right-to-left languages
- Format dates, numbers, and currencies appropriately
- Test with different locales

# 10. Troubleshooting

Common development issues and their solutions.

## 10.1 Git Issues
- **Merge conflicts**: Resolve by pulling latest changes and merging carefully
- **Accidental commits**: Use `git reset` or `git revert` to undo changes
- **Large files**: Use Git LFS for large binary files
- **Branch management**: Use `git branch -d` to clean up old branches

## 10.2 CI/CD Issues
- **Failed builds**: Check the workflow logs for specific errors
- **Test failures**: Run tests locally to debug
- **Deployment failures**: Verify environment configuration
- **Performance issues**: Check resource allocation and optimize build steps

## 10.3 Development Environment Issues
- **Node.js version conflicts**: Use nvm to manage Node.js versions
- **Dependency issues**: Clear node_modules and reinstall
- **Docker issues**: Check Docker logs and container status
- **Mobile build issues**: Check platform-specific requirements

# 11. References
- [Development Setup Guide](setup.md)
- [Backend Deployment Documentation](../deployment/backend.md)
- [Mobile Deployment Documentation](../deployment/mobile.md)
- [API Documentation](../api/README.md)
- [Architecture Documentation](../architecture/README.md)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)