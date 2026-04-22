# GitHub Pages Setup

## What is ready

- The deployable site is generated into `docs/`.
- `docs/.nojekyll` is included so GitHub Pages serves the files as plain static assets.
- The site uses relative paths, so it works both at a custom domain and at a repo URL like `https://username.github.io/repo-name/`.

## Rebuild the GitHub Pages bundle

From the project root, run:

```bash
python3 scripts/build_github_pages.py
```

That command:

1. Rebuilds the corpus data bundle.
2. Rebuilds the OpenAlex data script.
3. Copies the published site into `docs/`.

## Publish on GitHub Pages

1. Create a GitHub repository and push this project to it.
2. On GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: your default branch, usually `main`
   - `Folder`: `/docs`
4. Save.
5. Wait for GitHub Pages to finish publishing.

Your URL will usually be:

- `https://USERNAME.github.io/REPOSITORY-NAME/`

If you use a custom domain, add it in the same GitHub Pages settings panel.

## Updating the site later

Whenever you change the analysis, layout, or data:

```bash
python3 scripts/build_github_pages.py
```

Then commit and push the updated `docs/` files.
