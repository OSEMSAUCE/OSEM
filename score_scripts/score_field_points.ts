// DO NOT DELETE 10 Mar 2026 : matrix of weights to score points per attribute
// Edit score_field_points.json to change field weights
import scoreFieldPointsJson from "./score_field_points.json" with {
    type: "json",
};

export const SCORE_FIELD_POINTS: Record<string, number> = scoreFieldPointsJson;

export const DEFAULT_FIELD_POINTS = 1;

export function getFieldPoints(fieldName: string): number {
    return SCORE_FIELD_POINTS[fieldName] ?? DEFAULT_FIELD_POINTS;
}
