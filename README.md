# SBC Website

This site uses [Jekyll](https://jekyllrb.com/) for templating and is hosted on GitHub Pages.

> **You cannot preview it by opening `index.html` directly in a browser.** Jekyll must build the site first.

## Local Development

### One-time setup

1. Install [RubyInstaller for Windows](https://rubyinstaller.org/downloads/) — pick **Ruby+Devkit 3.x (x64)**
2. During installation, check **"Add Ruby to PATH"**
3. Open a new terminal and run:
   ```bash
   gem install jekyll bundler wdm
   ```

### Running the site

```bash
jekyll serve
```

Then open [http://localhost:4000](http://localhost:4000) in your browser.

The server watches for file changes and rebuilds automatically. Press `Ctrl+C` to stop.

## Project Structure

```
_layouts/
  home.html       # Main page template (HTML written once)
  schedule.html   # Schedule page template
_data/
  i18n/
    en.yml        # English strings
    ta.yml        # Tamil strings
index.html        # English home (3-line front matter only)
schedule/
  index.html      # English schedule (3-line front matter only)
ta/
  index.html      # Tamil home (3-line front matter only)
  schedule/
    index.html    # Tamil schedule (3-line front matter only)
css/
  style.css       # Shared stylesheet
```

## Translations

All translatable strings live in `_data/i18n/`.

- To update English content → edit `_data/i18n/en.yml`
- To update Tamil content → edit `_data/i18n/ta.yml`

No HTML files need to be touched when updating text content.

## Pages

| URL | Description |
|-----|-------------|
| `http://localhost:4000/` | English home |
| `http://localhost:4000/ta/` | Tamil home |
| `http://localhost:4000/schedule/?type=1` | English schedule |
| `http://localhost:4000/ta/schedule/?type=1` | Tamil schedule |
