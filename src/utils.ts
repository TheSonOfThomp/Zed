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