const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/providers/sidebar-provider.tsx",
  "src/components/resolve-user-id.tsx",
  "src/components/leaderboard-card.tsx",
  "src/components/invite-card.tsx",
  "src/components/group-management-modal.tsx",
  "src/components/floating-menu.tsx",
  "src/components/admin/tables/groups-table.tsx",
  "src/app/profile/page.tsx",
  "src/app/invite/[token]/page.tsx",
  "src/app/invite/[token]/invite-client.tsx",
  "src/app/dashboard/[groupId]/page.tsx",
  "src/app/dashboard/[groupId]/edit-list/page.tsx",
  "src/app/dashboard/create-group/page.tsx",
  "src/app/admin/page.tsx"
];

const workspacePath = 'a:\\DevZone\\gitProjects\\lanecroporra';

for (const relPath of filesToUpdate) {
  const filePath = path.join(workspacePath, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath}, does not exist`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Imports
  content = content.replace(/@\/lib\/firestore\//g, '@/lib/db/');
  
  // Model properties
  content = content.replace(/\.uid/g, '.id');
  content = content.replace(/creatorId/g, 'creator_id');
  content = content.replace(/createdAt/g, 'created_at');
  content = content.replace(/maxBets/g, 'max_bets');
  content = content.replace(/joinedAt/g, 'joined_at');
  content = content.replace(/wikidataId/g, 'wikidata_id');
  content = content.replace(/activityLog/g, 'activity_logs');
  content = content.replace(/inviteLink/g, 'invite_link');
  
  // The member map `group.members[user.id]` is now an array `group.members.find(m => m.user_id === user.id)`.
  // Because my DB repository joined it as an array (using Supabase join `group_members(*)`).
  // Wait, I should just modify `getGroupById` to transform `members` into a map so the UI doesn't break as much,
  // OR write another script later if it breaks. I will first apply this text replacement.

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
