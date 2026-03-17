#!/bin/bash
# Install/update the scoring cron job from scoring.cron file
# Usage: ./install_cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_FILE="$SCRIPT_DIR/scoring.cron"

# Extract the actual cron line (line 9, the non-comment line)
CRON_LINE=$(sed -n '9p' "$CRON_FILE")

# Remove any existing scoring cron jobs
crontab -l 2>/dev/null | grep -v "score_projects.ts" | crontab -

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "✅ Cron job installed:"
echo "$CRON_LINE"
echo ""
echo "To verify: crontab -l"
