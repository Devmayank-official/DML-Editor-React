const tagOnly = /^([a-zA-Z][\w-]*)$/;
const tagWithClass = /^([a-zA-Z][\w-]*)\.([\w-]+)$/;
const tagWithId = /^([a-zA-Z][\w-]*)#([\w-]+)$/;
const repeatPattern = /^([a-zA-Z][\w-]*)(?:\.([\w-]+))?\*(\d+)$/;

export const expandEmmetAbbreviation = (abbreviation: string): string | null => {
  const source = abbreviation.trim();
  if (!source) return null;

  const repeated = source.match(repeatPattern);
  if (repeated) {
    const [, tag, className, amount] = repeated;
    const count = Math.min(25, Math.max(1, Number(amount) || 1));
    const body = Array.from({ length: count }, (_, index) => {
      const classAttr = className ? ` class="${className}-${index + 1}"` : '';
      return `<${tag}${classAttr}></${tag}>`;
    }).join('\n');
    return body;
  }

  const withClass = source.match(tagWithClass);
  if (withClass) {
    const [, tag, className] = withClass;
    return `<${tag} class="${className}"></${tag}>`;
  }

  const withId = source.match(tagWithId);
  if (withId) {
    const [, tag, id] = withId;
    return `<${tag} id="${id}"></${tag}>`;
  }

  const plain = source.match(tagOnly);
  if (plain) {
    const [, tag] = plain;
    return `<${tag}></${tag}>`;
  }

  return null;
};
