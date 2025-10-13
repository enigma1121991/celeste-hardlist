import { getTagColor } from '@/components/utils/colors';

export const formatMapName = (title: string) => {
  const tagRegex = /^\[(.*?)\]/; // [tag name]
  const suffixRegex = /\(([^)]+)\)$/; // captures text inside (...) at end
  const isFullClear = title.endsWith("[FC]");
  const isClear = title.endsWith("[C]");
  const isAllMaps = title.endsWith("[All Maps]")
  const tagMatch = title.match(tagRegex);
  const suffixMatch = title.match(suffixRegex);

  let titleWithoutTag = tagMatch ? title.replace(tagRegex, '').trim() : title;
  let suffix = '';

  if (isFullClear) {
    titleWithoutTag = titleWithoutTag.replace("[FC]", '').trim();
  }

  if (isClear) {
    titleWithoutTag = titleWithoutTag.replace("[C]", '').trim();
  }

  if (isAllMaps) {
    titleWithoutTag = titleWithoutTag.replace("[All Maps]", '').trim();
  }

  if (suffixMatch) {
    suffix = suffixMatch[1];
    titleWithoutTag = titleWithoutTag.replace(suffixRegex, '').trim();
  }

  const tag = tagMatch ? tagMatch[1] : '';

  let suffixColor: string | undefined;
  if (suffix?.toLowerCase().includes('ending')) {
    suffixColor = '#00FFFF';
  } else if (suffix === 'B-Side') {
    suffixColor = '#ff4fa4';
  }

  return (
    <>
      {tag && (
        <span style={{ color: getTagColor(tag) || 'inherit' }}>
          {` [${tag}] `}
        </span>
      )}
      {titleWithoutTag}
      {suffix && (
        <span style={{ color: suffixColor || 'inherit' }}>
          {` (${suffix})`}
        </span>
      )}
      {isFullClear && (
        <span style={{ color: '#ffff00' }}>
          {` [FC]`}
        </span>
      )}
      {isClear && (
        <span style={{ color: '#00ff00' }}>
            {` [C]`}
        </span>
      )}
        {isAllMaps && (
        <span style={{ color: '#ff0000' }}>
            {` [All Maps]`}
        </span>
      )}
    </>
  );
};