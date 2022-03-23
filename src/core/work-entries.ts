import rawEntries, { WorkEntry } from '@/content/work.yaml';
export { WorkEntry as WorkEntryData };

const anchorOpenMatcher = /<a .+?>/g;

const formatBody = (body: string) => {
  return '<p>' + body.replace(/\n+/g, '</p><p>') + '</p>';
};
const deAnchorBody = (body: string) => {
  return body.replace(anchorOpenMatcher, '<span>').replace('</a>', '</span>');
};

export const workEntries: WorkEntry[] = [];
rawEntries.forEach(entry => {
  if (! entry) return;
  workEntries.push(entry);
  if (entry.processed) return;
  
  entry.body = formatBody(entry.body);
  entry.false_body = deAnchorBody(entry.body);
  entry.page_title = entry.page_title || entry.title;
  entry.aria_title = entry.title + ': ' + entry.subtitle;
  entry.fallback_extension = entry.fallback_extension || 'jpg';
});
