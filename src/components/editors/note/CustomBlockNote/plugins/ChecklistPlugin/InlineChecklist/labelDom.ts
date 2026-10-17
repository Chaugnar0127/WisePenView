/** contentEditable 文案 DOM 读写与插入（避免废弃的 document.execCommand） */

export function readLabelDomText(node: HTMLElement | null): string {
  if (!node) return '';
  // 保留 Enter 换行；统一成 \n
  return (node.innerText ?? node.textContent ?? '').replace(/\r\n?/g, '\n');
}

export function focusLabelAtEnd(node: HTMLElement) {
  node.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

type CaretDocument = Document & {
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
};

/** 进入编辑时尽量把光标放到点击位置；浏览器不支持坐标命中时回退到末尾。 */
export function focusLabelAtPoint(node: HTMLElement, clientX: number, clientY: number) {
  node.focus();
  const selection = window.getSelection();
  if (!selection) return;

  const doc = node.ownerDocument as CaretDocument;
  let range: Range | null = null;
  if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(clientX, clientY);
  } else if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(clientX, clientY);
    if (position) {
      range = doc.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
    }
  }

  if (!range || !node.contains(range.startContainer)) {
    focusLabelAtEnd(node);
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function getEditableRange(host: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!host.contains(range.commonAncestorContainer)) return null;
  return range;
}

function placeCaretAfter(selection: Selection, node: Node) {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** 在光标处插入纯文本（`\\n` 转成 br） */
export function insertPlainTextAtCaret(host: HTMLElement, text: string): boolean {
  const selection = window.getSelection();
  const range = getEditableRange(host);
  if (!selection || !range) return false;

  range.deleteContents();

  const parts = text.replace(/\r\n?/g, '\n').split('\n');
  let lastNode: Node | null = null;

  parts.forEach((part, index) => {
    if (part.length > 0) {
      const textNode = document.createTextNode(part);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      lastNode = textNode;
    }
    if (index < parts.length - 1) {
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      lastNode = br;
    }
  });

  if (lastNode) {
    placeCaretAfter(selection, lastNode);
  }
  return true;
}
