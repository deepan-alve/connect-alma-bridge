# Contributing to Connect-Alma-Bridge

First off, thank you for considering contributing to Connect-Alma-Bridge! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Detailed description** of the proposed feature
- **Explain why this enhancement would be useful**
- **Mockups or examples** if possible

### Pull Requests

1. Fork the repo and create your branch from `master`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/connect-alma-bridge.git
cd connect-alma-bridge

# Install dependencies
npm install
cd backend && npm install

# Create environment files
cp .env.example .env.local
cp backend/.env.example backend/.env

# Start development servers
npm run dev  # Frontend on :5173
cd backend && npm run dev  # Backend on :3000
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (ESLint rules)
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused

## Commit Message Guidelines

Use conventional commits format:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## Questions?

Feel free to open an issue with your question!

Thank you! ❤️
