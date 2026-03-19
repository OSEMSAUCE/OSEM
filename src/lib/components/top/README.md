# Top Components - WHO/WHAT Shared Architecture

## Current Status

### Components Created
- **TopConfig.ts** - Configuration types for project vs organization modes
- **TopScene.svelte** - Basic wrapper component with visual slot support
- **TopFrame.svelte** - ReTreever-specific wrapper with weedsStage and groundStage slots

### Current URL Status
- ✅ OSEM /what (5173) - Working
- ✅ OSEM /who (5173) - Working
- ❌ ReTreever /what (5174) - Broken (pre-existing ProjectScoreBreakdown import error)
- ✅ ReTreever /who (5174) - Working

## Architecture Plan

### Goals
1. Consolidate WHO and WHAT page logic into shared components
2. Allow ReTreever to add visual branding (dog/weeds/ground) without duplicating logic
3. Keep OSEM plain (no proprietary visuals)
4. Eliminate code duplication between WHO and WHAT pages

### Naming Convention
- `topStage` - Above-ground viewport section (weeds/dog visuals in ReTreever)
- `groundStage` - Below-ground section (roots/subsoil visuals in ReTreever)
- `Top*` components - Shared logic for WHO/WHAT pages

### Proposed Component Structure

```
OSEM/src/lib/components/
├─ top/
│  ├─ TopConfig.ts          # Entity type config (project vs organization)
│  ├─ TopScene.svelte       # Main scene wrapper with visual slots
│  ├─ TopFrame.svelte       # ReTreever visual frame (weeds + ground)
│  ├─ TopHeader.svelte      # Breadcrumbs + entity selector (TODO)
│  ├─ TopRank.svelte        # Rank display (TODO)
│  ├─ TopScore.svelte       # Score card (TODO)
│  └─ TopTable.svelte       # Data tables with tabs (TODO)
├─ score/
│  ├─ ScoreHero.svelte      # Existing - percentile rank with DotMatrix
│  ├─ ScoreDetails.svelte   # Existing - data completion card
│  └─ ScoreCard.svelte      # Existing - combined score display
└─ ground/
   └─ GroundByFieldTable.svelte  # Granular field-by-field breakdown (TODO)
```

### ReTreever Visual Components (Stay in ReTreever)
```
ReTreever/src/lib/
├─ components/
│  ├─ what/
│  │  └─ ReTreeverWeedsHero.svelte  # Dog + weeds banner
│  └─ groundTruth/
│     └─ groundTruth.svelte         # Roots/subsoil visual
```

## Next Steps

### Phase 1: Fix ReTreever /what
1. Fix ProjectScoreBreakdown import error in ReTreeverWhatPage.svelte
2. Verify page loads correctly

### Phase 2: Extract Shared Components
1. Create TopHeader - breadcrumbs + entity selector logic
2. Create TopRank - wrap existing ScoreHero
3. Create TopScore - wrap existing ScoreDetails  
4. Create TopTable - tabs + data table logic

### Phase 3: Migrate OSEM Pages
1. Update OSEM /what to use TopScene + Top components
2. Update OSEM /who to use TopScene + Top components
3. Test both pages work identically to before

### Phase 4: Migrate ReTreever Pages
1. Update ReTreever /what to use TopFrame + Top components + visuals
2. Update ReTreever /who to use TopFrame + Top components + visuals
3. Ensure weeds/dog/ground visuals display correctly

### Phase 5: Ground Components
1. Extract GroundByFieldTable from ProjectScoreBreakdown
2. Display granular score data from ProjectScoreByFieldTable schema
3. Position in groundStage section

### Phase 6: Cleanup
1. Remove deprecated monolithic page components
2. Verify all 4 URLs working
3. Update documentation

## Usage Example (Future State)

### OSEM /what
```svelte
<TopScene>
  <TopHeader config={projectConfig} entities={data.projects} />
  <TopRank config={projectConfig} percentile={data.projectScore?.percentile} />
  <TopScore config={projectConfig} scoreReport={data.scoreReport} />
  <TopTable config={projectConfig} tables={data.availableTables} />
</TopScene>
```

### ReTreever /what
```svelte
<TopFrame>
  {#snippet weedsStage()}
    <ReTreeverWeedsHero weedsBannerUrl={weedsBannerUrl} />
  {/snippet}
  
  <TopScene>
    <TopHeader config={projectConfig} entities={data.projects} />
    <TopRank config={projectConfig} percentile={data.projectScore?.percentile} />
    <TopScore config={projectConfig} scoreReport={data.scoreReport} />
    <TopTable config={projectConfig} tables={data.availableTables} />
  </TopScene>
  
  {#snippet groundStage()}
    <GroundTruth />
    <GroundByFieldTable scoreReport={data.scoreReport} />
  {/snippet}
</TopFrame>
```

## Notes
- Old components moved to `top-old/` directory for reference
- TypeScript strictness may require `any` types initially during migration
- Svelte 5 uses `Snippet` type instead of `slot` syntax
- Test after each component extraction to avoid breaking changes
