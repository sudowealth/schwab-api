# Contributing to schwab-api

Thank you for your interest in contributing to the schwab-api library! This
document provides guidelines for contributing to this project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Commit Messages](#commit-messages)
4. [Pull Requests](#pull-requests)
5. [Release Process](#release-process)
6. [Code of Conduct](#code-of-conduct)

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm or yarn or pnpm
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/schwab-api.git
   cd schwab-api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/sudowealth/schwab-api.git
   ```

## Development Workflow

Our development workflow follows a branch-based approach with automated
releases:

### Branch Structure

- `main` - Main development branch for production releases
- `beta` - Beta releases for testing (managed by maintainers only)
- `feature/*` - Feature branches (created by contributors)
- `fix/*` - Bug fix branches (created by contributors)

Note that **only** the `main` and `beta` branches trigger automated releases.
All other branches, including those with names like `next` or `alpha`, will not
trigger releases.

### 1. Create a Feature/Fix Branch

Always start your work from the latest `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Implement Your Changes

Make your changes, following the code style of the project.

### 3. Run Tests and Linting

Before committing, ensure all tests pass and your code meets linting standards:

```bash
npm run validate  # Runs linting, type checking, and formatting
npm run test      # Runs tests
```

For more detailed information on running tests and writing new ones, see
[TESTING.md](./TESTING.md).

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
to automate version management and releases.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` A new feature (minor version bump)
- `fix:` A bug fix (patch version bump)
- `docs:` Documentation changes only
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, no production code changes
- `refactor:` Code changes that neither fix bugs nor add features
- `style:` Changes that don't affect the code's meaning (formatting, etc.)
- `perf:` Performance improvements

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer or append `!` to the
type:

```
feat!: remove deprecated API
```

## Pull Requests

### Creating a Pull Request

1. Ensure your branch is up to date with the latest `main`:

   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch-name
   git rebase main
   ```

2. Push your branch to your fork:

   ```bash
   git push origin your-branch-name
   ```

3. Create a Pull Request on GitHub against the `main` branch of the original
   repository

### PR Guidelines

- Provide a clear title following conventional commit format
- Include a detailed description of the changes
- Reference any related issues
- Make sure all CI checks pass
- Respond to review comments and make requested changes
- Keep PRs focused on a single change for easier review

## Release Process

This project uses semantic-release for automated versioning and publishing. We
have configured this project to only release from two branches:

- `main` branch - Used for production releases
- `beta` branch - Used for beta/pre-release versions

### For Contributors

As a contributor, you only need to:

1. Submit PRs to the `main` branch
2. Use proper conventional commit messages
3. Ensure your code passes all tests and reviews

The maintainers will handle the release process. Your changes will be included
in:

- The next beta release when merged to the `beta` branch by maintainers
- The next production release when merged to the `main` branch

### Using Beta Releases

To use a beta version in your project:

```bash
npm install @sudowealth/schwab-api@beta
```

### Security Note

Never submit PRs directly to the `beta` branch. These branches are protected and
automatically trigger releases when changes are merged.

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free
experience for everyone, regardless of age, body size, disability, ethnicity,
gender identity and expression, level of experience, nationality, personal
appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by contacting the project maintainers. All complaints will be reviewed
and investigated promptly and fairly.

## License

By contributing to this project, you agree that your contributions will be
licensed under the project's MIT license.
