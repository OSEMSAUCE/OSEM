# The Score.md
23 Jan 2026 

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
So we need a  higherAttScoreLegend. an object of keyValue pairs 
const higherAttScoreLegend = {
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



## AI response

### Questions before continuing to Steps 6-12:

1. **PolygonTable vs PolyTable**: Schema has both `PolygonTable` (with `geometry`, `hectares`) and `PolyTable` (with `survivalRate`, `ratePerTree`). Which one holds the actual polygon geometry for `polygonCalc`? Should both be scored?

2. **CropTable missing from relevantTables**: `cropName` and `speciesId` are in `higherAttScoreLegend` but `CropTable` isn't in your list. Add it?

3. **Polygon points source**: For `polygonCalc(treesPlanted, hectares)` - where does `treesPlanted` come from? Is it `PlantingTable.planted` summed per land, or something else?

4. **Stakeholder polymorphism (Step 6)**: You mention stakeholders "can incur over and over per site" - should we cap stakeholder points per project, or count each one?

5. **OrganizationLocalTable scope**: This table isn't project-scoped (no `projectId`). Should it be scored per-project via `StakeholderTable` linkage, or separately at org level only?

6. **Step 5 "Units" column**: Your example shows `Units = 2` for polygon (meaning 2 lands with polygons). Should units multiply the base points, or is it just for the breakdown display?

### Implementation Status:
- ✅ Steps 1-5 scaffolded in `score.ts`
- `calculateProjectScore(projectId)` fetches all relevant tables and scores populated attributes
- `polygonCalc()` ready but not yet integrated (needs answer to Q3)
- Ready to continue to Steps 6-12 after clarification