# Contributing to datacenter-planner

Thank you for your interest in contributing to datacenter-planner! We welcome contributions from the community. This document outlines the guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please report it by opening an issue on GitHub. Include:
- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node.js version)

### Suggesting Features

Feature requests are welcome! Please open an issue with:
- A clear description of the proposed feature
- Why it would be useful
- Any relevant examples or mockups

### Contributing Code

1. **Fork the Repository**: Click the "Fork" button on GitHub to create your own copy.

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/datacenter-planner.git
   cd datacenter-planner
   ```

3. **Create a Branch**: Create a new branch for your changes.
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**: Implement your changes following the code style guidelines below.

5. **Test Your Changes**: Run the development server and test your changes.
   ```bash
   npm start
   ```

6. **Run Linting**: Ensure your code passes linting.
   ```bash
   npx eslint .
   ```

7. **Commit Your Changes**: Write clear, concise commit messages.
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   ```

8. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request**: Open a pull request on GitHub. Provide a clear description of your changes and why they are needed.

### Code Style Guidelines

- Follow the existing code style in the project
- Use ESLint for code linting (run `npx eslint .` before committing)
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused on a single responsibility

### Development Setup

- Node.js 16 or higher
- npm for package management
- Run `npm install` to install dependencies
- Use `npm start` for development server
- Use `npm run build` for production build

### Commit Message Guidelines

- Use the present tense ("Add feature" not "Added feature")
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep the first line under 50 characters
- Add a more detailed description if needed

### Pull Request Guidelines

- Ensure your PR addresses a specific issue or feature request
- Provide a clear description of the changes
- Reference any related issues
- Keep PRs focused on a single feature or fix
- Be open to feedback and make requested changes

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to foster an inclusive and welcoming community.

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to datacenter-planner!