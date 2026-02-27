# Comminit

[![Built with Nuxt 3](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Enhanced with Everything Claude Code](https://img.shields.io/badge/ECC-Enhanced-FF6B35?logo=anthropic&logoColor=white)](https://github.com/affaan-m/everything-claude-code)

Open source community platform built with Nuxt 3 + Supabase, enhanced with production-ready Claude Code configurations.

## ✨ Features

### Core Platform
- 🔐 **User authentication** - Email/password with Supabase Auth
- 📝 **Create and view posts** - Rich content creation and browsing
- 💬 **Comment system** - Nested discussions and replies
- 🔔 **Notification center** - Real-time activity updates
- 📱 **Responsive design** - Mobile-first, accessible UI
- 🚀 **Fast performance** - Vue 3 composition API, Nuxt 3 optimizations

### Enhanced Development Workflow (ECC Integration)
- 🛡️ **Security scanning** - Automated security reviews with AgentShield (1282 tests, 102 rules)
- 📋 **Code quality** - 29 rule files covering TypeScript, Python, Go, Swift, and common best practices
- 🔄 **Hook system** - 16 JavaScript hooks for session management, file editing, and security monitoring
- 🤖 **AI-assisted development** - OpenCode plugin with 12 agents, 24 commands, and 16 skills
- 📊 **Performance optimization** - Token optimization, memory persistence, continuous learning patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd comminit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## 🏗️ Project Structure

```
comminit/
├── components/           # Vue components
├── pages/               # Nuxt pages and routing
├── layouts/             # Layout components
├── composables/         # Vue composables
├── stores/              # Pinia stores
├── middleware/          # Route middleware
├── assets/              # Static assets
├── types/               # TypeScript definitions
├── supabase/            # Supabase schema and migrations
├── .cursor/             # ECC rules and hooks (29 rules, 16 hooks)
├── .opencode/           # OpenCode plugin (12 agents, 24 commands)
└── .claude/             # Claude configuration
```

## 🔧 Development Workflow

### Using Integrated ECC Tools

Your project now includes battle-tested Claude Code configurations from an Anthropic hackathon winner. These tools help with:

1. **Code Quality Assurance**
   ```bash
   # Auto-format and check for issues
   # (hooks run automatically on file edits)
   ```

2. **Security Reviews**
   ```bash
   # Run security analysis
   # (security hooks monitor for sensitive data)
   ```

3. **Development Agents**
   - **planner** - Implementation planning for complex features
   - **architect** - System design and architecture decisions
   - **tdd-guide** - Test-driven development workflow
   - **code-reviewer** - Automated code review
   - **security-reviewer** - Security analysis
   - **build-error-resolver** - Build error fixes
   - **doc-updater** - Documentation updates

### Git Workflow

Follow conventional commits:
```
<type>: <description>

<optional body>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Example:
```bash
git commit -m "feat: add user profile page with avatar upload"
git commit -m "fix: resolve authentication token expiry issue"
git commit -m "docs: update README with ECC integration details"
```

## 📖 Available Agents & Commands

### Key Agents (from `.cursor/rules/common-agents.md`)
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

### OpenCode Commands (from `.opencode/`)
- `/plan` - Create implementation plan
- `/tdd` - TDD workflow
- `/code-review` - Review code changes
- `/security` - Security review
- `/build-fix` - Fix build errors
- `/e2e` - E2E tests
- `/refactor-clean` - Remove dead code

## 🛡️ Security & Best Practices

Following ECC rules from `.cursor/rules/`:

### Immutability (CRITICAL)
Always create new objects, never mutate existing ones:
```typescript
// ✅ GOOD: Returns new copy
function updateUser(user, name) {
  return { ...user, name }
}

// ❌ BAD: Mutates original
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}
```

### Error Handling
Always handle errors comprehensively:
- Provide user-friendly error messages in UI-facing code
- Log detailed error context on the server side
- Never silently swallow errors

### Input Validation
Always validate at system boundaries:
- Validate all user input before processing
- Use schema-based validation where available
- Fail fast with clear error messages

## 🚀 Deployment

### Vercel Deployment
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Docker Deployment (Example)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📚 Code Quality Checklist

Before marking work complete (from `.cursor/rules/common-coding-style.md`):
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### PR Guidelines
- Include comprehensive PR summary
- Add test plan with TODOs
- Ensure code follows ECC rules
- Run security review before submission

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nuxt 3** - The intuitive Vue framework
- **Supabase** - Open source Firebase alternative
- **Everything Claude Code** - Production-ready AI development configurations
- **OpenCode** - Plugin system for enhanced development workflow

---

**Built with ❤️ using modern web technologies and enhanced with battle-tested AI development tools.**