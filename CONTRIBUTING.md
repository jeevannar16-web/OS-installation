# Contributing to OS Install Simulator

Thanks for contributing! This guide helps you make your first PR and earn GitHub achievements.

## Quick Start (2 minutes)

1. **Fork** this repo (click Fork button top-right)
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/OS-installation.git
   cd OS-installation
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Start** the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser

## Easy First Contributions

Pick any of these to get your first PR merged:

### 1. Fix a Typo
- Check any `.tsx` or `.md` file for spelling mistakes
- Fix it and submit a PR

### 2. Add a New Theme Color
- Open `src/index.css`
- Add a new theme under the existing themes section
- Example: Add a `dracula` or `nord` theme

### 3. Improve Error Messages
- Find console warnings or errors in the browser
- Fix them and explain what you did in your PR

### 4. Add a New OS Logo
- Create a simple SVG logo for a new OS (e.g., Fedora, Debian)
- Add it to `public/images/` and update the OS list in `src/data/`

### 5. Write a Test
- Add unit tests for any component
- We use Vitest (run with `npm test`)

## Making a Pull Request

```bash
# Create a branch
git checkout -b your-feature-name

# Make your changes, then:
git add .
git commit -m "feat: add your description here"
git push origin your-feature-name
```

Then go to your fork on GitHub and click **"Compare & pull request"**.

## Code Style

- TypeScript strict mode — no `any` types
- Components go in `src/components/scenes/`
- Use Tailwind CSS for styling
- Follow existing patterns (check neighboring files)
- No new dependencies unless absolutely necessary

## Need Help?

Open an issue or comment on your PR — I'll review quickly!

## Earn GitHub Achievements

By contributing here, you can earn:

- **Pull Shark** — Get your PR merged (2+ PRs = badge!)
- **YOLO** — Merge without code review
- **Starstruck** — If this repo gets enough stars
- **Pair Extraordinaire** — Co-author a commit with someone

Ask a classmate to also contribute, and you both earn **Pair Extraordinaire** when you co-author a commit!

---

Made with ❤️ for learning Operating Systems
