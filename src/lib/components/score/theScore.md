# The Score.md
**Updated: 19 Feb 2026 - Live Scoring System Complete**

## Current Status ✅
- **Live scoring via materialized view** - No manual recalculation needed
- **Single source of truth:** `caseStateDraft.sql` contains complete scoring logic
- **Deploy command:** `./MASTER.sh deploy_scoring` 
- **Scores:** ~22-90% (realistic data transparency percentages)
- **Performance:** Materialized view handles 100k+ projects efficiently
- **Data governance focus:** Projects with good source/stakeholder data score higher

---

*Original documentation (23 Jan 2026):* 

## Summary
@%2Bpage.svelte#L178-180 whats a good way to insurt a basic looking grass/weeds pagebreak thing below which will be the deetails (The Weeds - metaphore). Above will be "The Score" which will be some kind of dashboard thing showing the output of this file @score.ts#L1-23 @theScore.md#L1 
 
It examines projects, projects agregate to organizations.  
For organizations the score will be vieable here
@whoSpecific-template.svelte#L1-197 

Note it ties into the Schema and some data will be stored but its not clear what all yet. 
@schema.prisma#L40-72 

## Steps 
## Part 1 - Scoring

### Step 1

How many attributes to a project record on the relevant tables of 
````
[
    ProjectTable,
    LandTable,
    PlantingTable,
    PolyTable,
    OrganizationLocalTable,
    StakeholderTable,
    SourceTable
]
```

### Step 2
How many attributes were populated on those attributesAvalible. 

### Step 3
Of those attributes, some were FAR MORE valuable than others. 
So we need a  scoreMatrix. an object of keyValue pairs 
const scoreMatrix = {
    polygons: 20,
    polygonPartial: 2,
    gpsLat: 5,
    gpsLon: 5,
    cropName: 5,
    speciesId: 5,
    plantingDate: 5,
    stakeholder: 2,
    pricePerUnitUSD: 3,
    polygonId
}
an ignore list of attributes that should not be scored on any table:
const ignoreList = [
    'id',
    'lastEditedAt',
    'editedBy',
    'deleted',
    'createdAt'
]

### Step 4
polygonCalc is a function that aggregates the finds number of trees planted per ha. if it's less that 200 trees/ha it's not graded at 2 points instead of 20. if its less than 10 trees/ha it's not graded at all.

### Step 5 - pointsScored
Add all the points. If there's 2 lands in a project each with good polygons, landName and stakeholders and only one with a tree name it will get.  points each per polygon and 1 point per landName 
Like this
attribute  |points | Units  | subtotal
--------------------------------------
polygon    |  20   |   2    |  40
landName   |  1    |   2    |  2
landId.    |  1    |   2    |  2
cropName   |  2    |   2    |  4
speciesId  |  2    |   2    |  4
etc etc...
----------------------------------------
Total      |  X    |   X    |  52

But much longer list of attributes.


## Part 2 - Tracking - Calc fields

### Step 6 - pointsAvailible attribute 
So in the end it should calcualte teh points availible,
How many points COULD have been scored given all the points per land that could have been scored (not including polymorphic points like stakeholder that can incure over and over per site.)

### Step 7 - score
divide pointsScored (point 5 above) by pointsAvailible to get a percentage.


## Part 3 - orgScore

### Step 9 - orgSubScore
Figure:
forEach org on OrganizationMasterTable, take all thier projects and, like project points, divided orgPointsScored by orgPointsAvailible. and Record those in db. orgScore table the points, availible points and orgSubScore.

### Step 10 - claimPercent
If the org has no claim total on the claim table,
then thier total trees planted is the claim total.
if they do have a claim total we have to calculate these:
 claimCountAve Int
  claimCounted Int
  claimPercent Decimal
  Again, divide all the total claimed trees org wide, and find the ave amount. If somewhere is written 1 Million trees and elsewhere written 1.1 million trees. Then claimCountAve is 1.05 million trees.
  If actual, accounted for planted is 50,000 then thier claimPercent would be 50,000 / 1,050,000 = 4.76%
  
### Step 11 Segmentation - Most Popular StakeholderType
  Take all the stakeholderType associated with thier name and find the most popular one. Lable them that in the orgScore table.

 ### Step 12 - orgScore 
Now take thier average score per tree from thier projects and divide average it from all thier claimed trees. If they got a score of 500 points over 8 sites. then the ave orgSubScore is 62.5. If they've disclosed 10,000 trees in those 8 sites out of an average total of 210,000 trees, then the % disclosed is 4.76%, then the score is 62.5 * 4.76% = average is 2.97 points per site. 
If the aveage of all thier counterparts among thier StakeholderType is 5 points, then well thier in the BLANK percentile. I guess I dont know how to calcualte percentile. 



---

## Implementation Status

### ✅ Steps 1-7 Complete (Project Scoring)

**Files (all in `OSEM/src/lib/components/score/`):**
- `scoreConfig.ts` — single source of truth: config, types, pure functions (`scoreMatrix`, `ignoreList`, `polygonCalc`, `scoreRecord`)
- `scoreCalc.ts` — `calculateProjectScore(db, projectId)` + `runAllScores(db)` + `calculateOrgScore(db, masterId)` + `runAllOrgScores(db)`

**API Route:** `src/routes/api/score/+server.ts`
- GET — fetch stored scores (all or single project)
- POST — recalculate all project + org scores, upsert to DB

**What's Working:**
- **Step 1-2**: Dynamic attribute counting from all relevant tables
- **Step 3**: Weighted scoring via `scoreMatrix` + `ignoreList`
- **Step 4**: `polygonCalc()` - density-based polygon scoring (≥200 trees/ha = 20pts, ≥10 = 2pts)
- **Step 5**: `pointsScored` - sums all populated attribute points across project
- **Step 6**: `pointsAvailable` - excludes polymorphic tables (StakeholderTable, OrganizationLocalTable are bonus only)
- **Step 7**: `score = (pointsScored / pointsAvailable) * 100` - can exceed 100% with bonus points

**Key Design Decisions:**
- PolygonTable used for geometry/hectaresCalc (not PolyTable)
- CropTable added to relevantTables
- Polygon density uses PlantingTable.planted summed per land
- Polymorphic tables = bonus points (score can exceed 100%)
- OrganizationLocalTable scored via StakeholderTable linkage

**Database Schema (Score table):**
- `scoreId` (PK), `projectId` (@unique), `score`, `pointsAvailible`, `pointsScored`
- `polygonToLand` removed (Feb 2026) — was redundant with pointsScored

### ✅ Steps 9-12 Complete (Organization Scoring)

**All orgs get scored.** Master-linked orgs aggregate all local orgs under the master. Unlinked orgs (no `organizationMasterId`) are scored standalone using their `organizationLocalId` as the key in OrgScore.

**What's Working:**
- **Step 9**: `orgSubScore` — aggregates project scores for all local orgs under a master org
- **Step 10**: `claimPercent` — computed in memory (not stored). If no claims, planted = claim total (100%)
- **Step 11**: Most popular `stakeholderType` from all StakeholderTable mentions
- **Step 12**: `orgScore = orgSubScore × (claimPercent / 100)`, percentile within stakeholderType group

**Database Schema (OrgScore table):**
- `orgScoreId` (PK), `organizationMasterId` (@unique), `organizationId`
- `orgScore`, `orgSubScore`, `orgPercentile`, `orgPointsAvailible`, `orgPointsScored`
- `claimCounted`, `orgSubScoreByClaim`, `stakeholderType`, `stakeholderAverage`
- `claimPercent` and `claimCountAve` removed (Feb 2026) — computed on the fly, not stored

**Display:**
- `/what?project=X` — project score card under "The Score" DotMatrix (score %, points scored, points available)
- `/who/[orgId]` — org score card (Data Quality %, Percentile, Trees Counted, Points, Category)

### ✅ Claims Infrastructure Complete

**Schema:**
- `ClaimTable` — `claimId`, `claimCount`, `organizationLocalId`, `sourceId`, `deleted`, `editedBy`
- `claimTable` added to `ParentTableEnum`
- `displayRank Int? @default(0)` added to `SourceTable` (for ordering claim evidence)

**Admin Page:** `/admin/claims`
- `+page.server.ts` — auth, load claims with joined org + source data, `createClaim` + `deleteClaim` actions
- `+page.svelte` — auth gate, table of existing claims, form to add new claim (select org, enter count, paste source URL)
- Sources with `parentTable === "claimTable"` are claim evidence, sorted by `displayRank` DESC

**Foundr Integration:**
- `Foundr/scripts/3Map.ts` — `"claimTable"` added to `createSourceIds()` and `createStakeholderIds()` parentTable unions
- `Foundr/scripts/5UpsertBulk.ts` — `ClaimTable` in `ID_FIELDS`, `REQUIRED_FIELDS`, `dependencyOrder`

---

## Usage

### Calculate & Upsert Scores

Scores auto-run on `./MASTER.sh dev_start` (background, after server is up).

**Manual recalculate** (standalone):
```
./MASTER.sh calcScore
```

**Or via curl:**
```
curl -X POST "http://localhost:5173/api/score?code=<HELPER_CODE>"
```

**Get stored scores** (GET):
```
http://localhost:5173/api/score?code=<HELPER_CODE>
```

**Score a single project** (GET):
```
http://localhost:5173/api/score?code=<HELPER_CODE>&project=<projectId>
```

### Claims Admin

```
http://localhost:5173/admin/claims?code=<HELPER_CODE>
```

---

## Next Steps

### Claims Enhancements — Photo Upload via Supabase Storage

**Goal:** Drag-drop photo upload on `/admin/claims` page. Upload claim evidence photos directly, alongside URL sources.

**Approach:** Use Supabase Storage (https://supabase.com/docs/guides/storage)
- Create a `claim-evidence` bucket in Supabase Storage
- On drag-drop or file select, upload photo to bucket, get public URL back
- Create `SourceTable` row with `url` = storage URL, `urlType` = `"image"`, `parentTable` = `"claimTable"`
- Allow submitting a link AND a photo together on the same claim (two SourceTable rows, one ClaimTable row)
- May need schema tweak: ClaimTable currently has single `sourceId` FK — might need to decouple so one claim can have multiple sources

### Expand `/admin/masterOrgs`

- Add editable inputs for all master org fields: `contactName`, `contactPhone`, `gpsLat`, `gpsLon`, `maxTreesPerYear`, `organizationNotes`
- Update `+page.server.ts` action to persist all fields