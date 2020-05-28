export const hash = (str: string):string => {
  var hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export const getElementArray = (nl: NodeList): Array<HTMLElement> => {
  return Array.prototype.slice.call(nl)
}

export const getZedAttr = (elem: HTMLElement): number => {
  const _zed = elem.getAttribute('zed')
  if (!!_zed) {
    return parseFloat(_zed)
  } else {
    return 0
  }
}