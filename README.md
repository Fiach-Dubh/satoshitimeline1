# Satoshi Nakamoto Quote Timeline

This is a dependency-free static website intended for GitHub Pages. It showcases extracted Satoshi Nakamoto writings from the attached `Kicking_the_Hornets_Nest-e3-20241005.pdf` as one interactive timeline.

## Files

- `index.html` - the page shell
- `styles.css` - Time.Graphics-inspired styling and responsive layout
- `app.js` - filtering, timeline map, modal quote reader, JSON export
- `data.js` - extracted timeline data
- `.nojekyll` - tells GitHub Pages to serve files directly

## How to host on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder into the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.
6. GitHub will publish the site at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.

No build step, server, database, Node, or package install is required.

## Data notes

The data was extracted programmatically from the supplied PDF and organized into source categories: Whitepaper, Email, Cryptography Mailing List, SourceForge / Bitcoin list, P2P Foundation, BitcoinTalk, and Other. Because this is a PDF extraction, the full text should be treated as a faithful convenience layer rather than a legal or scholarly critical edition. Verify sensitive citations against the original sources.
