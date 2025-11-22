# Shared Components

Shared UI components, routes, types, and utilities used by both ReTreever and OSEM projects.

## Structure

```
shared-components/
├── components/       # Svelte components
│   ├── map/         # Map-related components
│   ├── dashboard/   # Dashboard components
│   └── ui/          # UI library components
├── types/           # TypeScript type definitions
├── routes/          # SvelteKit routes
│   ├── map/
│   └── dashboard/
├── static/          # Static assets
│   ├── claims/      # GeoJSON claim data
│   └── geographic/  # Geographic data
└── utils.ts         # Utility functions
```

## Usage

This repository is integrated into parent projects using Git Subtree.

### In ReTreever (source project)

```bash
# Push changes to shared repo
git subtree push --prefix src/lib/shared https://github.com/YOUR_ORG/shared-components main
```

### In OSEM (consuming project)

```bash
# Pull updates from shared repo
git subtree pull --prefix src/lib/shared https://github.com/YOUR_ORG/shared-components main --squash
```

## Development

Make changes in ReTreever, then push to this repo. OSEM pulls updates as needed.
