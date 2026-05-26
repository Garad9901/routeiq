# Contributing to RouteIQ

Thank you for contributing to the RouteIQ Smart Road Intelligence Platform. Please follow these guidelines to maintain enterprise code quality.

## Development Workflow

1. **Branching Strategy**: 
   - Feature branches: `feature/feature-name`
   - Bugfixes: `bugfix/issue-name`
   - Hotfixes: `hotfix/issue-name`
   - Direct pushes to `main` or `master` are protected and will fail.

2. **Commit Message Standards**:
   Follow conventional commits:
   - `feat(roads): add PostGIS spatial query pagination`
   - `fix(auth): resolve JWT expiration logic error`
   - `docs(readme): update deployment parameters`

3. **Code Quality Standards**:
   - Python code must conform to **PEP8** standard. Run checks before committing.
   - Node.js / Next.js code must pass ESLint and Prettier formatting checks.

4. **Testing Requirements**:
   - Every feature must include corresponding unit or integration tests.
   - Run tests locally before raising a PR:
     - FastAPI: `pytest`
     - NestJS: `npm run test`
