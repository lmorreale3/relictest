# True Cross Relic Geospatial Explorer

An interactive map exploring documented relics of the True Cross from approximately the 12th to mid-13th century (c. 1150–1259). Inspired by the [Datini Letters Geospatial Explorer](https://docuracy.github.io/datini/).

**[→ View the live map](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/)**

---

## Features

- **Leaflet base map** with a historic watercolour tile layer (no modern political boundaries)
- **Marker clustering** to handle overlapping points
- **Time slider** to filter relics by documented date range
- **Display modes**: view all relics by location, or colour-code by relic shape or material
- **Checklist filters** for shape, material, and country/region
- **Popup + detail panel** showing all fields from the original catalogue for each relic
- **Collapsible sidebar** for full-screen map viewing

## Project Structure

```
relic-map/
├── index.html        # Main application shell
├── style.css         # All styles
├── app.js            # Map logic, filtering, rendering
├── relics.json       # Geocoded relic data (generated from spreadsheet)
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages auto-deployment
└── README.md
```

## Data

The dataset (`relics.json`) is derived from a scholarly catalogue of True Cross relic attestations organised by decade. Each record includes:

- Catalogue number, year, month, day
- Building / site name
- City / diocese and country
- Relic shape and material
- People mentioned
- Other notes
- Latin/Greek inscriptions
- Primary source citation
- Geocoordinates (manually assigned from city/diocese information)

## Deployment (GitHub Pages)

### First-time setup

1. Create a new repository on GitHub
2. Push all files to the `main` branch:

```bash
git init
git add .
git commit -m "Initial commit: True Cross Relic Explorer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

3. Go to your repository → **Settings** → **Pages**
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically deploy on every push to `main`
6. Your map will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

### Subsequent updates

Just `git add`, `git commit`, and `git push` — the GitHub Actions workflow redeploys automatically.

## Customisation

### Adding or updating relic data

Edit `relics.json` directly, or re-run the Python extraction script with an updated spreadsheet. Each record must include `lat` and `lon` fields for the marker to appear.

### Changing the base map

The tile URL is in `app.js` near the top. Any Leaflet-compatible tile provider can be substituted. For a map without any modern labels, remove or comment out the label tile layer.

### Colour schemes

`SHAPE_COLOURS` and `MATERIAL_COLOURS` arrays in `app.js` define the colour palettes used when display mode is set to "By Shape" or "By Material".

## Credits

- Map tiles: [Stamen Watercolor](https://stamen.com/watercolor/) via [Stadia Maps](https://stadiamaps.com/)
- Mapping: [Leaflet.js](https://leafletjs.com/)
- Clustering: [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- Slider: [noUiSlider](https://refreshless.com/nouislider/)
- Inspired by: [Datini Letters Geospatial Explorer](https://github.com/docuracy/datini)

## Licence

Data and application code are made available for academic and non-commercial use.
