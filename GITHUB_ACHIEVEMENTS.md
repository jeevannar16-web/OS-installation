# GitHub Achievement Farming Guide

## Your Achievements Status
- [x] Already unlocked 2 achievements
- [ ] Pull Shark — earn by contributing to other repos
- [ ] Galaxy Brain — earn by answering in Discussions
- [ ] Starstruck — earn by getting stars
- [ ] Lightning — respond to issues within 5 minutes
- [ ] YOLO — merge PRs without review
- [ ] Heart On Your Sleeve — react with ❤️

---

## Pull Shark ( easiest to earn )

### Step 1: Fork add-one-line-of-code
1. Go to https://github.com/kamiri-charles/add-one-line-of-code
2. Click **Fork** (top right)

### Step 2: Clone and apply my changes
```bash
# Clone YOUR fork
git clone https://github.com/jeevannar16-web/add-one-line-of-code.git
cd add-one-line-of-code

# Copy the changes I prepared
cp /tmp/add-one-line-of-code/src/game/gameLoop.ts src/game/gameLoop.ts
cp /tmp/add-one-line-of-code/src/contributors.ts src/contributors.ts

# Commit and push
git add .
git commit -m "feat: add ground platform for player"
git push origin master
```

### Step 3: Create Pull Request
1. Go to your fork on GitHub
2. Click **"Compare & pull request"**
3. Title: `feat: add ground platform for player`
4. Description: `Added a brown ground platform at the bottom of the canvas so the player has a visual reference for where they're standing.`
5. Click **Create pull request**

### Step 4: Wait for merge
- The repo owner will merge your PR
- You earn **Pull Shark** after 2 merged PRs

---

## Galaxy Brain ( earn by answering Discussions )

### Step 1: Enable Discussions on your repo
1. Go to https://github.com/jeevannar16-web/OS-installation/settings
2. Under "Features", check **Discussions**
3. Click Save

### Step 2: Create Q&A discussions
Create these discussions and answer them yourself:

**Discussion 1: "How does the installer work?"**
> The installer uses XState for state management, React for UI, and real Ubuntu screenshots for each step. Each scene is a standalone component that registers advance functions.

**Discussion 2: "What technologies are used?"**
> React 18, TypeScript 5, XState 5, Vite 5, Tailwind CSS 3, Framer Motion 11, and Lucide React for icons.

**Discussion 3: "How do I contribute?"**
> See CONTRIBUTING.md for step-by-step guide. Easy tasks include fixing typos, adding themes, or improving accessibility.

**Discussion 4: "Can I use this for my school project?"**
> Yes! This is built for educational purposes. You can fork it and customize for your needs.

**Each reply = 1 point toward Galaxy Brain badge**

---

## Starstruck ( earn by getting stars )

### Share on these platforms:
1. **Reddit**: Post to r/webdev, r/reactjs, r/opensource
2. **Twitter/X**: "Built an OS installation simulator in React + TypeScript — every step is interactive! 🐧"
3. **Product Hunt**: Submit at producthunt.com
4. **Hacker News**: "Show HN: OS Installation Simulator"
5. **Dev.to**: Write a article about building it

### Tips for more stars:
- Add a cool demo GIF to README
- Write "Why I built this" section
- Add badges (stars, forks, license)
- Tag it with: `react`, `typescript`, `linux`, `ubuntu`, `simulation`

---

## Lightning ( respond fast )

1. Watch beginner repos for new issues
2. Set up GitHub notifications (email + phone)
3. Reply within 5 minutes
4. Even "Looking into this!" counts

---

## YOLO ( merge without review )

When someone PRs your OS-installation repo:
1. Don't approve the PR
2. Click "Merge pull request" directly
3. You earn YOLO badge

---

## Heart On Your Sleeve

1. Go to any repo's issues/PRs
2. React with ❤️ to 10+ items
3. Badge unlocks automatically

---

## Quick Action Checklist

### Today (5 minutes):
- [ ] Fork add-one-line-of-code
- [ ] Push my changes and create PR
- [ ] Enable Discussions on your repo
- [ ] Create 2 Q&A discussions
- [ ] React with ❤️ to 5 issues anywhere

### This week:
- [ ] PR to 2 more beginner repos
- [ ] Post simulator on Reddit
- [ ] Tweet about it
