![image](https://github.com/user-attachments/assets/033cc175-5f04-439b-9b92-264650bb012f)

# OSEM🤘🏼🌲

## Open Source Environmental Movement

OSEM is aggregating the biggest repository of open-source reforestation data in the world.

This project has grown out of the experience planting 10's of millions of seedlings in Canada and raw enthusiasm for reforestation data! 🤖️🌲️🌲️

We are just [building the web app](https://github.com/OSEMSAUCE/OSEM) atm but the thesis is this... if we publish even 5% of reforestation data (who planted what trees, where, and when), would it tilt the whole industry towards transparency? The goal is reforestation market efficiency, productivity, and the impetus to compete on transparency and specifications rather than meaningless emotive marketing campaigns.

The resulting data from our work will be free to use for research, visualizations 📊️, and inquiries on real-world reforestation data. Our observation is market failure due to lack of trust in reforestation and nature based solutions and that this can be addressed through transparency and data. Like a sport, a stock market, research, and commerse: open access to information improves markets, drives competition and innovation. We will do the same with reforestation, by introducing the high standards of open source.

**Join us, there is TONS of work to be done.**

## Be OSEM😎️🌲!

**YOU** or person / org that contributes, is OSEM. Please contribute much-needed reforestation data, or web dev work, and you'll be OSEM🤘🌲 forever we promise.
For large disclosures, you can promote your data science or web dev contributions as OSEM. For real big disclosures, we use our sister org - [Ground Truth Forest News](https://groundtruth.app/) to write and promote your work as actual news stories 📢️

---

## 🚀 Get Started

1. **Explore** [the repos](https://github.com/orgs/OSEMSAUCE/repositories) and active projects.
2. **Find, clean, share data**: Every row of data makes a difference. See below for data details.
3. **Join discussions** by opening issues or contributing directly to ongoing projects.
4. **Spread the word**: Help grow the movement and encourage others to contribute!
5. **Reach out**: if you're serious about helping and you think you can find some great reforestation data please reach out.

---

## 🌳 We Need Your Help: Contribute Tree Planting Data

We’re building the first centralized open dataset to track the **who, what, where, and when** of global tree planting efforts. This dataset is the backbone of our mission, and **we can’t do it without your help.**

### 🎯 The Data We’re Looking For:

- **Who** planted the trees (e.g., organization, company, or group).
- **What** trees were planted (species information is a huge bonus!).
- **Where** the trees were planted (specific GPS coordinates or location names).
- **When** the planting happened (specific dates or timeframes).

📋 **Example Dataset**  
Here’s a [sample dataset](#) to show you the structure we’re looking for (Google Sheets).

---

### 🌐 How You Can Help

#### 1. **Find Tree Planting Data**

Governments, NGOs, and organizations often publish tree-planting stats. Some places to start:

- [Canada Open Data Portal](https://open.canada.ca)
- Look for government or environmental data portals in any country and search "reforestation"
  <img src="https://github.com/user-attachments/assets/9432163f-cfbf-4716-b328-cc6da2f0a68b" alt="Image description" width="400" />

#### 2. **Share or Clean Data**

- If you have raw tree planting data, upload it to the repository!
- Help us **clean and preprocess** data so it’s ready for analysis.

#### 3. **Build Tools**

Love to code? We need developers to:

- Help me with the [Transplant App](https://github.com/OSEMSAUCE/transplant) App
- Automate data pipelines (ETL: Extract, Transform, Load).
- Build tools to analyze or visualize the dataset.
- Create applications to distribute and manage this data.

---

## 🌟 Why This Matters

While reforestation is critical in fighting climate change, it also raises a lot of valid questions about validity claims, vague reporting, and other BS. This harms funders, ecosystems, and those of us who work our asses off to plant trees and do other legitimate environmental good.

This project:

- Tracks global reforestation production and shares it as clean, transparent data sets available for everyone, no strings attached.
- Promotes transparency and accountability.
- Elevates the quality of reforestation work worldwide
- is run and managed by actual reforestation: workers, contractors, and software developers.

---

## 🚀 Get Started

1. **Clone the repo** and explore active projects.
2. **Find, share, or clean data**: Every row of data makes a difference.
3. **Join discussions** by opening issues or contributing directly to ongoing projects.
4. **Spread the word**: Help grow the movement and encourage others to contribute!

---

## 💻 Developer Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env:
# PUBLIC_API_URL=https://your-api.com
# VITE_MAPBOX_TOKEN=your-token-here

# 3. Start dev server
npm run dev
```

**That's it!** The app is now running:

- **Frontend:** http://localhost:5174
- **Map:** http://localhost:5174/map
- **Dashboard:** http://localhost:5174/dashboard

## Environment Variables

```bash
# .env
PUBLIC_API_URL=https://your-api.com   # Your data API
VITE_MAPBOX_TOKEN=your-mapbox-token   # Get free at mapbox.com
```

## Tech Stack

- **Frontend:** SvelteKit 5 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn-svelte
- **Maps:** Mapbox GL JS v3.14
- **State:** Svelte 5 runes ($state, $derived, $effect)
- **Deployment:** Vercel, Netlify, or any static host

## Project Structure

```
src/
├── routes/              # SvelteKit pages
├── lib/
│   └── subwoof/         # Shared components
│       ├── components/  # UI components
│       ├── routes/      # Dashboard & Map pages
│       ├── styles/      # CSS (base.css, map.css)
│       └── types/       # TypeScript types
└── app.css              # Theme & Tailwind config
```

## Customization

### Styling

Edit `src/app.css` to customize the theme:

```css
@theme {
	--color-primary: #theme-color;
	--color-accent: #accent-color;
}
```

### Static Data

Add GeoJSON files to `static/claims/` for map layers.

### Components

The `src/lib/subwoof/components/ui/` directory contains shadcn-svelte components. Create wrapper components in `components/what/` for customization.

## API Requirements

OSEM expects these endpoints from your API:

- `GET /api/dashboard` - Dashboard data
- `GET /apiwhere/polygons` - GeoJSON FeatureCollection

## Deployment

Deploy to any static host:

```bash
npm run build
```

**Environment variables needed:**

- `PUBLIC_API_URL` - Your API endpoint
- `VITE_MAPBOX_TOKEN` - Mapbox access token

---

## ⚖️ Legal

- **License:** [MIT License](LICENSE) (Code is open source)
- **Trademarks:** "OSEM" name and logo are owned by **Ground Truth Data Inc.**
- **Privacy:** [Privacy Policy](PRIVACY.md)
- **Terms:** [Terms of Use](TERMS.md)

---

Have questions or ideas? Drop a comment, open an issue, or DM us. Let’s plant a trillion trees for real! 🌲️🌲️🌳️🌳️🌴️
