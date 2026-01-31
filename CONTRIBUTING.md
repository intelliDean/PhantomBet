# Contributing to PhantomBet

Thank you for your interest in contributing to PhantomBet! 🎉

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/phantombet.git
   cd phantombet
   ```
3. **Install dependencies**
   ```bash
   # Contracts
   cd contracts && npm install
   
   # CRE Workflow
   cd ../cre-workflow && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

## 🌿 Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-market-categories`)
- `fix/` - Bug fixes (e.g., `fix/settlement-calculation`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

## 📝 Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(contracts): add market category filtering
fix(frontend): resolve wallet connection issue
docs(readme): update installation instructions
```

## 🧪 Testing Requirements

### Smart Contracts
```bash
cd contracts
npm test
npm run coverage
```

### Frontend
```bash
cd frontend
npm test
npm run build
```

## 🔍 Code Review Process

1. All PRs require at least one approval
2. CI/CD checks must pass
3. Code coverage should not decrease
4. Follow existing code style and patterns

## 🎨 Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript/JavaScript**: Use ESLint configuration provided
- **React**: Follow React best practices and hooks guidelines

## 🔒 Security

- Never commit private keys or sensitive data
- Use `.env.example` as a template
- Report security vulnerabilities privately to the maintainers

## 📚 Documentation

- Update README.md if you change functionality
- Add JSDoc comments for complex functions
- Update ARCHITECTURE.md for architectural changes

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## 💡 Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Problem statement
- Proposed solution
- Impact assessment

## 📞 Getting Help

- Open a [GitHub Discussion](../../discussions)
- Check existing issues and documentation
- Join our community channels (if applicable)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PhantomBet!** 🎭✨
